'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Mail, Monitor, Apple, Smartphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BannerCarousel from '@/components/BannerCarousel';
import type { Product, BannerSlide, FriendLink, SiteConfig } from '@/types';

const platformIcons: Record<string, React.ReactNode> = {
  windows: <Monitor className="w-4 h-4" />,
  apple: <Apple className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
};

const categories = ['全部', 'Windows', 'Mac', 'iOS', 'Android'];

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
      if (activeCategory !== '全部') params.append('platform', activeCategory);

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

  // Only trigger fetch if search or category changes from initial state
  // However, since we pass initialProducts, we don't need to fetch on mount.
  // We only fetch when user interacts.
  
  // We need to trigger fetch when activeCategory or searchQuery changes, 
  // BUT NOT on the first render because we have initial data.
  // A simple way is to use a ref to track mount or just rely on user events.
  // But wait, if I change category, I need to fetch.
  // If I rely on useEffect([activeCategory, searchQuery]), it will run on mount too?
  // React 18 useEffect runs twice in dev, but usually once after mount.
  // If I want to avoid double fetching on mount, I should skip the first effect run 
  // OR just let it run (it might be fast enough or redundant).
  // Better: Only call fetchProducts when user clicks search or category tab.
  // But wait, `activeCategory` state change should trigger it.
  
  // Let's use useEffect but with a check or just accept one redundant call if it happens (though with initial data matching default state, we can skip).
  
  // Actually, if I just call fetchProducts in the click handlers, I don't need the effect?
  // But Search is a form submit. Category is a button click.
  // Yes, explicit calls are better to avoid "effect hell".
  
  // EXCEPT: `activeCategory` state update is async. So calling fetchProducts immediately after setActiveCategory uses old state.
  // So useEffect is safer for category. For search, it's onSubmit, so we can use the input value directly or state.
  
  // Let's stick to useEffect but skip if it matches initial conditions? 
  // Initial: '全部', ''.
  // If activeCategory === '全部' && searchQuery === '', we can skip if we haven't touched anything.
  // But maybe simpler: just let it be controlled by effects, but add a `isFirstRun` ref.

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    // We'll let the effect handle the fetch to ensure state is updated
  };
  
  // Using effect for category change
  // We need to avoid running this on initial mount since we have data.
  const [isFirstMount, setIsFirstMount] = useState(true);



  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }
    fetchProducts();
  }, [activeCategory, fetchProducts, isFirstMount]); // removed fetchProducts from deps to avoid loop if fetchProducts changes (it uses useCallback so it's fine, but still)

  const handleProductClick = (product: Product) => {
    const targetSlug = product.slug || product.id;
    window.location.href = `/soft/${targetSlug}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {siteConfig.site_name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xl font-bold text-gray-900">{siteConfig.site_name}</span>
          </Link>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索软件..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                搜索
              </button>
            </div>
          </form>

          {/* 右侧导航 */}
          <div className="flex items-center gap-4">
            <a
              href="https://work.weixin.qq.com/ca/cawcdeb53ea1d4a8fe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
            >
              <Mail className="w-4 h-4" />
              联系我们
            </a>
          </div>
        </div>
      </header>

      {/* 分类筛选 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 广告轮播 */}
      {initialBannerSlides.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <BannerCarousel slides={initialBannerSlides} autoPlayInterval={5000} />
        </div>
      )}

      {/* 商品列表 */}
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
