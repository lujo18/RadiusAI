# RLS Policy Fix for Database Normalization

## Problem

When we dropped `user_id` and `team_id` columns from the `posts` table (and other tables), the existing Supabase RLS (Row Level Security) policies became broken. These policies were trying to reference columns that no longer exist.

### What was happening:
- Old RLS policies looked like: `USING (auth.uid() = user_id)` 
- After dropping user_id, this would fail with "column user_id does not exist"
- This affected both the frontend (which uses anon key and IS subject to RLS) and potentially the backend

### Impact:
- Frontend cannot retrieve posts (403 Permission Denied)
- Frontend cannot retrieve analytics data
- Backend operations using service_role key still work (bypasses RLS), but frontend is blocked

## Solution

Updated RLS policies to use team-based access through the `brands` and `users` relationship:

**New access pattern:**
```
user.auth_uid → users.team_id → brands.team_id → posts.brand_id
```

Instead of:
```
user.auth_uid → posts.user_id (broken)
```

## Files

- **FIX_RLS_POLICIES.sql** - Complete SQL migration to fix all RLS policies

## Steps to Apply

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire content from `FIX_RLS_POLICIES.sql`
4. Run the SQL

## What Gets Fixed

### Posts Table
- `users_can_read_posts` - Uses brand→team relationship
- `users_can_create_posts` - Validates team ownership
- `users_can_update_posts` - Team-based update validation
- `users_can_delete_posts` - Team-based delete validation

### Post Analytics Table
- `users_can_read_post_analytics` - Through posts→brands→teams
- `users_can_insert_post_analytics` - Validates team ownership
- `users_can_update_post_analytics` - Team-based update validation

### Post Analytics History Table
- Similar team-based policies for all operations

### Brands Table
- Ensures users can only see/edit brands in their team

## Verification

After running the SQL:

1. **Frontend should work again:**
   ```
   POST /api/[teamId]/brand/[brandId]/posts → returns posts ✓
   GET analytics data → returns analytics ✓
   ```

2. **Test in browser console:**
   ```javascript
   // Should now work
   const { data } = await supabase.from('posts').select('*').eq('brand_id', brandId);
   console.log(data); // Should return posts, not empty/permission error
   ```

## Backend Note

The backend uses `service_role` key which bypasses RLS, so it wasn't affected by this issue. However, it's good practice to keep RLS policies correct for security and consistency.

## Going Forward

When making future schema changes:
- Always review RLS policies if changing key columns used in policy conditions
- Update RLS policies BEFORE dropping columns if possible
- Test frontend API calls after schema changes to catch RLS issues early
