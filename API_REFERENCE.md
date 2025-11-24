# 📋 API Quick Reference

## Authentication

All routes require Firebase authentication via Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Base URL
```
http://localhost:8000
```

---

## 📁 Templates API

### Create Template
```http
POST /api/templates
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Motivational Quotes",
  "category": "quote",
  "isDefault": true,
  "styleConfig": {
    "layout": {
      "slideCount": 5,
      "aspectRatio": "9:16",
      "structure": ["hook", "quote", "context", "application", "cta"]
    },
    "visual": {
      "background": {
        "type": "gradient",
        "colors": ["#667eea", "#764ba2"],
        "opacity": 1.0
      },
      "font": {
        "family": "Inter",
        "size": 48,
        "color": "#FFFFFF",
        "effects": ["bold", "shadow"]
      },
      "accentColor": "#FFD700"
    },
    "content": {
      "tone": "inspirational",
      "hookStyle": "question",
      "useEmojis": true,
      "ctaTemplate": "Follow for more!",
      "forbiddenWords": []
    }
  }
}

Response: { "templateId": "abc123", "message": "Template created successfully" }
```

### List Templates
```http
GET /api/templates
Authorization: Bearer <token>

Response: [
  {
    "id": "abc123",
    "name": "Motivational Quotes",
    "category": "quote",
    "performance": {
      "totalPosts": 15,
      "avgEngagementRate": 12.5,
      "avgSaves": 85,
      "avgImpressions": 2500
    },
    "postCount": 15
  }
]
```

### Get Template Details
```http
GET /api/templates/{templateId}
Authorization: Bearer <token>

Response: {
  "template": { /* template data */ },
  "posts": [ /* array of posts */ ],
  "analytics": [ /* analytics history */ ],
  "summary": {
    "totalPosts": 15,
    "avgEngagementRate": 12.5,
    "avgSaves": 85,
    "avgImpressions": 2500
  }
}
```

### Update Template
```http
PUT /api/templates/{templateId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "New Template Name"
}

Response: { "message": "Template updated successfully" }
```

### Delete Template
```http
DELETE /api/templates/{templateId}
Authorization: Bearer <token>

Response: { "message": "Template archived successfully" }
```

### Set Default Template
```http
POST /api/templates/{templateId}/set-default
Authorization: Bearer <token>

Response: { "message": "Default template updated successfully" }
```

---

## 📸 Posts API

### Create Post
```http
POST /api/posts
Content-Type: application/json
Authorization: Bearer <token>

{
  "templateId": "abc123",
  "platform": "instagram",
  "content": {
    "slides": [
      {
        "slideNumber": 1,
        "text": "Why do we fall?",
        "imagePrompt": "Person on mountain peak"
      },
      {
        "slideNumber": 2,
        "text": "Success is not final",
        "imagePrompt": "Motivational quote background"
      }
    ],
    "caption": "Daily motivation! 💪",
    "hashtags": ["motivation", "inspiration", "growth"]
  },
  "scheduledTime": null
}

Response: { "postId": "xyz789", "message": "Post created successfully" }
```

### List Posts
```http
GET /api/posts?status=published&limit=50
Authorization: Bearer <token>

Query Parameters:
- status: "draft" | "scheduled" | "published" | "failed" (optional)
- limit: number (default: 100)

Response: [
  {
    "id": "xyz789",
    "templateId": "abc123",
    "platform": "instagram",
    "status": "published",
    "analytics": { /* metrics */ },
    "storageUrls": { /* image URLs */ }
  }
]
```

### Get Post Details
```http
GET /api/posts/{postId}
Authorization: Bearer <token>

Response: {
  "id": "xyz789",
  "content": {
    "slides": [ /* slide data */ ],
    "caption": "...",
    "hashtags": [...]
  },
  "storageUrls": {
    "slides": ["https://...", "https://..."],
    "thumbnail": "https://..."
  },
  "analytics": {
    "impressions": 2500,
    "engagement": 420,
    "saves": 85,
    "shares": 23,
    "engagementRate": 16.8
  },
  "template": { /* template info */ },
  "analyticsHistory": [ /* history */ ]
}
```

### Update Post
```http
PUT /api/posts/{postId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "scheduled",
  "scheduledTime": "2024-01-15T10:00:00Z"
}

Response: { "message": "Post updated successfully" }
```

