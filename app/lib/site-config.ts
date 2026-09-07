export interface EditorialAsset {
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  desktopWidth: number;
  desktopHeight: number;
  mobileWidth: number;
  mobileHeight: number;
}

export interface HomepageConfig {
  hero: EditorialAsset & {
    eyebrow: string;
    title: string;
    copy: string;
    collectionHandle: string;
  };
  editorial: EditorialAsset & {title: string; cta: string};
  sizeGuide: EditorialAsset & {title: string; copy: string; href: string};
  featuredCollections: ReadonlyArray<{
    handle: string;
    title: string;
    subtitle: string;
  }>;
  trendingSearches: ReadonlyArray<string>;
  testimonials: ReadonlyArray<{quote: string; name: string; city: string}>;
}

export interface MarketingConfig {
  instagram: ReadonlyArray<{image: string; href: string; alt: string}> | null;
  newsletter: {endpoint: string; privacyCopy: string} | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  pinterestUrl: string | null;
  whatsappUrl: string | null;
}

export interface SiteConfig {
  brand: {urdu: string; english: string; statement: string};
  seo: {title: string; description: string};
  announcement: {mobile: string; desktop: string};
  homepage: HomepageConfig;
  marketing: MarketingConfig;
  trustStatements: ReadonlyArray<string>;
}

export const siteConfig: SiteConfig = {
  brand: {
    urdu: 'سنگھار',
    english: 'Singhar by Sidra',
    statement:
      'Luxury eastern wear, handcrafted for the moments that matter.',
  },
  seo: {
    title: 'Singhar by Sidra | Luxury Eastern Wear',
    description:
      'Discover handcrafted eastern wear by Singhar by Sidra: timeless silhouettes and festive-ready detail for every occasion.',
  },
  announcement: {
    mobile: 'Free shipping over Rs. 15,000 · Eid Collection now live',
    desktop:
      'Free shipping on orders above Rs. 15,000 · Eid Collection now live · COD available nationwide',
  },
  homepage: {
    hero: {
      desktopSrc: '/images/home/hero-desktop.webp',
      mobileSrc: '/images/home/hero-mobile.webp',
      desktopWidth: 2880,
      desktopHeight: 1280,
      mobileWidth: 780,
      mobileHeight: 1040,
      alt: 'A model wearing an embroidered Singhar by Sidra ensemble',
      eyebrow: 'The new season',
      title: 'Latest Collection',
      copy: 'Handcrafted eastern wear for the modern woman — timeless silhouettes, festive-ready detail, made to be worn for years to come.',
      collectionHandle: 'new-arrivals',
    },
    editorial: {
      desktopSrc: '/images/home/editorial-desktop.webp',
      mobileSrc: '/images/home/editorial-mobile.webp',
      desktopWidth: 2880,
      desktopHeight: 840,
      mobileWidth: 780,
      mobileHeight: 600,
      alt: 'Singhar by Sidra handcrafted festive collection',
      title: 'Timeless Elegance, Handcrafted for You',
      cta: 'Explore the Edit',
    },
    sizeGuide: {
      desktopSrc: '/images/home/size-guide-desktop.webp',
      mobileSrc: '/images/home/size-guide-mobile.webp',
      desktopWidth: 840,
      desktopHeight: 520,
      mobileWidth: 312,
      mobileHeight: 360,
      alt: 'Detail of a hand-finished Singhar by Sidra garment',
      title: 'Not sure of your size?',
      copy: 'Find your perfect fit in seconds with our detailed size guide.',
      href: '/pages/size-guide',
    },
    featuredCollections: [
      {handle: 'luxury-pret', title: 'Luxury Pret', subtitle: 'Everyday elegance'},
      {handle: 'wedding-collection', title: 'Wedding', subtitle: 'For your big day'},
      {handle: 'eid-collection', title: 'Eid', subtitle: 'Celebrate in style'},
      {handle: 'festive-collection', title: 'Festive', subtitle: 'Occasion ready'},
    ],
    trendingSearches: [
      'Eid Collection',
      'Bridal Wear',
      'Lawn Suits',
      'Organza Saree',
      'Chikankari',
    ],
    testimonials: [
      {quote: 'The fabric quality is unmatched — I felt like royalty at my sister’s wedding.', name: 'Ayesha K.', city: 'Lahore'},
      {quote: 'Singhar never disappoints. The Eid collection sold out before I could blink.', name: 'Farah M.', city: 'Karachi'},
      {quote: 'Timeless pieces that feel special every time I wear them.', name: 'Sana R.', city: 'Islamabad'},
    ],
  },
  marketing: {
    instagram: null,
    newsletter: null,
    facebookUrl: null,
    instagramUrl: null,
    pinterestUrl: null,
    whatsappUrl: null,
  },
  trustStatements: [
    'Secure Payment',
    'Easy Returns',
    '100% Authentic',
    'Cash on Delivery',
  ],
};

