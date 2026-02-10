import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Upload to SM.MS
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ success: false, error: '请上传文件' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: '不支持的文件类型' }, { status: 400 });
        }

        // Validate file size (SM.MS limit is usually 5MB for free users)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: '文件大小不能超过 5MB' }, { status: 400 });
        }

        // 优先从数据库读取配置
        const smmsConfig = await prisma.siteConfig.findUnique({
            where: { key: 'smms_token' }
        });
        
        const token = smmsConfig?.value || process.env.SMMS_TOKEN;

        if (!token) {
            return NextResponse.json({ success: false, error: '服务器未配置 SM.MS Token' }, { status: 500 });
        }

        // Create a new FormData for the upstream request
        const upstreamFormData = new FormData();
        upstreamFormData.append('file', file);
        // upstreamFormData.append('format', 'json'); // S.EE doesn't need this

        console.log('Uploading to S.EE...');

        // Use S.EE API endpoint
        const response = await fetch('https://s.ee/api/v1/file/upload', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: upstreamFormData,
        });

        const responseText = await response.text();
        // console.log('S.EE Raw Response:', responseText.substring(0, 500)); 

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse S.EE response as JSON. Response start with:', responseText.substring(0, 100));
            return NextResponse.json({ 
                success: false, 
                error: '无法连接到 S.EE 服务器 (API 返回非 JSON)。请检查网络或开启代理。' 
            }, { status: 502 });
        }
        
        console.log('S.EE Upload Response:', JSON.stringify(data));

        // S.EE returns code 200 for success, unlike SM.MS which uses code "success" or similar
        // Documentation says code 0, but actual response is 200. We'll accept both.
        if (data.code === 0 || data.code === 200 || data.success === true) {
            // 保存到本地数据库，标记为本站上传
            try {
                await prisma.uploadedImage.create({
                    data: {
                        url: data.data.url,
                        filename: data.data.filename || file.name,
                        width: data.data.width ? parseInt(String(data.data.width)) : null,
                        height: data.data.height ? parseInt(String(data.data.height)) : null,
                        size: data.data.size ? parseInt(String(data.data.size)) : null,
                        hash: data.data.hash,
                        deleteUrl: data.data.delete
                    }
                });
            } catch (dbError) {
                console.error('保存上传记录到数据库失败:', dbError);
                // 即使保存数据库失败，也不应该阻断上传流程，因为图片已经上传成功
            }

            return NextResponse.json({ 
                success: true, 
                url: data.data.url,
                delete: data.data.delete // Optional: return delete link if needed
            });
        } else {
            return NextResponse.json({ success: false, error: data.message || '上传失败' }, { status: 400 });
        }

    } catch (error) {
        console.error('SM.MS 上传失败:', error);
        return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
    }
}
