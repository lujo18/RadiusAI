# Firebase to Supabase Migration Guide

## ✅ Migration Status: CODE COMPLETE

All code has been migrated. Follow these steps to complete the migration:

---

## 📋 Prerequisites

1. **Create Supabase Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for project to be provisioned (~2 minutes)

2. **Get Credentials**
   - Go to Project Settings → API
   - Copy **Project URL**
   - Copy **anon public** key

---

## 🔧 Step 1: Environment Setup

Create `.env.local` in `frontend/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🗄️ Step 2: Initialize Database

1. **Open Supabase SQL Editor**
   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

2. **Run Schema Migration**
   - Copy the entire contents of `supabase/schema.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for completion (~30 seconds)

This will create:
- All tables (users, profiles, templates, posts, etc.)
- Row Level Security policies
- Storage buckets for slide images
- Indexes for performance
- Auto-update triggers

---

## 🔄 Step 3: Update Import Paths

Replace all Firebase imports with Supabase imports throughout your codebase:

### Authentication
```typescript
// OLD: Firebase
import { signUpWithEmail, signInWithGoogle } from '@/lib/firebase/auth';

// NEW: Supabase
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase/auth';
```

### Database Operations
```typescript
// OLD: Firebase
import { getUserProfiles, createProfile } from '@/lib/firebase/firestore/profiles';

// NEW: Supabase
import { getUserProfiles, createProfile } from '@/lib/supabase/db/profiles';
```

### Files to Update:
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/lib/api/hooks/*.ts` (all hook files)
- `src/services/slideGenerator.ts`

---

## 🎣 Step 4: Update React Query Hooks

The API is identical, but you need to update imports. Here's an example:

### Before (Firebase):
```typescript
import { getUserProfiles, createProfile } from '@/lib/firebase/firestore/profiles';
```

### After (Supabase):
```typescript
import { getUserProfiles, createProfile } from '@/lib/supabase/db/profiles';
```

**No other changes needed!** The function signatures are the same.

---

## 🔐 Step 5: Enable OAuth Providers (Optional)

If you use Google/GitHub login:

1. **Google OAuth:**
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add your Google Client ID and Secret
   - Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

2. **GitHub OAuth:**
   - Go to Authentication → Providers → GitHub
   - Enable GitHub provider
   - Add your GitHub Client ID and Secret
   - Add authorized callback URL

---

## 🧪 Step 6: Test Migration

1. **Start Development Server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Test Authentication:**
   - Sign up with new account
   - Sign in
   - Test OAuth (if enabled)
   - Verify user data in Supabase Dashboard

3. **Test Database Operations:**
   - Create a profile
   - Create a template
   - Generate a post
   - Check data in Supabase Table Editor

4. **Test Storage:**
   - Upload slide images
   - Verify files in Supabase Storage

---

## 🔄 Key Differences: Firebase vs Supabase

### Query Patterns

#### Firebase (Collection-Document)
```typescript
const profilesRef = collection(db, `users/${userId}/profiles`);
```

#### Supabase (Relational with RLS)
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id);
```

### Real-time Updates

#### Firebase
```typescript
onSnapshot(collection(db, 'posts'), (snapshot) => {
  // Handle updates
});
```

#### Supabase
```typescript
supabase
  .channel('posts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
    // Handle updates
  })
  .subscribe();
```

### Authentication State

#### Firebase
```typescript
onAuthStateChanged(auth, (user) => {
  // Handle auth state
});
```

#### Supabase
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state
});
```

---

## 📊 Database Schema Highlights

### Relational Structure
- **users** table extends Supabase auth.users
- **profiles** belongs to users (foreign key)
- **templates** belongs to users and profiles
- **posts** references templates and profiles
- **analytics** one-to-one with posts

### Row Level Security (RLS)
- Users can only see/modify their own data
- Enforced at database level
- No need for security rules files

### JSONB Columns
- `brand_settings` - Stores BrandSettings object
- `style_config` - Stores template StyleConfig
- `content` - Stores PostContent
- `metadata` - Stores flexible metadata

---

## 🚀 Performance Optimizations

### Indexes Created
- User ID indexes on all user-owned tables
- Composite indexes for common query patterns
- GIN indexes on JSONB columns for fast JSON queries

### Storage Organization
- Files organized by `userId/postId/filename`
- Automatic CDN caching
- Image optimization available

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables added
- [ ] Schema migration run successfully
- [ ] All import paths updated
- [ ] OAuth providers configured (if needed)
- [ ] Can sign up new users
- [ ] Can sign in existing users
- [ ] Can create profiles
- [ ] Can create templates
- [ ] Can generate posts
- [ ] Images upload correctly
- [ ] No Firebase imports remain

---

## 🆘 Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` file exists in `frontend/` directory
- Verify variable names: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after adding env variables

### "Row level security policy violation"
- User not authenticated when making query
- Check `getCurrentUser()` is called first
- Verify RLS policies in Supabase Dashboard

### "Foreign key constraint violation"
- Referenced record doesn't exist
- Check user_id, template_id, post_id exist before creating related records

### "PGRST116 error"
- Record not found (404)
- Handle this gracefully in your code

---

## 🎯 Next Steps

After migration is complete:

1. **Remove Firebase Dependencies:**
   ```bash
   npm uninstall firebase
   ```

2. **Delete Firebase Files:**
   - Delete `src/lib/firebase/` directory
   - Remove Firebase config from environment

3. **Update Documentation:**
   - Update README with Supabase setup instructions
   - Update team documentation

4. **Monitor Performance:**
   - Check Supabase Dashboard for query performance
   - Monitor storage usage
   - Review authentication logs

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

## 🎉 Benefits of Supabase

✅ **PostgreSQL** - Full SQL database with relations  
✅ **Built-in Auth** - Email, OAuth, magic links  
✅ **Real-time** - Subscribe to database changes  
✅ **Storage** - CDN-backed file storage  
✅ **Row Level Security** - Database-level security  
✅ **Auto APIs** - RESTful and GraphQL APIs generated  
✅ **Better TypeScript** - Full type safety  
✅ **Lower Costs** - More generous free tier  

Migration complete! 🚀
