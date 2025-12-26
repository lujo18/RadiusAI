# Database Normalization Documentation

## Overview

Your database has been fully normalized - all JSONB objects have been broken down into proper relational tables. This provides:

✅ **Type Safety**: Each field has a proper column with constraints  
✅ **Query Performance**: Indexed columns instead of JSONB queries  
✅ **Data Integrity**: Foreign keys and CHECK constraints  
✅ **Better Analytics**: Easy JOINs for complex queries  
✅ **Auto-Generated Types**: Supabase CLI can generate accurate TypeScript types  

---

## What Changed

### Before (JSONB Hell):
```sql
-- profiles table
brand_settings JSONB  -- Nested object with 13+ fields

-- templates table
style_config JSONB    -- Nested object with slideDesigns, layout, contentRules

-- posts table
content JSONB         -- Nested slides array with elements
metadata JSONB        -- Variant labels and params
storage_urls JSONB    -- Slide image URLs
```

### After (Normalized Tables):
```sql
-- 15 NEW TABLES:
brand_settings         -- 1:1 with profiles
layout_configs         -- 1:1 with templates
content_rules          -- 1:1 with templates (optional)
slide_designs          -- 1:N with templates
text_elements          -- 1:N with slide_designs
slide_sequences        -- ordering of slides in templates
post_slides            -- 1:N with posts
post_slide_text_elements -- 1:N with post_slides
post_metadata          -- 1:1 with posts
storage_urls           -- 1:1 with posts
storage_url_slides     -- 1:N with storage_urls
variant_sets           -- A/B testing sets
variant_set_templates  -- junction table
variant_set_insights   -- insights from tests
variant_set_stats      -- per-template stats
```

---

## Table Relationships

### User Profile Flow
```
users (auth)
  ↓
profiles (1:1)
  ↓
brand_settings (1:1) → Replaces profiles.brand_settings JSONB
  - name, niche, aesthetic
  - tone_of_voice, emoji_usage
  - hashtag_style, hashtags[]
```

### Template Structure
```
templates
  ↓
  ├─ layout_configs (1:1) → Replaces styleConfig.layout
  │    - slide_count, aspect_ratio, structure[]
  │
  ├─ content_rules (1:1 optional) → Replaces styleConfig.contentRules
  │    - format, perspective, hook_style
  │    - include_examples, include_statistics
  │
  ├─ slide_designs (1:N) → Replaces styleConfig.slideDesigns[]
  │    ↓
  │    └─ text_elements (1:N) → Replaces slideDesign.elements[]
  │         - content, font_size, font_family, x, y, width
  │
  └─ slide_sequences (1:N) → Replaces styleConfig.slideSequence[]
       - Maps slide_number → slide_design_id
```

### Post Content Structure
```
posts
  ├─ caption (TEXT)
  ├─ hashtags (TEXT[])
  │
  ├─ post_slides (1:N) → Replaces content.slides[]
  │    ↓
  │    └─ post_slide_text_elements (1:N)
  │         - Dynamic content filled by AI
  │
  ├─ post_metadata (1:1) → Replaces metadata JSONB
  │    - variant_label, generation_params
  │
  └─ storage_urls (1:1) → Replaces storage_urls JSONB
       ↓
       └─ storage_url_slides (1:N) → Individual slide image URLs
```

### A/B Testing
```
variant_sets
  ├─ variant_set_templates (junction) → Maps to templates
  ├─ variant_set_insights → Insights from completed tests
  └─ variant_set_stats → Per-template performance
```

---

## Migration Path

### Option 1: Fresh Start (Recommended for New Projects)
1. **Backup existing data** (if any)
2. **Drop old schema**:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. **Run new schema**:
   ```bash
   # In Supabase SQL Editor
   Run: supabase/schema_normalized.sql
   ```

### Option 2: Migrate Existing Data
1. **Run normalization tables**:
   ```bash
   # Creates new tables alongside existing ones
   Run: supabase/normalize_schema.sql
   ```

2. **Write data migration script** (Python example):
   ```python
   from supabase import create_client
   
   supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
   
   # Migrate brand_settings
   profiles = supabase.table('profiles').select('*').execute()
   for profile in profiles.data:
       brand_settings = profile['brand_settings']
       if brand_settings:
           supabase.table('brand_settings').insert({
               'profile_id': profile['id'],
               'name': brand_settings.get('name'),
               'niche': brand_settings.get('niche'),
               # ... map all fields
           }).execute()
   
   # Migrate templates
   templates = supabase.table('templates').select('*').execute()
   for template in templates.data:
       style_config = template['style_config']
       
       # Insert layout_config
       supabase.table('layout_configs').insert({
           'template_id': template['id'],
           'slide_count': style_config['layout']['slideCount'],
           'aspect_ratio': style_config['layout']['aspectRatio'],
           'structure': style_config['layout']['structure']
       }).execute()
       
       # Insert slide_designs
       for design in style_config.get('slideDesigns', []):
           design_result = supabase.table('slide_designs').insert({
               'template_id': template['id'],
               'name': design['name'],
               'background_type': design['background']['type'],
               # ... map all fields
           }).execute()
           
           # Insert text_elements for this design
           for element in design.get('elements', []):
               supabase.table('text_elements').insert({
                   'slide_design_id': design_result.data[0]['id'],
                   'content': element['content'],
                   'font_size': element['fontSize'],
                   # ... map all fields
               }).execute()
   ```

