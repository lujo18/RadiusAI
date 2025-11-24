# 🚀 SlideForge Firestore Setup Checklist

## ✅ Completion Checklist

### 1. Firebase Project Setup
- [ ] Go to https://console.firebase.google.com/
- [ ] Create new project (or select existing "slideforge-2488d")
- [ ] Enable **Firestore Database**
  - [ ] Start in **production mode**
  - [ ] Choose region (us-central1 recommended)
- [ ] Enable **Firebase Storage**
  - [ ] Start in **production mode**
- [ ] Enable **Firebase Authentication**
  - [ ] Enable Email/Password provider (or your preferred method)

### 2. Download Service Account Key
- [ ] Go to Project Settings (⚙️ icon)
- [ ] Click "Service Accounts" tab
- [ ] Click "Generate New Private Key"
- [ ] Save downloaded JSON file as:
  ```
  backend/serviceAccountKey.json
  ```
- [ ] Verify file contains full JSON (not just email string)

### 3. Update Configuration Files

**backend/main.py:**
- [ ] Line 30: Update storage bucket name
  ```python
  'storageBucket': 'YOUR-PROJECT-ID.appspot.com'
  ```

**Find your bucket name:**
1. Firebase Console → Storage
2. Copy the bucket name from URL (e.g., `slideforge-2488d.appspot.com`)

### 4. Set Firestore Security Rules

- [ ] Go to Firestore → Rules tab
- [ ] Copy rules from `FIRESTORE_IMPLEMENTATION.md` (section "Firestore Security Rules")
- [ ] Click "Publish"
- [ ] Wait for deployment (should take ~30 seconds)

### 5. Set Storage Security Rules

- [ ] Go to Storage → Rules tab
- [ ] Copy rules from `FIRESTORE_IMPLEMENTATION.md` (section "Firebase Storage Rules")
- [ ] Click "Publish"
- [ ] Wait for deployment

### 6. Install Backend Dependencies

```powershell
cd SlideForge
.\venv\Scripts\Activate.ps1
pip install python-multipart
```

Verify all dependencies installed:
```powershell
pip list | Select-String -Pattern "firebase|fastapi|pydantic|multipart"
```

Should show:
- firebase-admin
- fastapi
- pydantic
- python-multipart

### 7. Start Backend Server

```powershell
cd SlideForge
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload
```

Expected output:
```
✅ Firebase initialized successfully
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 8. Test API Routes

**Option 1: Using PowerShell (with auth token)**
```powershell
# Replace YOUR_TOKEN with real Firebase ID token
$token = "YOUR_TOKEN"
$headers = @{ Authorization = "Bearer $token" }

# Test create template
Invoke-RestMethod -Uri "http://localhost:8000/api/templates" `
  -Method GET -Headers $headers
```

**Option 2: Using Postman**
- [ ] Import `SlideForge API` collection (if you have one)
- [ ] Set Authorization header: `Bearer YOUR_TOKEN`
- [ ] Test GET `/api/templates`
- [ ] Test POST `/api/templates` with template data

**Option 3: Run test script**
```powershell
# Edit backend/test_firestore.py
# Uncomment last line: asyncio.run(test_firestore())
python backend/test_firestore.py
```

### 9. Test Frontend Pages

Start frontend:
```powershell
cd frontend
npm run dev
```

Test pages:
- [ ] Create a template in dashboard
- [ ] Navigate to `http://localhost:3000/dashboard/template/{templateId}`
- [ ] Verify template details page loads
- [ ] Create a post from template
- [ ] Navigate to `http://localhost:3000/dashboard/post/{postId}`
- [ ] Verify post details page loads

### 10. Verify Firestore Data

- [ ] Go to Firestore Console
- [ ] Check `templates` collection has documents
- [ ] Check `posts` collection has documents
- [ ] Check `users` collection has documents
- [ ] Verify `users/{userId}/templates` subcollection exists

### 11. Verify Firebase Storage

- [ ] Go to Storage Console
- [ ] Upload a test slide image via API:
  ```python
  POST /api/posts/{postId}/upload-slide
  ```
- [ ] Check `posts/{postId}/slides/` folder exists
- [ ] Verify image is publicly accessible

### 12. Test Analytics Flow

Complete flow:
1. [ ] Create template
2. [ ] Create post from template
3. [ ] Upload slide images
4. [ ] Track analytics via API:
   ```python
   POST /api/posts/{postId}/analytics
   ```
5. [ ] Verify analytics appear in post detail page
6. [ ] Verify template performance updates
7. [ ] Check `analytics` collection in Firestore

---

## 🐛 Troubleshooting

### Firebase Not Initialized
**Error:** `⚠️  Firebase not initialized - serviceAccountKey.json not found`

**Fix:**
1. Verify file exists at `backend/serviceAccountKey.json`
2. Check file is valid JSON (not corrupted)
3. Restart server

### Storage Bucket Error
**Error:** `Could not initialize Firebase Storage`

**Fix:**
1. Update bucket name in `backend/main.py`
2. Verify bucket exists in Firebase Console
3. Check Storage is enabled in Firebase project

### CORS Error
**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Fix:**
1. Check `backend/main.py` CORS settings
2. Verify frontend URL matches `allow_origins`
3. Restart backend server

### Authentication Error
**Error:** `401 Unauthorized` when calling API

**Fix:**
1. Get Firebase ID token from frontend
2. Add to Authorization header: `Bearer <token>`
3. Verify token is not expired
4. Check Firestore rules allow authenticated access

### Template/Post Not Found
**Error:** `404 Not Found` when accessing detail pages

**Fix:**
1. Verify ID in URL is correct
2. Check user owns the resource
3. Verify Firestore has the document
4. Check browser console for errors

---

## ✅ Success Criteria

You've successfully set up Firestore when:

- ✅ Backend server starts without errors
- ✅ Firebase shows as initialized in console
- ✅ Can create template via API
- ✅ Can create post via API
- ✅ Template detail page loads with data
- ✅ Post detail page loads with data
- ✅ Analytics tracking updates template performance
- ✅ Firestore Console shows data in all collections
- ✅ Storage Console shows uploaded images

---

## 📚 Reference Documents

- **Full Implementation Guide:** `FIRESTORE_IMPLEMENTATION.md`
- **Quick Summary:** `FIRESTORE_SUMMARY.md`
- **Test Script:** `backend/test_firestore.py`
- **API Routes:** See `backend/routers/templates.py` and `backend/routers/posts.py`

---

## 🎯 Next Steps After Setup

Once everything is working:

1. **Integrate with Gemini:**
   - Connect post generation to `create_post()`
   - Auto-upload generated slide images
   - Track which prompts perform best

2. **Add Scheduling:**
   - Implement scheduled post publishing
   - Use Cloud Functions or cron jobs
   - Update post status automatically

3. **Build Analytics Dashboard:**
   - Chart performance over time
   - Compare template effectiveness
   - A/B test insights

4. **Add More Features:**
   - Batch post creation
   - Template cloning
   - Export to platform APIs
   - Automated hashtag suggestions

---

**Current Status:** ⏳ Awaiting Firebase credentials

**Next Action:** Download `serviceAccountKey.json` from Firebase Console

---

Good luck! 🚀
