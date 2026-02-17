---
shaping: true
---

# SEO Implementation — Shaping

## Source

- `.ai/context/seo-audit-2026-02.md` — SEO audit scoring 25/100 with 8 critical issues and 12 warnings
- `.ai/plans/seo-plan.md` — Comprehensive SEO strategy covering ASO, web SEO, local SEO, content marketing

---

## Problem

The k9d8 web app has zero SEO infrastructure. No pages have meta tags, Open Graph tags, structured data, or semantic HTML. This means search engines show generic/empty results, social shares look broken, and there are no public-facing pages to capture organic search traffic (dog park directories, features page, blog).

## Outcome

Public pages rank in search engines with rich results. Social shares render professional previews. New public pages (parks directory, features, blog) capture organic traffic funnels. SEO score moves from 25/100 toward 80+.

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | Public web pages are discoverable and rank in search engines | Core goal |
| **R1** | Every web page has a unique title, meta description, and canonical URL | Must-have |
| **R2** | Social shares (Facebook, Twitter/X) render rich previews with image, title, description | Must-have |
| **R3** | Public pages emit structured data (JSON-LD) for rich search results | Must-have |
| **R4** | Pages use semantic HTML landmarks, heading hierarchy, and image alt text | Must-have |
| **R5** | Crawlers can discover all public URLs (robots.txt + sitemap) | Must-have |
| **R6** | New public-facing pages exist to capture SEO traffic funnels | Must-have |
| | R6.1: Features page highlighting app capabilities | |
| | R6.2: Download page with app store badges | |
| | R6.3: Dog parks directory index + one city template (pulls from DB) | |
| | R6.4: Blog scaffolding with static markdown content | |
| **R7** | Landing page copy incorporates high-value target keywords | Must-have |
| **R8** | Unknown URLs show a proper 404 page | Must-have |

---

## Selected Shape

## A: Reusable SEO layer + city columns + static public pages

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **SEOHead component**: Wraps `expo-router/head` `<Head>`. Props: title, description, image, url. Renders `<title>`, meta description, canonical, OG tags (og:title/description/image/url/type), Twitter cards (summary_large_image). Defaults: title suffix "\| k9d8", fallback OG image from assets, canonical from current route. | |
| **A2** | **StructuredData component**: Renders `<script type="application/ld+json">` inside Head. Typed builder helpers for MobileApplication, Place, and FAQPage schemas. | |
| **A3** | **City/state columns on parks table**: Supabase migration adding `city` and `state` columns to parks. Backfill from existing `address` field. Directory pages query `WHERE state = $1` or `WHERE city = $1`. | |
| **A4** | **Semantic HTML pass**: Add `accessibilityRole="main"` to page content wrappers, `accessibilityRole="header"` + `aria-level` to headings, `accessibilityLabel` to all images across existing pages. | |
| **A5** | **Landing page SEO**: Apply SEOHead with keyword-optimized title/description. Add MobileApplication schema via StructuredData. Rewrite hero/subheading copy with target keywords ("dog playdate app", "dog park finder"). Semantic HTML. | |
| **A6** | **Park detail page SEO**: Apply SEOHead with dynamic `{park.name} - Dog Park | k9d8` title, description from park data. Add Place schema with geo coordinates. Semantic HTML + image alt text. | |
| **A7** | **Dog parks directory**: New `/dog-parks` index listing states/cities with park counts. City template `/dog-parks/[city]` querying parks by city column, rendering list with map. SEOHead with city-specific meta ("Dog Parks in Madison, WI"). | ⚠️ |
| **A8** | **Marketing pages**: New `/features` page (app capabilities, screenshots). New `/download` page (app store badges, smart banner). Both with SEOHead. | |
| **A9** | **Blog scaffolding**: Add `react-markdown` dependency. Blog index at `/blog` listing posts. Posts stored as `.md` files with frontmatter (title, description, date). Rendered at `/blog/[slug]`. SEOHead from frontmatter. | ⚠️ |
| **A10** | **Crawler infrastructure**: `public/robots.txt` (allow all, point to sitemap). `public/sitemap.xml` listing static public routes. | |
| **A11** | **Remaining pages + 404**: Apply SEOHead to all authenticated pages (home, explore, profile, messages, etc.). Create `+not-found.tsx` with SEOHead, helpful message, and navigation links. | |

### Flags

- **A7 ⚠️**: Static export needs to know which `[city]` slugs to pre-render. May need `generateStaticParams` or client-side rendering for city routes.
- **A9 ⚠️**: Markdown integration with Expo Router static export. May need `@expo/mdx` or runtime `react-markdown`.

### Key findings from investigation

- `web.output: "static"` already set in app.json — Head tags will be in initial HTML
- Parks table already has public RLS (anonymous SELECT allowed)
- No city/state columns — address field has embedded city data
- No existing Head/meta infrastructure anywhere
- No public/ directory, no robots.txt, no sitemap
- No markdown dependencies

---

## Fit Check: R × A

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | Public web pages are discoverable and rank in search engines | Core goal | ✅ |
| R1 | Every web page has a unique title, meta description, and canonical URL | Must-have | ✅ |
| R2 | Social shares render rich previews with image, title, description | Must-have | ✅ |
| R3 | Public pages emit structured data (JSON-LD) for rich search results | Must-have | ✅ |
| R4 | Pages use semantic HTML landmarks, heading hierarchy, and image alt text | Must-have | ✅ |
| R5 | Crawlers can discover all public URLs (robots.txt + sitemap) | Must-have | ✅ |
| R6.1 | Features page highlighting app capabilities | Must-have | ✅ |
| R6.2 | Download page with app store badges | Must-have | ✅ |
| R6.3 | Dog parks directory index + one city template | Must-have | ❌ |
| R6.4 | Blog scaffolding with static markdown content | Must-have | ❌ |
| R7 | Landing page copy incorporates high-value target keywords | Must-have | ✅ |
| R8 | Unknown URLs show a proper 404 page | Must-have | ✅ |

**Notes:**
- R6.3 fails: A7 mechanism is flagged — need to confirm static export handles dynamic [city] routes
- R6.4 fails: A9 mechanism is flagged — need to confirm markdown rendering approach in Expo Router
