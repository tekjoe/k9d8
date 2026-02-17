# SEO Audit Report - k9d8 Web Pages
**Date:** February 2026  
**Auditor:** SEO Agent  
**Status:** Initial Audit

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Pages Audited | 10 |
| Critical Issues | 8 |
| Warnings | 12 |
| Passed | 3 |

**Overall SEO Score: 25/100** (Needs significant improvement)

The k9d8 web application is currently missing fundamental SEO infrastructure. No pages have meta tags, Open Graph tags, structured data, or proper semantic HTML. This severely limits discoverability in search engines and social sharing effectiveness.

---

## Critical Issues (Must Fix)

### 1. No `<Head>` Tags on Any Page
**Severity:** Critical  
**Affected Files:** ALL `.web.tsx` files

None of the web pages use `expo-router/head` to set meta tags. This means:
- No custom title tags (browser shows generic "k9d8" or nothing)
- No meta descriptions (Google shows random page content)
- No canonical URLs (potential duplicate content issues)

**Files to update:**
- `app/landing.web.tsx` - Landing page (HIGHEST PRIORITY)
- `app/index.web.tsx` - Entry point
- `app/parks/[id].web.tsx` - Park detail pages
- `app/(tabs)/index.web.tsx` - Home dashboard
- `app/(tabs)/explore/index.web.tsx` - Explore/map page
- `app/(tabs)/profile/index.web.tsx` - Profile page
- `app/(tabs)/profile/edit.web.tsx` - Edit profile
- `app/(tabs)/profile/dogs/create.web.tsx` - Add dog
- `app/(tabs)/profile/dogs/[id].web.tsx` - Dog detail
- `app/(tabs)/messages/index.web.tsx` - Messages

### 2. No Open Graph Tags
**Severity:** Critical  
**Affected Files:** ALL `.web.tsx` files

When users share k9d8 links on social media, there are no:
- `og:title` - No custom title for shares
- `og:description` - No description
- `og:image` - No preview image (critical for engagement)
- `og:url` - No canonical URL

**Impact:** Social shares will look broken/unprofessional, reducing viral potential.

### 3. No Structured Data (JSON-LD)
**Severity:** Critical  
**Affected Files:** `landing.web.tsx`, `parks/[id].web.tsx`

Missing schema.org markup for:
- **MobileApplication** schema on landing page
- **Place** schema on park detail pages
- **LocalBusiness** schema for dog parks with hours/amenities

**Impact:** No rich results in Google (app install buttons, star ratings, park info cards).

### 4. No Semantic HTML Structure
**Severity:** Critical  
**Affected Files:** ALL `.web.tsx` files

Pages use `<View>` and `<Text>` without `accessibilityRole` attributes:
- No `<main>` landmark (use `accessibilityRole="main"`)
- No proper heading hierarchy
- No `<nav>` landmarks
- No `<article>` or `<section>` elements

**Example from `landing.web.tsx` (line 175):**
```tsx
// Current - no semantic meaning
<Text style={{ fontSize: isMobile ? 40 : 56, fontWeight: '700' }}>
  Find the perfect park for your pup
</Text>

// Should be
<Text 
  accessibilityRole="header" 
  aria-level={1}
  style={{ fontSize: isMobile ? 40 : 56, fontWeight: '700' }}
>
  Find the perfect park for your pup
</Text>
```

---

## Warnings (Should Fix)

### 5. Missing Alt Text on Images
**Severity:** Warning  
**Affected Files:** `landing.web.tsx`, `parks/[id].web.tsx`, `(tabs)/index.web.tsx`

Images use `source={{ uri }}` without `accessibilityLabel`:

**landing.web.tsx (line 217-225):**
```tsx
<Image
  source={{ uri: 'https://images.unsplash.com/...' }}
  // Missing: accessibilityLabel="Dogs playing at a park"
/>
```

**parks/[id].web.tsx (line 375-382):**
```tsx
<Image
  source={{ uri: park.image_url || '...' }}
  // Missing: accessibilityLabel={`Photo of ${park.name}`}
/>
```

### 6. Hardcoded Text Missing Target Keywords
**Severity:** Warning  
**Affected Files:** `landing.web.tsx`

The landing page copy doesn't optimally use target keywords from the SEO plan:

| Current Text | Suggested Improvement |
|--------------|----------------------|
| "Find the perfect park for your pup" | "Find Dog Parks & Schedule Playdates" |
| "Connect with local dog owners" | "Connect with Dog Owners Near You" |
| "Join 10,000+ dog owners" | "Join 10,000+ Dog Owners Using the #1 Dog Playdate App" |

**Target keywords to incorporate:**
- "dog playdate app" (Critical)
- "dog park finder" (Critical)
- "find dogs nearby" (High)
- "dog meetup" (High)

