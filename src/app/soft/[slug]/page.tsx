
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Monitor, Apple, Smartphone, ShoppingCart, ExternalLink, Download } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import ProductGallery from '@/components/ProductGallery';
import RelatedProducts from '@/components/RelatedProducts';
import HotProducts from '@/components/HotProducts';

// 强制动态渲染，确保获取最新数据
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

// 生成页面元数据 (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: slug },
                { id: slug }
            ]
        },
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
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { slug: slug },
                { id: slug }
            ]
        },
        include: {
            platforms: true,
            channel: true,
        },
    });

    if (!product) {
        notFound();
    }

    // 获取站点配置
    const siteConfigs = await prisma.siteConfig.findMany({
        where: {
            key: {
                in: ['footer_copyright', 'footer_description', 'contact_service_link', 'product_sidebar_ad_image', 'product_sidebar_ad_link']
            }
        }
    });
    
    const configMap: Record<string, string> = {};
    siteConfigs.forEach(c => {
        configMap[c.key] = c.value;
    });

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
                    <div className="flex items-center justify-end min-w-[80px]">
                        {configMap.contact_service_link && (
                            <a
                                href={configMap.contact_service_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-[#0e7490] hover:bg-[#0891b2] text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                            >
                                联系我们
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <main className="w-full px-4 py-8 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left Column: Product Info & Related */}
                    <div className="flex-1 min-w-0 max-w-5xl">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* 商品头部信息 */}
                            <div className="p-6 md:p-8 lg:p-10 flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12">
                                {/* 左侧：图标/封面 */}
                                <div className="flex-shrink-0 w-full md:w-[40%] lg:w-[480px]">
                                    <ProductGallery 
                                        images={product.images && product.images.length > 0 ? product.images : (product.coverImage ? [product.coverImage] : [])}
                                        name={product.name}
                                    />
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

                                    <div className="mt-auto w-full md:w-auto mb-6">
                                        <div className="flex flex-col items-center md:items-start">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-4xl font-bold text-red-600">¥{Number(product.salePrice).toFixed(2)}</span>
                                                <span className="text-lg text-gray-400 line-through">¥{Number(product.originalPrice).toFixed(2)}</span>
                                            </div>
                                            {product.originalPrice > product.salePrice && (
                                                <div className="text-sm text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded mt-2 inline-block">
                                                    {Math.round((1 - product.salePrice / product.originalPrice) * 100)}% OFF
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 lg:gap-4 w-full md:w-auto">
                                        {product.downloadUrl && (
                                            <a
                                                href={product.downloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-100 hover:border-blue-200 text-sm md:text-base lg:text-lg font-bold px-4 py-2.5 lg:px-8 lg:py-3.5 rounded-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                            >
                                                <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                                                下载试用
                                            </a>
                                        )}

                                        <a
                                            href={product.cpsLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base lg:text-lg font-bold px-4 py-2.5 lg:px-8 lg:py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                        >
                                            <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
                                            购买正版
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

                        {/* 相关推荐 */}
                        <RelatedProducts currentProductId={product.id} />
                    </div>

                    {/* Right Column: Hot Products */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        {/* 侧边栏广告 */}
                        {configMap.product_sidebar_ad_image && (
                            <div className="mb-8">
                                {configMap.product_sidebar_ad_link ? (
                                    <a 
                                        href={configMap.product_sidebar_ad_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block hover:opacity-95 transition-opacity"
                                    >
                                        <Image
                                            src={configMap.product_sidebar_ad_image}
                                            alt="推荐"
                                            width={320}
                                            height={180}
                                            className="w-full h-auto rounded-xl shadow-sm border border-gray-100"
                                        />
                                    </a>
                                ) : (
                                    <Image
                                        src={configMap.product_sidebar_ad_image}
                                        alt="推荐"
                                        width={320}
                                        height={180}
                                        className="w-full h-auto rounded-xl shadow-sm border border-gray-100"
                                    />
                                )}
                            </div>
                        )}
                        <HotProducts />
                    </div>
                </div>
            </main>

            {/* 底部版权 */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>{configMap.footer_copyright || '© 2026 BuySoft. 正版软件导航平台'}</p>
                    <p className="mt-2 text-xs sm:text-sm">{configMap.footer_description || '本站所有软件均为正版授权，点击购买即跳转至官方或授权渠道'}</p>
                </div>
            </footer>
        </div>
    );
}
