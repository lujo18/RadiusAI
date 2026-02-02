# AI Generation Layer

All AI content generation (posts, brands, variants) lives here.
**Separation principle**: AI logic isolated from CRUD operations.

## Structure

- `services/`: Prompt building, API orchestration
- `hooks/`: TanStack Query mutations with optimistic updates
- `clients/`: HTTP transport to backend endpoints

## When to Use

- Generating posts from templates/prompts → `useGeneratePost()`
- Generating brand settings from guideline → `useGenerateBrand()`
- A/B test variant generation → `useGenerateVariants()`

## NOT for CRUD

- Creating/updating posts: use `usePosts()` from `hooks/`
- Editing brand settings: use `useBrands()` from `hooks/`
