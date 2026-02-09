'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Monitor, Apple, Smartphone, Globe, Home, Star, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BannerCarousel from '@/components/BannerCarousel';
import type { Product, BannerSlide, FriendLink, SiteConfig } from '@/types';

const platformIcons: Record<string, React.ReactNode> = {
  windows: <Monitor className="w-4 h-4" />,
  mac: <Monitor className="w-4 h-4" />, // Mac usually shares Monitor or specific
  apple: <Apple className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
  ios: <Apple className="w-4 h-4" />,
  web: <Globe className="w-4 h-4" />,
};

const navCategories = [
  { id: '全部', label: '首页', icon: Home },
  { id: 'Windows', label: 'Windows', icon: Monitor },
  { id: 'Mac', label: 'macOS', icon: Apple }, // Using Apple icon for macOS to match style
  { id: 'iOS', label: 'iOS', icon: Apple },
  { id: 'Android', label: 'Android', icon: Smartphone },
  { id: 'Web', label: 'Web', icon: Globe },
];

interface HomePageClientProps {
  initialProducts: Product[];
  initialBannerSlides: BannerSlide[];
  initialFriendLinks: FriendLink[];
  siteConfig: SiteConfig;
}

export default function HomePageClient({
  initialProducts,
  initialBannerSlides,
  initialFriendLinks,
  siteConfig,
}: HomePageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeCategory !== '全部') {
         // Map UI category to API platform param if needed, or backend handles it
         params.append('platform', activeCategory);
      }

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory]);

  // ... (effect logic remains same)
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
  };
  
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }
    fetchProducts();
  }, [activeCategory, fetchProducts, isFirstMount]);

  const handleProductClick = (product: Product) => {
    const targetSlug = product.slug || product.id;
    window.location.href = `/soft/${targetSlug}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header (White) */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
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
              <div className="w-8 h-8 bg-gradient-to-br from-[#0e7490] to-[#0891b2] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {siteConfig.site_name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xl font-bold text-gray-900">{siteConfig.site_name}</span>
          </Link>

          {/* Search Box (Right aligned) */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入关键词搜索..."
                className="w-full pl-4 pr-10 py-2 bg-gray-100 border-none rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-[#0e7490]/20 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-[#0e7490] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Hero Section (Teal Background) */}
      <div className="bg-[#0e7490] text-white">
        <div className="max-w-7xl mx-auto">
          {/* Banner Area */}
          <div className="px-4 py-6">
            {initialBannerSlides.length > 0 ? (
              <div className="rounded-xl overflow-hidden shadow-lg bg-black/10">
                 <BannerCarousel slides={initialBannerSlides} autoPlayInterval={5000} />
              </div>
            ) : (
               /* Placeholder banner if none exists, to maintain layout structure */
               <div className="h-[200px] sm:h-[280px] bg-[#155e75] rounded-xl flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/10">
                 <LayoutGrid className="w-12 h-12 mb-2 opacity-50" />
                 <p>暂无广告轮播图</p>
               </div>
            )}
          </div>

          {/* Navigation Bar (Bottom of Hero) */}
          <div className="px-4 pb-1">
            <div className="flex flex-wrap items-center gap-1">
              {navCategories.map((cat) => {
                 const Icon = cat.icon;
                 const isActive = activeCategory === cat.id;
                 return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-[#0891b2] text-white shadow-sm' 
                        : 'text-cyan-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                 );
              })}
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* 封面图 */}
                <div className="w-16 h-16 mx-auto mb-4 mt-2 rounded-xl overflow-hidden bg-gray-100">
                  {product.coverImage ? (
                    <Image
                      src={product.coverImage}
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
                <div className="flex items-center justify-center gap-2 mt-4">
                  {product.originalPrice > product.salePrice && (
                    <span className="price-original">¥{product.originalPrice}</span>
                  )}
                  <span className="price-sale">¥{product.salePrice}</span>
                </div>

                {/* 购买按钮 */}
                <button className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  立即购买
                </button>
              </div>
            ))}
          </div>
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