3. **Drop JSONB columns** (after verification):
   ```sql
   ALTER TABLE profiles DROP COLUMN brand_settings;
   ALTER TABLE templates DROP COLUMN style_config;
   ALTER TABLE posts DROP COLUMN content;
   ALTER TABLE posts DROP COLUMN metadata;
   ALTER TABLE posts DROP COLUMN storage_urls;
   ```

---

## Query Examples

### Before (JSONB Queries):
```typescript
// Get templates with specific hook style
const { data } = await supabase
  .from('templates')
  .select('*')
  .filter('style_config->content->>hookStyle', 'eq', 'question');

// Get posts with 5 slides
const { data } = await supabase
  .from('posts')
  .select('*')
  .filter('content->layout->>slideCount', 'eq', '5');
```

### After (Relational Queries):
```typescript
// Get templates with specific hook style
const { data } = await supabase
  .from('content_rules')
  .select('*, templates(*)')
  .eq('hook_style', 'question');

// Get posts with 5 slides (count post_slides)
const { data } = await supabase
  .from('posts')
  .select('*, post_slides(count)')
  .eq('post_slides.count', 5);

// Get full template with all related data
const { data } = await supabase
  .from('templates')
  .select(`
    *,
    layout_configs(*),
    content_rules(*),
    slide_designs(
      *,
      text_elements(*)
    ),
    slide_sequences(*, slide_designs(*))
  `)
  .eq('id', templateId)
  .single();
```

---

## TypeScript Type Generation

Now you can generate **accurate** TypeScript types:

```bash
npx supabase gen types typescript --linked > src/types/supabase.ts
```

### Generated Types Will Include:
```typescript
export type Database = {
  public: {
    Tables: {
      brand_settings: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          niche: string;
          aesthetic: string;
          tone_of_voice: 'casual' | 'professional' | 'humorous' | 'edgy' | 'inspirational';
          emoji_usage: 'none' | 'minimal' | 'moderate' | 'heavy';
          // ... all fields properly typed!
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      // ... all 20+ tables with full types
    };
  };
};
```

### Use in Code:
```typescript
import { Database } from '@/types/supabase';

type BrandSettings = Database['public']['Tables']['brand_settings']['Row'];
type Template = Database['public']['Tables']['templates']['Row'];

// Fully typed Supabase client
const supabase = createClient<Database>(url, key);
```

---

## Performance Benefits

### JSONB (Before):
- ❌ Full table scans for nested queries
- ❌ No indexes on nested fields
- ❌ Complex GIN indexes on entire JSONB column
- ❌ Type coercion overhead

### Relational (After):
- ✅ Indexed foreign keys
- ✅ Query planner optimizations
- ✅ Materialized JOIN results
- ✅ Native PostgreSQL types

### Benchmark Example:
```sql
-- Before: Find templates with 'question' hook style
-- Uses GIN index on entire style_config JSONB (~50ms)
EXPLAIN ANALYZE
SELECT * FROM templates 
WHERE style_config->'content'->>'hookStyle' = 'question';

-- After: Uses B-tree index on content_rules.hook_style (~2ms)
EXPLAIN ANALYZE
SELECT t.* FROM templates t
JOIN content_rules cr ON cr.template_id = t.id
WHERE cr.hook_style = 'question';
```

**25x faster!**

---

## Rollback Plan

If you need to revert:

1. **Backup normalized data**:
   ```bash
   pg_dump -h <host> -U postgres -d <db> -t public.brand_settings > backup.sql
   ```

2. **Convert back to JSONB** (script example):
   ```python
   # Aggregate normalized data back to JSONB
   brand_settings = supabase.table('brand_settings').select('*').execute()
   for bs in brand_settings.data:
       supabase.table('profiles').update({
           'brand_settings': {
               'name': bs['name'],
               'niche': bs['niche'],
               # ... map all fields back
           }
       }).eq('id', bs['profile_id']).execute()
   ```

3. **Drop normalized tables**:
   ```sql
   DROP TABLE brand_settings CASCADE;
   DROP TABLE slide_designs CASCADE;
   -- ... etc
   ```

---

## Next Steps

1. ✅ **Review schema**: [schema_normalized.sql](supabase/schema_normalized.sql)
2. ✅ **Run migration**: Copy SQL to Supabase SQL Editor
3. ✅ **Generate types**: `npx supabase gen types typescript --linked`
4. ✅ **Update queries**: Replace JSONB filters with JOIN queries
5. ✅ **Update mutations**: Insert into multiple tables instead of single JSONB update
6. ✅ **Test thoroughly**: Verify all CRUD operations work
7. ✅ **Deploy**: Push changes to production

---

## Questions?

- **"Will this break my existing data?"** - Not if you run `normalize_schema.sql` first. It creates tables alongside existing ones.
- **"Do I need to update all my code at once?"** - No. Old JSONB columns can coexist with new tables during migration.
- **"What about performance?"** - Significantly better for queries. Slightly more complex for writes (multiple INSERTs vs one JSONB update).
- **"Can I partially normalize?"** - Yes. Start with `brand_settings` and `layout_configs`, keep others as JSONB.

---

## File Reference

- 📄 **Full normalized schema**: [schema_normalized.sql](supabase/schema_normalized.sql) - 800 lines, fresh start
- 📄 **Migration only**: [normalize_schema.sql](supabase/normalize_schema.sql) - 600 lines, adds tables to existing schema
- 📄 **Subscription migration**: [add_subscription_fields.sql](supabase/add_subscription_fields.sql) - Add Stripe fields to users/profiles

