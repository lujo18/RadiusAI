# Firestore Implementation Guide - SlideForge

## Overview

This implementation provides a complete Firestore-based backend for SlideForge with:
- ✅ **Template Management**: CRUD operations for slide templates
- ✅ **Post Storage**: Efficient post storage with Firebase Storage integration
- ✅ **Analytics Tracking**: Real-time analytics with aggregation
- ✅ **Firebase Storage**: Slide images stored in Firebase Storage buckets
- ✅ **User Management**: Multi-user support with authentication
- ✅ **Dynamic Routes**: Template and Post detail pages

---

## 🗄️ Firestore Structure

### Collection Architecture

```
users/{userId}
  ├── profile: { email, name, plan, defaultTemplateId, createdAt }
  ├── templates/{templateId} (subcollection)
  └── stats: { totalPosts, totalTemplates, avgEngagement }

templates/{templateId} (top-level for queries)
  ├── userId, name, category, styleConfig
  ├── performance: { totalPosts, avgEngagement, avgSaves, avgImpressions }
  └── status, createdAt, updatedAt

posts/{postId} (top-level for efficiency)
  ├── userId, templateId, platform, status
  ├── content: { slides[], caption, hashtags[] }
  ├── storageUrls: { slides[], thumbnail }
  ├── analytics: { impressions, engagement, saves, shares, engagementRate }
  └── createdAt, scheduledTime, publishedTime

analytics/{analyticsId}
  ├── postId, templateId, userId, platform, date
  ├── metrics: { impressions, engagement, saves, shares }
  └── variantSetId (optional for A/B testing)

variantSets/{variantSetId}
  ├── userId, name, templates[], status
  ├── startDate, endDate, postsPerTemplate
  └── results: { winningTemplateId, stats, insights }
```

### Design Decisions

**Why top-level `posts` collection?**
- Faster queries across all users
- No nested reads required
- Better for analytics aggregation
- Scalable for millions of posts

**Why denormalized `templates`?**
- Stored in both `users/{userId}/templates` and top-level `templates/`
- Fast user-specific queries
- Fast cross-user queries (for admin/analytics)
- Small data duplication cost vs. huge performance gain

**Why Firebase Storage for slides?**
- Images are large files (not suitable for Firestore documents)
- Firebase Storage optimized for media files
- CDN delivery for fast loading
- Cost-effective for images/videos

---

## 🔧 Backend Implementation

### Files Created

1. **`backend/services/firestore_service.py`** (450+ lines)
   - All CRUD operations for templates, posts, analytics
   - Firebase Storage upload/download
   - Performance aggregation
   - A/B testing variant set management

2. **`backend/routers/templates.py`** (200+ lines)
   - `POST /api/templates` - Create template
   - `GET /api/templates` - List user templates
   - `GET /api/templates/{id}` - Get template details + performance + posts
   - `PUT /api/templates/{id}` - Update template
   - `DELETE /api/templates/{id}` - Archive template
   - `POST /api/templates/{id}/set-default` - Set default template
   - `GET /api/templates/{id}/posts` - Get all posts from template
   - `GET /api/templates/{id}/analytics` - Get template analytics

3. **`backend/routers/posts.py`** (250+ lines)
   - `POST /api/posts` - Create post
   - `GET /api/posts` - List user posts (with filters)
   - `GET /api/posts/{id}` - Get post details + template + analytics
   - `PUT /api/posts/{id}` - Update post
   - `POST /api/posts/{id}/publish` - Mark as published
   - `POST /api/posts/{id}/upload-slide` - Upload slide image to Storage
   - `POST /api/posts/{id}/upload-thumbnail` - Upload thumbnail
   - `POST /api/posts/{id}/analytics` - Track analytics
   - `GET /api/posts/{id}/analytics` - Get analytics history

4. **`backend/auth.py`**
   - Firebase ID token verification
   - `get_current_user()` dependency for protected routes
   - `get_optional_user()` for optional auth

