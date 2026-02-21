# Backend Supabase Migration Guide

Complete guide to migrate your FastAPI backend from Firebase to Supabase.

## ✅ What Was Changed

### 1. **Removed Firebase Dependencies**
- ❌ `firebase-admin`
- ❌ `firebase_admin.auth`
- ❌ `firebase_admin.firestore`
- ❌ `firebase_admin.storage`

### 2. **Added Supabase Dependencies**
- ✅ `supabase` - Python client for Supabase
- ✅ `PyJWT` - JWT token verification
- ✅ `cryptography` - For JWT signature verification

### 3. **Files Created/Updated**

**New Files:**
- `backend/config/supabase.py` - Supabase client configuration
- `backend/services/supabase_service.py` - All database operations
- `backend/.env.example` - Environment variables template

**Updated Files:**
- `backend/main.py` - Removed Firebase init, added Supabase init
- `backend/auth.py` - Changed from Firebase Auth to Supabase JWT verification
- `backend/routers/templates.py` - Import from supabase_service
- `backend/routers/posts.py` - Import from supabase_service
- `backend/requirements.txt` - Updated dependencies

---

## 🚀 Migration Steps

### Step 1: Install Dependencies

```powershell
# Activate your virtual environment
& C:\Users\asplo\Documents\GitHub\Radius\venv\Scripts\Activate.ps1

# Uninstall Firebase
pip uninstall firebase-admin -y

# Install Supabase and JWT libraries
pip install supabase PyJWT cryptography

# Or install all from requirements.txt
pip install -r requirements.txt
```

### Step 2: Set Up Environment Variables

Create `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://localhost:3000
```

**Where to find these values:**

1. **SUPABASE_URL** and **SUPABASE_SERVICE_ROLE_KEY**:
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy "Project URL" and "service_role secret"

2. **SUPABASE_JWT_SECRET**:
   - Same page → JWT Settings → JWT Secret
   - Copy the secret (used for token verification)

### Step 3: Create Storage Buckets in Supabase

1. Go to Supabase Dashboard → Storage
2. Create these buckets:
   - `slides` (public)
   - `thumbnails` (public)
   - `user-uploads` (private)

3. Set bucket policies for public access:

```sql
-- Make slides bucket public
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'slides');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
USING (bucket_id = 'slides');
```

### Step 4: Deploy Database Schema

Make sure you've already run the schema from frontend migration:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/schema.sql (from frontend migration)
```

### Step 5: Update CORS Configuration

In `backend/main.py`, update CORS origins to match your frontend:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-production-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 6: Test Backend

```powershell
# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Test Endpoints:**
```powershell
# Health check
curl http://localhost:8000/health

# Should return: {"status": "healthy", "database": "supabase"}
```

---

## 🔑 Authentication Changes

### Before (Firebase):
```python
# Token verification using Firebase Admin SDK
decoded = auth.verify_id_token(token)
user_id = decoded['uid']
```

### After (Supabase):
```python
# JWT token verification
decoded = jwt.decode(
    token,
    SUPABASE_JWT_SECRET,
    algorithms=["HS256"],
    audience="authenticated"
)
user_id = decoded['sub']  # Supabase uses 'sub' for user ID
```

**Frontend Token Usage:**
```typescript
// Get token from Supabase session
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Send to backend
await fetch('/api/templates', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📦 Database Structure Differences

### Firebase Firestore (Document DB)
```
users/{userId}
  └── templates/{templateId}
      └── posts/{postId}
```

### Supabase PostgreSQL (Relational DB)
```
users ──┐
        ├── profiles (one-to-one)
        ├── templates (one-to-many)
        └── posts (through templates)

Foreign Keys:
- profiles.user_id → users.id
- templates.user_id → users.id
- posts.template_id → templates.id
- post_analytics.post_id → posts.id
```

---

## 🔄 API Changes Summary

All function signatures remain the same, but internal implementation changed:

| Function | Firebase | Supabase |
|----------|----------|----------|
| `create_template()` | Firestore.collection().add() | supabase.table().insert() |
| `get_user_templates()` | query.where().get() | supabase.table().select().eq() |
| `upload_slide_image()` | storage.bucket().blob() | supabase.storage.from_().upload() |
| Token verification | auth.verify_id_token() | jwt.decode() |

---

## 🧪 Testing Checklist

- [ ] Backend starts without errors
- [ ] `/health` endpoint returns `{"database": "supabase"}`
- [ ] Authentication works with Supabase JWT tokens
- [ ] Create template endpoint works
- [ ] List templates returns user's templates
- [ ] Upload image to storage works
- [ ] Post creation works with template reference
- [ ] Analytics tracking works

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
**Solution:** Make sure `.env` file exists with all required variables

### Error: "Invalid token" when calling API
**Solution:** 
1. Check SUPABASE_JWT_SECRET matches your project's JWT secret
2. Make sure frontend is sending `session.access_token`, not `session.refresh_token`
3. Verify token hasn't expired (tokens expire after 1 hour by default)

### Error: "relation 'profiles' does not exist"
**Solution:** Run the schema.sql file in Supabase SQL Editor

### Error: "storage bucket not found"
**Solution:** Create the buckets in Supabase Dashboard → Storage

### Import errors after installation
**Solution:** Restart your IDE/terminal after installing new packages

---

## 🔐 Security Notes

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use service role key only in backend** - It bypasses RLS policies
3. **Frontend should use anon key** - Already configured in frontend migration
4. **Validate all user inputs** - Same as before
5. **Enable RLS policies** - Already in schema.sql

---

## ✨ Benefits of Supabase

1. **PostgreSQL** - Full relational database with joins, transactions
2. **Real-time subscriptions** - Listen to database changes (if needed)
3. **Row Level Security** - Database-level authorization
4. **Built-in Storage** - CDN-backed file storage
5. **Better performance** - Optimized queries with indexes
6. **Type safety** - Generate TypeScript types from schema

---

## 📚 Next Steps

1. Test all API endpoints with Postman or curl
2. Update any custom functions you have
3. Deploy backend to production (Railway, Render, etc.)
4. Update production environment variables
5. Monitor logs for any migration issues

**Your backend is now fully migrated to Supabase! 🎉**
