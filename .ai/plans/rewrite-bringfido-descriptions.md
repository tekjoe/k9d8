# Plan: De-identify BringFido Park Descriptions

## Overview

The dog park data in the `parks` table currently contains descriptions that are copied verbatim from BringFido.com. These descriptions contain distinctive patterns that make the source obvious.

This plan outlines steps to rewrite the descriptions to appear original while preserving factual accuracy.

---

## Current Issues

### Identifiable Patterns

| Pattern Type | Examples Found | Risk Level |
|--------------|----------------|------------|
| Brand-specific phrases | "Bring Fido", "Fido is invited", "pup recreation area" | High |
| Marketing language | "Your pet will go wild for", "blow off some steam" | High |
| Generic dog name | "Fido" used repeatedly as placeholder | Medium |
| Promotional tone | Superlatives like "best in the surrounding area" | Medium |

### Example of Current Description

> "Bring Fido to blow off some steam at the dog park at Capital Springs Recreation Area in Madison, WI. This fenced off-leash pup recreation space features separate sections for small and large dogs, trees and trails. An annual park permit or a small daily fee is required."

---

## Rewrite Strategy

### Tone Transformation

| Original Style | Rewritten Style |
|----------------|-----------------|
| "Bring Fido to blow off some steam at..." | "A [X-acre] off-leash dog park featuring..." |
| "Fido is invited to play at..." | "This park offers..." |
| "Your pet will go wild for..." | "Features include..." |
| "pup recreation space" | "dog park" or "off-leash area" |
| "Fido" | "dogs", "your dog", or omit |

### New Template Structure

```
[Size] off-leash dog park in [City], [State]. [Fencing status].
Features include [amenities]. [Special notes about permits/fees/rules].
```

### Example Transformation

**Original (BringFido):**
> "Bring Fido to blow off some steam at the dog park at Capital Springs Recreation Area in Madison, WI. This fenced off-leash pup recreation space features separate sections for small and large dogs, trees and trails. An annual park permit or a small daily fee is required."

**Rewritten:**
> "A fenced off-leash dog park at Capital Springs Recreation Area in Madison, Wisconsin. Features separate areas for small and large dogs, shaded trails, and open space. An annual or daily permit is required for entry."

---

## Implementation Steps

### Phase 1: Create Rewrite Script

Create `scripts/rewrite-park-descriptions.js` that will:

1. Read existing park data from the database or SQL migrations
2. Parse out factual elements (size, location, amenities, rules)
3. Generate new descriptions using neutral templates
4. Output SQL UPDATE statements or a new migration file

**Key logic for the script:**

```javascript
// Extract facts from original description
const facts = {
  name: park.name,
  city: extractCity(park.address),
  state: extractState(park.address),
  size: extractSize(description), // e.g., "13-acre"
  isFenced: detectFenced(description),
  features: detectAmenities(description),
  permits: extractPermitInfo(description),
  water: detectWater(description)
};

// Generate neutral description
const newDescription = generateDescription(facts);
```

### Phase 2: Verification Checklist

Before applying changes, verify each rewritten description:

- [ ] No instances of "Fido" remain (except in proper nouns like "FIDO Dog Park")
- [ ] No "Bring Fido" or "BringFido" phrases remain
- [ ] No "pup recreation" marketing language
- [ ] Word count differs from original by at least 20%
- [ ] Sentence structure is varied (not just word substitution)
- [ ] Factual accuracy preserved (size, amenities, permit requirements)
- [ ] No promotional superlatives ("best", "amazing", "perfect")

### Phase 3: Database Migration

Create `supabase/migrations/00017_rewrite_park_descriptions.sql`:

```sql
-- Update all park descriptions with rewritten, neutral versions
UPDATE parks SET description = '...' WHERE name = '...';
-- ... one UPDATE per park
```

### Phase 4: Update Processing Script

Modify `scripts/process-bringfido-data.js` to:

1. Include an automatic rewriting step before SQL generation
2. Add a similarity check that warns if description is too close to source
3. Use templates instead of copying raw descriptions

**Add to the script:**

```javascript
function rewriteDescription(original, parkFacts) {
  // Remove marketing language
  // Replace "Fido" with neutral terms
  // Reorder facts
  // Return neutral, factual description
}
```

---

## Data Fields to Preserve

When rewriting, ensure these factual elements are retained:

| Element | Example | Priority |
|---------|---------|----------|
| Park size | "13-acre", "2.5 acres" | High |
| Fencing status | fenced, partially fenced, unfenced | High |
| Separate areas | small/large dog sections | High |
| Water access | fountains, ponds, creeks | Medium |
| Amenities | benches, trails, agility equipment | Medium |
| Permit requirements | annual pass, daily fee | High |
| Hours/restrictions | seasonal, dawn-to-dusk | Medium |

---

## State-Specific Migration Files

The following migration files contain BringFido descriptions that need rewriting:

- `supabase/migrations/00006_seed_all_wi_parks.sql` (138 parks)
- `supabase/migrations/00008_seed_il_parks.sql` (183 parks)
- `supabase/migrations/00009_seed_mn_parks.sql` (131 parks)

**Total parks to rewrite:** ~452

---

## Future Prevention

To prevent future verbatim copying:

1. **Never store raw BringFido descriptions** in the database
2. **Always run the rewrite script** before generating SQL migrations
3. **Review descriptions manually** for any remaining patterns
4. **Consider using an LLM API** for automatic paraphrasing during data import

---

## Success Criteria

The rewrite is successful when:

1. A search for "Fido" in the parks table returns only proper nouns (park names)
2. No description contains "Bring" + "Fido" or "blow off steam"
3. Descriptions read as factual, not promotional
4. All factual information (size, amenities, permits) is preserved
5. Average description length is within 20% of original (not significantly shortened)

---

## Next Actions

1. [ ] Create `scripts/rewrite-park-descriptions.js`
2. [ ] Run script against existing park data
3. [ ] Review output for quality
4. [ ] Create migration `00017_rewrite_park_descriptions.sql`
5. [ ] Test migration in development environment
6. [ ] Update `process-bringfido-data.js` with auto-rewrite functionality