5. **`backend/models.py`** (Updated)
   - Added `StorageUrls`, `PostAnalytics`, `PostMetadata` models
   - Updated `Post` model with storage and analytics fields

6. **`backend/main.py`** (Updated)
   - Firebase Admin initialization with Storage bucket
   - CORS middleware for frontend
   - Router inclusion

---

## 🎨 Frontend Implementation

### Files Created

1. **`frontend/src/types/post.ts`**
   - TypeScript interfaces for posts
   - `Post`, `PostContent`, `PostAnalytics`, `StorageUrls`
   - `CreatePostRequest`, `UpdatePostRequest`

2. **`frontend/src/app/dashboard/template/[id]/page.tsx`** (400+ lines)
   - Template detail page showing:
     - Template name (editable inline)
     - Performance stats (total posts, avg engagement, saves, impressions)
     - List of all posts created from template
     - Post thumbnails and analytics
     - Edit/Delete template actions
   
3. **`frontend/src/app/dashboard/post/[id]/page.tsx`** (400+ lines)
   - Post detail page showing:
     - All slide images from Firebase Storage
     - Slide content (text + image prompts)
     - Caption and hashtags
     - Analytics metrics (impressions, engagement, saves, shares)
     - Template information
     - Post status and metadata

---

## 🚀 Setup Instructions

### 1. Firebase Configuration

**Create Firebase Project:**
1. Go to https://console.firebase.google.com/
2. Create new project "slideforge-2488d" (or your name)
3. Enable Firestore Database
4. Enable Firebase Storage
5. Enable Firebase Authentication

**Download Service Account Key:**
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `backend/serviceAccountKey.json`

**Update Storage Bucket:**
Edit `backend/main.py` line 30:
```python
firebase_admin.initialize_app(cred, {
    'storageBucket': 'YOUR-PROJECT-ID.appspot.com'
})
```

### 2. Install Dependencies

**Backend:**
```powershell
pip install firebase-admin google-generativeai fastapi uvicorn python-multipart
```

**Frontend:**
```powershell
cd frontend
npm install @tanstack/react-query
```

### 3. Firestore Security Rules

