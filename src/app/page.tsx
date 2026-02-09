import prisma from '@/lib/prisma';
import HomePageClient from '@/components/HomePageClient';
import type { Product, BannerSlide, FriendLink, SiteConfig } from '@/types';

// Force dynamic rendering if we want real-time updates without rebuilding
// Or use revalidate for ISR. Given it's a shopping site, maybe 60 seconds is fine.
export const revalidate = 60;

async function getInitialData() {
  const [
    productsData,
    siteConfigs,
    friendLinksData
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        platforms: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteConfig.findMany({
      where: {
        key: {
          in: ['site_name', 'site_logo', 'footer_copyright', 'footer_description', 'banner_slides']
        }
      }
    }),
    prisma.friendLink.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  ]);

  return { productsData, siteConfigs, friendLinksData };
}

export default async function HomePage() {
  const { productsData, siteConfigs, friendLinksData } = await getInitialData();

  // Transform Site Config
  const configMap: Record<string, string> = {};
  siteConfigs.forEach(c => {
    configMap[c.key] = c.value;
  });

  const siteConfig: SiteConfig = {
    site_name: configMap.site_name || 'SoRuan',
    site_logo: configMap.site_logo || '',
    footer_copyright: configMap.footer_copyright || '',
    footer_description: configMap.footer_description || '',
  };

  // Parse Banner Slides
  let bannerSlides: BannerSlide[] = [];
  if (configMap.banner_slides) {
    try {
      bannerSlides = JSON.parse(configMap.banner_slides);
    } catch (e) {
      console.error('Failed to parse banner slides:', e);
    }
  }

  // Transform Products to match interface (Prisma returns Date, interface doesn't have it, but strict match is better)
  // Also ensure null safety
  const products: Product[] = productsData.map(p => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    originalPrice: p.originalPrice,
    salePrice: p.salePrice,
    cpsLink: p.cpsLink,
    coverImage: p.coverImage,
    slug: p.slug,
    platforms: p.platforms.map(pl => ({
      id: pl.id,
      name: pl.name,
      icon: pl.icon,
    })),
  }));

  // Transform FriendLinks
  const friendLinks: FriendLink[] = friendLinksData.map(f => ({
    id: f.id,
    name: f.name,
    url: f.url,
    logo: f.logo,
  }));

  return (
    <HomePageClient
      initialProducts={products}
      initialBannerSlides={bannerSlides}
      initialFriendLinks={friendLinks}
      siteConfig={siteConfig}
    />
  );
}
