'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { Search, Monitor, Apple, Smartphone, Globe, Home, Star, LayoutGrid, Terminal, Chrome, AppWindow, Tv, Tablet } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import BannerCarousel from '@/components/BannerCarousel';
import CategoryNav from '@/components/CategoryNav';
import type { Product, BannerSlide, FriendLink, SiteConfig } from '@/types';

const platformIcons: Record<string, React.ReactNode> = {
  windows: <LayoutGrid className="w-4 h-4" />,
  macos: <AppWindow className="w-4 h-4" />,
  apple: <Apple className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
  ios: <Apple className="w-4 h-4" />,
  ipad: <Tablet className="w-4 h-4" />,
  linux: <Terminal className="w-4 h-4" />,
  web: <Globe className="w-4 h-4" />,
  'chrome 扩展': <Chrome className="w-4 h-4" />,
  'chrome': <Chrome className="w-4 h-4" />,
  tv: <Tv className="w-4 h-4" />,
};

interface HomePageClientProps {
  initialProducts: Product[];
  totalProducts: number;
  initialBannerSlides: BannerSlide[];
  initialFriendLinks: FriendLink[];
  siteConfig: SiteConfig;
}

export default function HomePageClient({
  initialProducts,
  totalProducts,
  initialBannerSlides,
  initialFriendLinks,
  siteConfig,
}: HomePageClientProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent
        initialProducts={initialProducts}
        totalProducts={totalProducts}
        initialBannerSlides={initialBannerSlides}
        initialFriendLinks={initialFriendLinks}
        siteConfig={siteConfig}
      />
    </Suspense>
  );
}

function HomePageContent({
  initialProducts,
  totalProducts,
  initialBannerSlides,
  initialFriendLinks,
  siteConfig,
}: HomePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(totalProducts);
  const pageSize = 30; // 每页30个商品
  
  const currentPlatform = searchParams.get('platform');
  const activeCategory = currentPlatform || '全部';

  const fetchProducts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (currentPlatform) {
         params.append('platform', currentPlatform);
      }
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPlatform]);

  // 重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [currentPlatform, searchQuery]);

  // Handle data fetching
  useEffect(() => {
    const isInitialPage = currentPage === 1 && !currentPlatform && !searchQuery;
    
    if (isInitialPage) {
        setProducts(initialProducts);
        setTotal(totalProducts);
    } else {
        fetchProducts(currentPage);
    }
  }, [currentPage, currentPlatform, searchQuery, fetchProducts, initialProducts, totalProducts]); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 触发 useEffect 里的 fetchProducts
  };
  
  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      // If we loaded with a platform param, we need to fetch immediately because server data was likely "All"
      if (currentPlatform) {
          fetchProducts(1);
      }
      return;
    }
    // Subsequent updates handled by the other useEffect or explicit calls
  }, [isFirstMount, currentPlatform, fetchProducts]);

  const handleProductClick = (product: Product) => {
    const targetSlug = product.slug || product.id;
    window.location.href = `/soft/${targetSlug}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {siteConfig.site_logo ? (
              <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                <Image
                  src={siteConfig.site_logo}
                  alt={siteConfig.site_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {siteConfig.site_name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">{siteConfig.site_name}</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end max-w-xl">
            {/* Search Box */}
            <form onSubmit={handleSearch} className="flex-1 max-w-[200px] md:max-w-none">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="w-full pl-3 md:pl-4 pr-8 md:pr-10 py-1.5 md:py-2 bg-gray-100 border-none rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-2 md:px-3 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Contact Button */}
            {siteConfig.contact_service_link && (
              <a
                href={siteConfig.contact_service_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium rounded-md transition-colors shadow-sm whitespace-nowrap"
              >
                <span className="hidden md:inline">合作联系</span>
                <span className="md:hidden">客服</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (Light Background) */}
      <div className="bg-slate-50 text-gray-900 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Banner Area */}
          <div className="px-4 py-6">
            {initialBannerSlides.length > 0 ? (
              <div className="rounded-xl overflow-hidden shadow-sm bg-gray-200">
                 <BannerCarousel slides={initialBannerSlides} autoPlayInterval={5000} />
              </div>
            ) : (
               /* Placeholder banner if none exists */
               <div className="h-[200px] sm:h-[280px] bg-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                 <LayoutGrid className="w-12 h-12 mb-2 opacity-50" />
                 <p>暂无广告轮播图</p>
               </div>
            )}
          </div>

          {/* Navigation Bar (Bottom of Hero) */}
          <div className="px-4 pb-1">
            <CategoryNav />
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">暂无商品</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="product-card p-4 relative group"
              >
                {/* 平台图标 (右上角) */}
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  {product.platforms.map((p) => {
                    const iconKey = p.icon || p.name.toLowerCase();
                    return (
                      <span key={p.id} className="text-gray-400" title={p.name}>
                        {platformIcons[iconKey] || <Monitor className="w-4 h-4" />}
                      </span>
                    );
                  })}
                </div>

                {/* 封面图/Logo */}
                <div className="w-16 h-16 mx-auto mb-4 mt-2 rounded-xl overflow-hidden bg-gray-100">
                  {(product.logo || product.coverImage) ? (
                    <Image
                      src={product.logo || product.coverImage || ''}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                      <span className="text-white text-xl font-bold">
                        {product.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 名称 */}
                <h3 className="text-center font-semibold text-gray-900 mb-1">
                  {product.name}
                </h3>

                {/* 简介 */}
                {product.subtitle && (
                  <p className="text-center text-sm text-gray-500 mb-3 line-clamp-1">
                    {product.subtitle}
                  </p>
                )}

                {/* 价格 */}
                <div className="flex items-center justify-center gap-2 mt-auto pt-2">
                  <span className="text-sm font-bold text-red-600">
                    {product.salePriceText ? `¥${product.salePriceText}` : `¥${Number(product.salePrice).toFixed(2)}`}
                  </span>
                </div>

                {/* 购买按钮 */}
                <button className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  获取会员
                </button>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 py-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              
              <span className="text-sm text-gray-600 px-2 font-medium">
                第 {currentPage} / {totalPages} 页
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
          </>
        )}
      </main>

      {/* 友情链接 */}
      {initialFriendLinks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <div className="py-5 px-6 bg-gray-50/80 rounded-xl border border-gray-200/60 flex flex-col sm:flex-row sm:items-center gap-4">
            <h3 className="text-sm font-bold text-gray-800 flex-shrink-0">友情链接：</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {initialFriendLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors hover:underline decoration-blue-200 underline-offset-4"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>{siteConfig.footer_copyright || '© 2026 BuySoft. 正版软件导航平台'}</p>
          <p className="mt-2 text-xs sm:text-sm">{siteConfig.footer_description || '本站所有软件均为正版授权，点击购买即跳转至官方或授权渠道'}</p>
        </div>
      </footer>
    </div>
  );
}
