import { NextRequest, NextResponse } from 'next/server';
import { uploadToOSS, uploadBase64ToOSS } from '@/utils/aliyun-oss';

// POST - 上传图片
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        // 处理 Base64 上传（富文本编辑器）
        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { image, folder = 'editor' } = body;

            if (!image) {
                return NextResponse.json({ success: false, error: '请提供图片' }, { status: 400 });
            }

            const url = await uploadBase64ToOSS(image, folder);
            return NextResponse.json({ success: true, url });
        }

        // 处理 FormData 上传
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'products';

        if (!file) {
            return NextResponse.json({ success: false, error: '请上传文件' }, { status: 400 });
        }

        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: '不支持的文件类型' }, { status: 400 });
        }

        // 验证文件大小（最大 5MB）
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: '文件大小不能超过 5MB' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const url = await uploadToOSS(buffer, file.name, folder);

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('上传失败:', error);
        return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
    }
}
