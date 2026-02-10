import Link from 'next/link';
import Image from 'next/image';
import { Monitor, Apple, Smartphone, Globe, LayoutGrid, AppWindow, Terminal, Chrome, Tv } from 'lucide-react';
import prisma from '@/lib/prisma';

interface RelatedProductsProps {
  currentProductId: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  windows: <LayoutGrid className="w-4 h-4" />,
  mac: <AppWindow className="w-4 h-4" />,
  macos: <AppWindow className="w-4 h-4" />,
  apple: <Apple className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
  ios: <Apple className="w-4 h-4" />,
  linux: <Terminal className="w-4 h-4" />,
  web: <Globe className="w-4 h-4" />,
  'chrome 扩展': <Chrome className="w-4 h-4" />,
  'chrome': <Chrome className="w-4 h-4" />,
  tv: <Tv className="w-4 h-4" />,
};

export default async function RelatedProducts({ currentProductId }: RelatedProductsProps) {
  // 1. Get all eligible IDs
  const allIds = await prisma.product.findMany({
    where: {
      id: { not: currentProductId },
      isActive: true,
    },
    select: { id: true }
  });

  if (allIds.length === 0) return null;

  // 2. Pick 4 random IDs
  const randomIds: string[] = [];
  const count = Math.min(4, allIds.length);
  const tempIds = [...allIds];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * tempIds.length);
    randomIds.push(tempIds[randomIndex].id);
    tempIds.splice(randomIndex, 1);
  }

  // 3. Fetch full details for selected IDs
  const products = await prisma.product.findMany({
    where: { id: { in: randomIds } },
    include: {
      platforms: true,
    },
    // Maintain random order? findMany doesn't guarantee order of `in`.
    // We can shuffle result again if needed, but it's already random set.
  });

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
        <h2 className="text-xl font-bold text-gray-900">相关推荐</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/soft/${product.slug || product.id}`}
            className="group bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 flex flex-col items-center text-center relative"
          >
             {/* Platform Icons */}
             <div className="absolute top-3 right-3 flex items-center gap-1 z-10 opacity-60">
                {product.platforms.map((p) => {
                    const iconKey = p.icon || p.name.toLowerCase();
                    return (
                        <span key={p.id} title={p.name}>
                            {platformIcons[iconKey] || <Monitor className="w-4 h-4" />}
                        </span>
                    );
                })}
            </div>

            <div className="w-16 h-16 mb-4 mt-2 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
              {(product.logo || product.coverImage) ? (
                <Image
                  src={product.logo || product.coverImage || ''}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 font-bold text-xl">
                  {product.name.charAt(0)}
                </div>
              )}
            </div>

            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors w-full">
              {product.name}
            </h3>
            
            {product.subtitle && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-1 w-full px-2">
                {product.subtitle}
              </p>
            )}

            <div className="mt-auto pt-2 flex items-baseline gap-2">
               <span className="text-lg font-bold text-red-600">
                 {product.salePriceText ? `¥${product.salePriceText}` : `¥${Number(product.salePrice).toFixed(0)}`}
               </span>
               {(product.originalPriceText || product.originalPrice > product.salePrice) && (
                   <span className="text-xs text-gray-400 line-through">
                     {product.originalPriceText ? `¥${product.originalPriceText}` : `¥${Number(product.originalPrice).toFixed(0)}`}
                   </span>
               )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
