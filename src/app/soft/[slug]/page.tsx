
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Monitor, Apple, Smartphone, ShoppingCart, ExternalLink, Download } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

// 强制动态渲染，确保获取最新数据
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

// 生成页面元数据 (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
        where: { slug },
        include: { platforms: true }
    });

    if (!product) {
        return {
            title: '商品未找到 - BuySoft',
        };
    }

    return {
        title: `${product.name} - 正版购买 - BuySoft`,
        description: product.subtitle || product.description?.slice(0, 100) || `${product.name} 正版软件购买`,
    };
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;

    // 获取商品详情
    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            platforms: true,
            channel: true,
        },
    });

    if (!product) {
        notFound();
    }

    // 平台图标映射
    const getPlatformIcon = (name: string) => {
        const key = name.toLowerCase();
        if (key.includes('win')) return <Monitor className="w-4 h-4" />;
        if (key.includes('mac') || key.includes('apple') || key.includes('ios')) return <Apple className="w-4 h-4" />;
        if (key.includes('android')) return <Smartphone className="w-4 h-4" />;
        return <Monitor className="w-4 h-4" />;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航 */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">返回首页</span>
                    </Link>
                    <div className="font-bold text-gray-800 text-lg line-clamp-1">{product.name}</div>
                    <div className="w-20"></div> {/* 占位，保持标题居中 */}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* 商品头部信息 */}
                    <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12">
                        {/* 左侧：图标/封面 */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-gray-100 shadow-inner mx-auto md:mx-0">
                                {product.coverImage ? (
                                    <Image
                                        src={product.coverImage}
                                        alt={product.name}
                                        width={160}
                                        height={160}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <span className="text-4xl font-bold">{product.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 右侧：详细信息 */}
                        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                            {product.subtitle && (
                                <p className="text-lg text-gray-500 mb-6">{product.subtitle}</p>
                            )}

                            {/* 平台标签 */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                                {product.platforms.map((p) => (
                                    <span
                                        key={p.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium"
                                        title={p.name}
                                    >
                                        {getPlatformIcon(p.name)}
                                        {p.name}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-auto flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                                <div className="text-center md:text-left">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-red-600">¥{Number(product.salePrice).toFixed(2)}</span>
                                        <span className="text-sm text-gray-400 line-through">¥{Number(product.originalPrice).toFixed(2)}</span>
                                    </div>
                                    {product.originalPrice > product.salePrice && (
                                        <div className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">
                                            {Math.round((1 - product.salePrice / product.originalPrice) * 100)}% OFF
                                        </div>
                                    )}
                                </div>

                                {product.downloadUrl && (
                                    <a
                                        href={product.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-100 hover:border-blue-200 text-lg font-bold px-8 py-3.5 rounded-xl transition-all hover:scale-105 active:scale-95 min-w-[160px]"
                                    >
                                        <Download className="w-5 h-5" />
                                        下载试用
                                    </a>
                                )}

                                <a
                                    href={product.cpsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 min-w-[200px]"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    立即购买
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-px bg-gray-100 mx-8"></div>

                    {/* 商品介绍 */}
                    <div className="p-8 md:p-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                            软件介绍
                        </h2>
                        <div
                            className="prose prose-gray max-w-none prose-img:rounded-xl prose-a:text-blue-600 hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: product.description || '<p class="text-gray-500 italic">暂无详细介绍</p>' }}
                        />
                    </div>
                </div>
            </main>

            {/* 底部版权 - 简单版 */}
            <footer className="py-8 text-center text-gray-400 text-sm">
                © {new Date().getFullYear()} BuySoft. All rights reserved.
            </footer>
        </div>
    );
}