### Publish Post
```http
POST /api/posts/{postId}/publish
Authorization: Bearer <token>

Response: { "message": "Post published successfully" }
```

### Upload Slide Image
```http
POST /api/posts/{postId}/upload-slide?slide_number=1
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: (form-data)
- file: <image file>

Response: {
  "message": "Slide 1 uploaded successfully",
  "url": "https://storage.googleapis.com/...",
  "slideNumber": 1
}
```

### Upload Thumbnail
```http
POST /api/posts/{postId}/upload-thumbnail
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: (form-data)
- file: <image file>

Response: {
  "message": "Thumbnail uploaded successfully",
  "url": "https://storage.googleapis.com/..."
}
```

### Track Analytics
```http
POST /api/posts/{postId}/analytics
Content-Type: application/json
Authorization: Bearer <token>

{
  "postId": "xyz789",
  "templateId": "abc123",
  "platform": "instagram",
  "metrics": {
    "impressions": 2500,
    "reach": 2000,
    "engagement": 420,
    "saves": 85,
    "shares": 23,
    "comments": 45,
    "profileVisits": 67,
    "engagementRate": 16.8,
    "clickThroughRate": 2.68
  }
}

Response: {
  "analyticsId": "analytics123",
  "message": "Analytics tracked successfully"
}
```

### Get Analytics History
```http
GET /api/posts/{postId}/analytics?days=30
Authorization: Bearer <token>

Response: [
  {
    "date": "2024-01-15T12:00:00Z",
    "metrics": {
      "impressions": 2500,
      "engagement": 420,
      "saves": 85,
      "shares": 23
    }
  }
]
```

---

## 🧪 Testing with cURL

### Create Template
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

### List Templates
```bash
curl http://localhost:8000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Upload Slide
```bash
curl -X POST http://localhost:8000/api/posts/POST_ID/upload-slide?slide_number=1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@slide1.png"
```

---

## 🧪 Testing with PowerShell

```powershell
# Set token
$token = "YOUR_FIREBASE_TOKEN"
$headers = @{ Authorization = "Bearer $token" }

# Create template
$body = @{
  name = "Test Template"
  category = "quote"
  isDefault = $true
  styleConfig = @{ ... }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8000/api/templates" `
  -Method POST -Headers $headers -Body $body -ContentType "application/json"

# List templates
Invoke-RestMethod -Uri "http://localhost:8000/api/templates" `
  -Method GET -Headers $headers

# Upload slide
Invoke-RestMethod -Uri "http://localhost:8000/api/posts/POST_ID/upload-slide?slide_number=1" `
  -Method POST -Headers $headers -InFile "slide1.png"
```

---

## 📊 Response Status Codes

- **200 OK** - Success
- **201 Created** - Resource created
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Not authorized to access resource
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## 🔗 Frontend Routes

- Template Detail: `/dashboard/template/{templateId}`
- Post Detail: `/dashboard/post/{postId}`

---

## 💡 Common Workflows

### Create & Publish Post
1. Create template → `POST /api/templates`
2. Create post → `POST /api/posts`
3. Upload slides → `POST /api/posts/{id}/upload-slide` (for each slide)
4. Upload thumbnail → `POST /api/posts/{id}/upload-thumbnail`
5. Publish → `POST /api/posts/{id}/publish`
6. Track analytics → `POST /api/posts/{id}/analytics`

### View Performance
1. Get template details → `GET /api/templates/{id}`
2. Get template posts → `GET /api/templates/{id}/posts`
3. Get template analytics → `GET /api/templates/{id}/analytics`
4. View in UI → `/dashboard/template/{id}`

### Track Post Performance
1. Get post details → `GET /api/posts/{id}`
2. Track analytics → `POST /api/posts/{id}/analytics`
3. Get analytics history → `GET /api/posts/{id}/analytics`
4. View in UI → `/dashboard/post/{id}`

---

## 📝 Notes

- All dates in ISO 8601 format: `2024-01-15T10:00:00Z`
- File uploads use `multipart/form-data`
- Analytics auto-update template performance
- Storage URLs are public (no auth needed to view)
- Template deletion is soft (status=archived)

---

**Last Updated:** November 23, 2025
