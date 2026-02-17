import Head from 'expo-router/head';

const SITE_NAME = 'k9d8';
const DEFAULT_OG_IMAGE = 'https://k9d8.com/og-image.png';
const BASE_URL = 'https://k9d8.com';

interface SEOHeadProps {
  /** Page title. Will have " | k9d8" appended automatically. */
  title: string;
  /** Meta description (150-160 chars recommended). */
  description: string;
  /** Canonical URL path (e.g. "/features"). Full URL built from BASE_URL. */
  url?: string;
  /** OG image URL. Falls back to default OG image. */
  image?: string;
  /** OG type. Defaults to "website". */
  type?: string;
  /** If true, title is used as-is without the " | k9d8" suffix. */
  rawTitle?: boolean;
}

export default function SEOHead({
  title,
  description,
  url,
  image,
  type = 'website',
  rawTitle = false,
}: SEOHeadProps) {
  const fullTitle = rawTitle ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : undefined;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
