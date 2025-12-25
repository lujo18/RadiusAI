# Supabase Quick Reference

## 🚀 Quick Start Checklist

1. ✅ Install Supabase: `npm install @supabase/supabase-js` (DONE)
2. ✅ Create `.env.local` with Supabase credentials (YOU DO THIS)
3. ✅ Run SQL schema in Supabase Dashboard (YOU DO THIS)
4. ✅ Run `node update-imports.js` to update imports (OPTIONAL - can do manually)
5. ✅ Test authentication and database operations
6. ✅ Remove Firebase: `npm uninstall firebase`

---

## 📁 New File Structure

```
frontend/src/lib/
├── supabase/
│   ├── client.ts            # Supabase client initialization
│   ├── auth.ts              # Authentication functions
│   ├── database.types.ts    # TypeScript types for DB
│   └── db/
│       ├── index.ts         # Export all DB operations
│       ├── profiles.ts      # Profile CRUD
│       ├── templates.ts     # Template CRUD
│       ├── posts.ts         # Post CRUD
│       ├── analytics.ts     # Analytics CRUD
│       └── storage.ts       # File upload/download
```

---

## 🔑 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔄 API Comparison

### Authentication

| Operation | Firebase | Supabase |
|-----------|----------|----------|
| Sign Up | `createUserWithEmailAndPassword` | `supabase.auth.signUp` |
| Sign In | `signInWithEmailAndPassword` | `supabase.auth.signInWithPassword` |
| Sign Out | `signOut(auth)` | `supabase.auth.signOut()` |
| OAuth | `signInWithPopup(auth, provider)` | `supabase.auth.signInWithOAuth` |
| Get User | `auth.currentUser` | `supabase.auth.getUser()` |

### Database Queries

| Operation | Firebase | Supabase |
|-----------|----------|----------|
| Create | `addDoc(collection, data)` | `supabase.from('table').insert(data)` |
| Read All | `getDocs(query)` | `supabase.from('table').select('*')` |
| Read One | `getDoc(docRef)` | `supabase.from('table').select('*').eq('id', id).single()` |
| Update | `updateDoc(docRef, data)` | `supabase.from('table').update(data).eq('id', id)` |
| Delete | `deleteDoc(docRef)` | `supabase.from('table').delete().eq('id', id)` |
| Filter | `where('field', '==', value)` | `.eq('field', value)` |
| Order | `orderBy('field', 'desc')` | `.order('field', { ascending: false })` |

### Storage

| Operation | Firebase | Supabase |
|-----------|----------|----------|
| Upload | `uploadBytes(ref, blob)` | `supabase.storage.from('bucket').upload(path, blob)` |
| Get URL | `getDownloadURL(ref)` | `supabase.storage.from('bucket').getPublicUrl(path)` |
| Delete | `deleteObject(ref)` | `supabase.storage.from('bucket').remove([path])` |

---

## 💡 Common Patterns

### Get Authenticated User
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');
```

### Query with Filter
```typescript
const { data, error } = await supabase
  .from('templates')
  .select('*')
  .eq('user_id', userId)
  .eq('category', 'listicle')
  .order('created_at', { ascending: false });
```

### Insert with Return
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert({ user_id: userId, brand_settings: settings })
  .select()
  .single();
```

### Upload File
```typescript
const { error } = await supabase.storage
  .from('slides')
  .upload(`${userId}/${postId}/slide-0.png`, blob);

const { data } = supabase.storage
  .from('slides')
  .getPublicUrl(`${userId}/${postId}/slide-0.png`);
```

---

## 🔒 Row Level Security (RLS)

All queries are automatically filtered by `auth.uid()`. Users can only:
- See their own data
- Modify their own data
- No access to other users' data

This is enforced at the **database level**, not in your code!

---

## 🐛 Error Handling

```typescript
const { data, error } = await supabase
  .from('templates')
  .select('*');

if (error) {
  if (error.code === 'PGRST116') {
    // Record not found (404)
  } else {
    // Other error
    throw new Error(error.message);
  }
}
```

---

## 📊 Database Schema

### Key Tables
- `users` - User accounts (extends auth.users)
- `profiles` - User profiles with brand settings
- `templates` - Post templates
- `posts` - Generated posts
- `post_analytics` - Post performance metrics
- `platform_integrations` - Social media connections

### Relationships
```
users (1) ──→ (N) profiles
users (1) ──→ (N) templates
profiles (1) ──→ (N) templates
templates (1) ──→ (N) posts
posts (1) ──→ (1) post_analytics
```

---

## ⚡ Performance Tips

1. **Use select() wisely** - Only select columns you need
2. **Add indexes** - Already created for common queries
3. **Use JSONB** - For nested objects (brand_settings, style_config)
4. **Enable caching** - Supabase has built-in CDN
5. **Batch operations** - Use `insert([...])` for multiple records

---

## 🎯 Migration Verification

Run these tests after migration:

```typescript
// Test auth
const { data, error } = await signUpWithEmail(email, password, name);

// Test profiles
const profiles = await getUserProfiles();
const profile = await createProfile(brandSettings);

// Test templates
const templates = await getUserTemplates();
const template = await createTemplate(templateData);

// Test posts
const posts = await getUserPosts();
const post = await createPost({ templateId, platform, content });

// Test storage
const urls = await uploadSlideImages(postId, blobs);
```

---

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://supabase.com/community
- **Status**: https://status.supabase.com

---

**Migration created by:** GitHub Copilot
**Date:** December 20, 2025
