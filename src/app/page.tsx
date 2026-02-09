'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Mail, Monitor, Apple, Smartphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BannerCarousel from '@/components/BannerCarousel';

interface Platform {
  id: string;
  name: string;
  icon: string | null;
}

interface Product {
  id: string;
  name: string;
  subtitle: string | null;
  originalPrice: number;
  salePrice: number;
  cpsLink: string;
  coverImage: string | null;
  platforms: Platform[];
}

interface BannerSlide {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  title?: string;
}

interface FriendLink {
  id: string;
  name: string;
  url: string;
  logo: string | null;
}

const platformIcons: Record<string, React.ReactNode> = {
  windows: <Monitor className="w-4 h-4" />,
  apple: <Apple className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
};

const categories = ['全部', 'Windows', 'Mac', 'iOS', 'Android'];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [siteConfig, setSiteConfig] = useState({
    site_name: 'BuySoft',
    site_logo: '',
  });
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([]);

  // Fetch site configuration, banners and friend links
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setSiteConfig(prev => ({
            ...prev,
            ...data.data
          }));
          // Parse banner slides from config
          if (data.data.banner_slides) {
            try {
              const slides = JSON.parse(data.data.banner_slides);
              setBannerSlides(slides);
            } catch (e) {
              console.error('Failed to parse banner slides:', e);
            }
          }
        }
      })
      .catch(console.error);

    // Fetch friend links
    fetch('/api/friend-links')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFriendLinks(data.data);
        }
      })
      .catch(console.error);
  }, []);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleProductClick = (product: Product) => {
    // 新标签页打开 CPS 链接
    window.open(product.cpsLink, '_blank');

    // 记录点击（可选）
    fetch(`/api/products/${product.id}/click`, { method: 'POST' }).catch(() => { });
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
            <a href="mailto:contact@buysoft.com" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
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
                onClick={() => setActiveCategory(cat)}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 广告轮播 */}
      {bannerSlides.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <BannerCarousel slides={bannerSlides} autoPlayInterval={5000} />
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
      {friendLinks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">友情链接</h3>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {friendLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                {link.logo && (
                  <img
                    src={link.logo}
                    alt={link.name}
                    className="w-4 h-4 object-contain"
                  />
                )}
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 BuySoft. 正版软件导航平台</p>
          <p className="mt-2">本站所有软件均为正版授权，点击购买即跳转至官方或授权渠道</p>
        </div>
      </footer>
    </div>
  );
}
