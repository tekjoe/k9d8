import Head from 'expo-router/head';

interface StructuredDataProps {
  data: Record<string, unknown>;
}

/** Renders JSON-LD structured data inside <Head>. */
export default function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    ...data,
  });

  return (
    <Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </Head>
  );
}

/** schema.org MobileApplication for the landing/download pages. */
export function mobileAppSchema(overrides?: Record<string, unknown>) {
  return {
    '@type': 'MobileApplication',
    name: 'k9d8',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Connect with dog owners, find nearby dog parks, and schedule playdates.',
    ...overrides,
  };
}

/** schema.org Place for park detail pages. */
export function placeSchema(park: {
  name: string;
  description?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  image_url?: string | null;
}) {
  return {
    '@type': 'Place',
    name: park.name,
    ...(park.description && { description: park.description }),
    ...(park.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: park.address,
      },
    }),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: park.latitude,
      longitude: park.longitude,
    },
    ...(park.image_url && { image: park.image_url }),
  };
}

/** schema.org FAQPage for FAQ sections. */
export function faqPageSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** schema.org Organization for the home/landing page. */
export function organizationSchema() {
  return {
    '@type': 'Organization',
    name: 'k9d8',
    url: 'https://k9d8.com',
    logo: 'https://k9d8.com/og-image.png',
    sameAs: [],
    description:
      'Connect with dog owners, find nearby dog parks, and schedule playdates.',
  };
}

/** schema.org BreadcrumbList for navigation breadcrumbs. */
export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `https://k9d8.com${item.url}`,
    })),
  };
}

/** schema.org BlogPosting for individual blog posts. */
export function blogPostingSchema(post: {
  title: string;
  description: string;
  date: string;
  author: string;
  slug: string;
}) {
  return {
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'k9d8',
      url: 'https://k9d8.com',
    },
    mainEntityOfPage: `https://k9d8.com/blog/${post.slug}`,
  };
}
