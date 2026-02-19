# Bundle Size Reduction Plan

## Current State

The app's `node_modules` totals ~2.1 GB. The largest contributors are TensorFlow/nsfwjs (web-only moderation), Mapbox (map rendering), and date-fns. Platform-specific file splitting (.web.tsx/.native.tsx) is already well-architected.

---

## Phase 1: Quick Wins (Easy, High Impact)

### 1. Granular date-fns imports
- **Current:** Importing from `date-fns` barrel (~38 MB)
- **Fix:** Import from specific subpaths: `date-fns/format`, `date-fns/formatDistanceToNow`
- **Impact:** ~20 MB reduction per platform
- **Effort:** Low — find & replace imports

### 2. Add `sideEffects: false` to package.json
- Enables better tree-shaking by Metro/webpack
- **Impact:** ~5-15 MB reduction
- **Effort:** Low — single line in package.json

### 3. Move playwright to devDependencies
- Currently listed as a production dependency (~1.58 MB)
- Only used for testing/automation, not runtime
- **Impact:** ~2 MB reduction
- **Effort:** Trivial

### 4. Metro production optimization
- Add production optimization flags to `metro.config.js`
- **Impact:** ~10-20 MB reduction
- **Effort:** Low

---

## Phase 2: Medium Effort, High Impact

### 5. Dynamic import TensorFlow/nsfwjs on web
- **Current:** `import * as tf from '@tensorflow/tfjs'` in moderation.web.ts
- **Fix:** Use dynamic `import()` inside `initializeModerationModel()` so TF is only loaded when a user actually picks an image
- **Impact:** ~250-300 MB reduction from web bundle (massive)
- **Effort:** Medium — already partially lazy (model init is async), just need to defer the module import itself

```typescript
// moderation.web.ts
let tf: typeof import('@tensorflow/tfjs') | null = null;
let nsfwjs: typeof import('nsfwjs') | null = null;

export async function initializeModerationModel() {
  if (!tf) {
    tf = await import('@tensorflow/tfjs');
    nsfwjs = await import('nsfwjs');
  }
  // ... rest of init
}
```

### 6. Dynamic import mapbox-gl on web
- **Current:** mapbox-gl (~42 MB) bundled into every web page
- **Fix:** Dynamic import in ParkMap.web.tsx (already lazy-loaded via React.lazy, but the module itself is statically imported)
- **Impact:** ~20 MB reduction from non-map web pages
- **Effort:** Medium

---

## Phase 3: Longer-Term Optimizations

### 7. Route-based code splitting (web)
- Expo Router supports lazy bundling for web
- Enable `experiments.lazyBundling` in app config
- Each route loads only its own code
- **Impact:** Faster initial page load, smaller per-page bundles
- **Effort:** Medium-High — needs testing across all routes

### 8. Image optimization pipeline
- Not bundle size per se, but affects load performance
- Ensure park photos and blog images are served in modern formats (WebP/AVIF)
- Use Supabase image transformations or a CDN with auto-format
- **Impact:** Faster page loads
- **Effort:** Medium

### 9. Audit NativeWind CSS overhead
- Currently ~808 KB
- Ensure only used utility classes are included
- **Impact:** Small (~500 KB savings)
- **Effort:** Low

---

## Estimated Impact Summary

| Change | Native | Web | Effort |
|--------|--------|-----|--------|
| date-fns granular imports | -20 MB | -20 MB | Low |
| sideEffects: false | -10 MB | -10 MB | Low |
| Metro production config | -15 MB | -15 MB | Low |
| Remove playwright from deps | — | -2 MB | Trivial |
| TensorFlow dynamic import | — | -250 MB | Medium |
| Mapbox dynamic import | — | -20 MB | Medium |
| Route-based code splitting | — | varies | High |
| **Total potential** | **~45 MB** | **~317 MB** | — |

---

## What's Already Good

- Platform-specific files (.web.tsx / .native.tsx) correctly split
- ParkMap lazy-loaded with React.lazy + Suspense
- Moderation service stubbed on native (no TF on mobile)
- No problematic barrel re-exports in src/
- Expo modules imported via namespace (tree-shakeable)

## Implementation Order

1. package.json: `sideEffects: false`, move playwright to devDependencies
2. Find all date-fns imports, convert to granular subpath imports
3. Update metro.config.js with production optimization
4. Refactor moderation.web.ts to use dynamic imports for TF/nsfwjs
5. Refactor ParkMap.web.tsx to dynamically import mapbox-gl
6. Evaluate Expo Router lazy bundling for web