Go to Firestore → Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /templates/{templateId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Templates - users can only modify their own
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
    }
    
    // Posts - users can only access their own
    match /posts/{postId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
    
    // Analytics - users can only write their own
    match /analytics/{analyticsId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.uid == request.resource.data.userId;
    }
    
    // Variant sets - users can only access their own
    match /variantSets/{variantSetId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Firebase Storage Rules

Go to Storage → Rules and add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Posts - users can upload to their own posts
    match /posts/{postId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📊 Usage Examples

### Create a Template

```python
# Backend
from services.firestore_service import create_template
from models import CreateTemplateRequest, StyleConfig

template_data = CreateTemplateRequest(
    name="Motivational Quotes",
    category="quote",
    styleConfig=StyleConfig(...),
    isDefault=True
)

template_id = await create_template(user_id="user123", template_data=template_data)
```

### Create a Post

```python
from services.firestore_service import create_post
from models import CreatePostRequest, PostContent

post_data = CreatePostRequest(
    templateId="template123",
    platform="instagram",
    content=PostContent(
        slides=[...],
        caption="Check this out!",
        hashtags=["motivation", "quotes"]
    )
)

post_id = await create_post(user_id="user123", post_data=post_data)
```

### Upload Slide Images

```python
from services.firestore_service import upload_slide_image

# Upload each slide
for i, image_bytes in enumerate(slide_images):
    url = await upload_slide_image(
        post_id="post123",
        slide_number=i + 1,
        image_data=image_bytes
    )
    print(f"Slide {i+1} uploaded: {url}")
```

### Track Analytics

```python
from services.firestore_service import track_post_analytics
from models import TrackAnalyticsRequest, PostMetrics

analytics_data = TrackAnalyticsRequest(
    postId="post123",
    templateId="template123",
    platform="instagram",
    metrics=PostMetrics(
        impressions=1500,
        engagement=250,
        saves=45,
        shares=12,
        engagementRate=16.67
    )
)

await track_post_analytics(analytics_data, user_id="user123")
```

---

## 🔗 API Routes

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/templates` | Create new template |
| GET | `/api/templates` | List user templates |
| GET | `/api/templates/{id}` | Get template details with posts |
| PUT | `/api/templates/{id}` | Update template |
| DELETE | `/api/templates/{id}` | Archive template |
| POST | `/api/templates/{id}/set-default` | Set as default |
| GET | `/api/templates/{id}/posts` | Get template posts |
| GET | `/api/templates/{id}/analytics` | Get template analytics |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create new post |
| GET | `/api/posts` | List user posts |
| GET | `/api/posts/{id}` | Get post details |
| PUT | `/api/posts/{id}` | Update post |
| POST | `/api/posts/{id}/publish` | Mark as published |
| POST | `/api/posts/{id}/upload-slide` | Upload slide image |
| POST | `/api/posts/{id}/upload-thumbnail` | Upload thumbnail |
| POST | `/api/posts/{id}/analytics` | Track analytics |
| GET | `/api/posts/{id}/analytics` | Get analytics history |

---

## 🧪 Testing

### Start Backend

```powershell
cd SlideForge
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload
```

### Test Template Creation

```bash
curl -X POST http://localhost:8000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "category": "listicle",
    "isDefault": true,
    "styleConfig": {...}
  }'
```

### Access Detail Pages

- Template: `http://localhost:3000/dashboard/template/{templateId}`
- Post: `http://localhost:3000/dashboard/post/{postId}`

---

## 🎯 Key Features

### Efficient Data Storage

✅ **Posts stored at top-level** for fast queries  
✅ **Firebase Storage** for large image files  
✅ **Denormalized templates** for performance  
✅ **Embedded analytics** in posts for quick access  
✅ **Separate analytics collection** for aggregation

### Real-time Performance Tracking

✅ **Automatic aggregation** when analytics tracked  
✅ **Template performance** updates in real-time  
✅ **User stats** auto-increment (total posts, templates)  
✅ **Analytics history** for trend analysis

### User Experience

✅ **Template detail page** shows all posts + performance  
✅ **Post detail page** shows full content + analytics  
✅ **Inline editing** for template names  
✅ **One-click navigation** between templates and posts  
✅ **Visual slide preview** from Firebase Storage

---

## 🔥 Next Steps

1. **Get Firebase credentials**: Download `serviceAccountKey.json`
2. **Update bucket name**: Edit `backend/main.py` with your Storage bucket
3. **Set up Firestore/Storage rules**: Add security rules in Firebase Console
4. **Test API routes**: Create template → create post → upload slides → track analytics
5. **Test detail pages**: Navigate to template/post detail pages
6. **Integrate with Gemini**: Connect post generation to Firestore storage

---

## 📝 Notes

- **Authentication**: All routes require Firebase ID token in `Authorization: Bearer <token>` header
- **CORS**: Configured for `http://localhost:3000` (update for production)
- **Storage URLs**: Automatically made public for easy access
- **Analytics**: Embedded in posts + separate collection for flexibility
- **Denormalization**: Templates stored twice for query performance

---

## 🐛 Troubleshooting

**Firebase not initialized:**
- Ensure `serviceAccountKey.json` exists in `backend/` directory
- Check file contains full JSON object (not just email string)

**CORS errors:**
- Update `allow_origins` in `main.py` to include your frontend URL

**Upload fails:**
- Verify Storage bucket name matches your Firebase project
- Check Storage rules allow authenticated writes

**Template/Post not found:**
- Verify user owns the resource (userId matches auth token)
- Check Firestore collection structure matches documentation

---

## ✅ Implementation Complete!

All Firestore integration is now ready:
- ✅ Backend services created
- ✅ API routes implemented  
- ✅ Frontend pages built
- ✅ Firebase Storage integrated
- ✅ Analytics tracking ready

**Next**: Get your Firebase credentials and start testing! 🚀