### 7. No robots.txt or sitemap.xml
**Severity:** Warning  
**Affected:** Web build configuration

The Expo web build needs:
- `/public/robots.txt` - Control crawler access
- `/public/sitemap.xml` - List all public URLs (or generate dynamically)

### 8. No Canonical URLs
**Severity:** Warning  
**Affected Files:** ALL `.web.tsx` files

Without canonical URLs, search engines may:
- Index duplicate content
- Split page authority between www and non-www versions
- Not know the preferred URL format

### 9. Missing Twitter Card Tags
**Severity:** Warning  
**Affected Files:** ALL `.web.tsx` files

For Twitter/X sharing, need:
- `twitter:card` = "summary_large_image"
- `twitter:title`
- `twitter:description`
- `twitter:image`

### 10. No Favicon Configuration
**Severity:** Warning  
**Affected:** `app.json`

While `app.json` has `favicon: "./assets/images/favicon.png"`, the web build may need additional:
- Apple touch icons
- Multiple favicon sizes
- Web manifest for PWA

### 11. Page Titles Not Unique
**Severity:** Warning  
**Affected Files:** `_layout.tsx`

Root layout sets generic titles:
```tsx
<Stack.Screen name="index" options={{ headerShown: false, title: 'k9d8' }} />
<Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'k9d8' }} />
```

Every page shows "k9d8" in the browser tab - should be unique per page.

### 12. No 404 Page
**Severity:** Warning  
**Affected:** Missing `app/+not-found.tsx` with SEO-friendly content

---

## Passed (Good Practices Found)

### ✓ Responsive Design
All pages use `useWindowDimensions()` with mobile/tablet/desktop breakpoints.

### ✓ Meaningful URLs
Park pages use slugs: `/parks/golden-gate-park-abc123` instead of just UUIDs.

### ✓ Loading States
Pages show loading indicators, preventing empty content from being indexed.

---

## Priority Fix Order

### Phase 1: Critical Infrastructure (Week 1)
1. Add `<Head>` to `landing.web.tsx` with title, description, keywords
2. Add Open Graph tags to `landing.web.tsx`
3. Add MobileApplication structured data to `landing.web.tsx`
4. Create `public/robots.txt`

### Phase 2: Public Pages (Week 2)
5. Add `<Head>` to `parks/[id].web.tsx` with dynamic title/description
6. Add Place structured data to park pages
7. Add Open Graph with dynamic park images
8. Add semantic HTML roles to landing page

### Phase 3: Authenticated Pages (Week 3)
9. Add `<Head>` to remaining `.web.tsx` files
10. Add alt text to all images
11. Create sitemap.xml (static or dynamic)
12. Add Twitter Card tags

### Phase 4: Content Optimization (Week 4)
13. Rewrite landing page copy with target keywords
14. Add FAQ section with FAQPage schema
15. Create 404 page
16. Performance audit (Core Web Vitals)

---

## Code Templates

### Basic Page with SEO
```tsx
import Head from 'expo-router/head';

export default function PageName() {
  return (
    <>
      <Head>
        <title>Page Title | k9d8</title>
        <meta name="description" content="150-160 char description with keywords" />
        <link rel="canonical" href="https://k9d8.com/page-path" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://k9d8.com/page-path" />
        <meta property="og:title" content="Page Title | k9d8" />
        <meta property="og:description" content="Description for social sharing" />
        <meta property="og:image" content="https://k9d8.com/og-image.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Page Title | k9d8" />
        <meta name="twitter:description" content="Description for Twitter" />
        <meta name="twitter:image" content="https://k9d8.com/og-image.png" />
      </Head>
      
      <View accessibilityRole="main">
        {/* Page content */}
      </View>
    </>
  );
}
```

### Dynamic Park Page SEO
```tsx
<Head>
  <title>{park.name} - Dog Park | k9d8</title>
  <meta 
    name="description" 
    content={`Visit ${park.name} in ${park.city}. ${park.is_fenced ? 'Fenced off-leash area' : 'Open dog park'} with ${checkedInCount} dogs here now. Schedule a playdate today!`} 
  />
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Place",
      "name": park.name,
      "address": park.address,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": park.latitude,
        "longitude": park.longitude
      }
    })}
  </script>
</Head>
```

---

## Next Steps

1. **Immediate:** Fix `landing.web.tsx` - it's the most important page for SEO
2. **This week:** Add Head tags to all public-facing pages
3. **Ongoing:** Monitor Google Search Console after deployment
4. **Monthly:** Re-audit and track keyword rankings

---

*This audit was generated based on the SEO plan in `.ai/plans/seo-plan.md`*
