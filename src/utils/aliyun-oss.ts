/**
 * 阿里云 OSS 上传工具
 * 用于处理图片和文件上传到阿里云 OSS
 */

import OSS from 'ali-oss';

// 创建 OSS 客户端实例
export function createOSSClient() {
    return new OSS({
        region: process.env.ALIYUN_OSS_REGION!,
        accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID!,
        accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET!,
        bucket: process.env.ALIYUN_OSS_BUCKET!,
    });
}

// 生成唯一文件名
export function generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    return `${timestamp}-${randomStr}.${extension}`;
}

// 上传文件到 OSS
export async function uploadToOSS(
    file: Buffer,
    fileName: string,
    folder: string = 'products'
): Promise<string> {
    const client = createOSSClient();
    const objectName = `${folder}/${generateFileName(fileName)}`;

    try {
        const result = await client.put(objectName, file);
        // 返回可访问的 URL
        return result.url;
    } catch (error) {
        console.error('OSS 上传失败:', error);
        throw new Error('文件上传失败');
    }
}

// 删除 OSS 文件
export async function deleteFromOSS(url: string): Promise<void> {
    const client = createOSSClient();

    // 从 URL 中提取 object name
    const bucket = process.env.ALIYUN_OSS_BUCKET!;
    const urlObj = new URL(url);
    const objectName = urlObj.pathname.substring(1); // 移除开头的 /

    try {
        await client.delete(objectName);
    } catch (error) {
        console.error('OSS 删除失败:', error);
    }
}

// 上传 Base64 图片
export async function uploadBase64ToOSS(
    base64Data: string,
    folder: string = 'editor'
): Promise<string> {
    // 移除 base64 前缀
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('无效的 Base64 图片格式');
    }

    const extension = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    return uploadToOSS(buffer, `image.${extension}`, folder);
}
