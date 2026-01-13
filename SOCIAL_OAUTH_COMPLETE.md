# Social Media OAuth Integration - Complete

## ✅ Implementation Status: COMPLETE

The OAuth flow for social media platforms (TikTok, Instagram, LinkedIn, Twitter, Facebook) using Late API is now fully implemented and ready for testing.

---

## 🔄 OAuth Flow Overview

```
User clicks "Connect" 
  ↓
Frontend → Backend /connect-social/start
  ↓
Backend → Late API /connect/{platform} with redirect_url parameter
  ↓
Late API returns authUrl
  ↓
Frontend redirects to authUrl (TikTok/Instagram/etc.)
  ↓
User authorizes on social platform
  ↓
Late API handles OAuth callback
  ↓
Late API redirects to: {FRONTEND_URL}/brand/profiles?success=true&platform={platform}
  ↓
Frontend detects success parameter → shows success message
```

**Key Simplification**: Removed backend callback endpoint entirely. Late API handles the OAuth completion and redirects directly to frontend with success parameters.

---

## 📂 Files Modified

### Backend
- **`backend/routers/social_connect.py`**
  - POST `/connect-social/start` - Initiates OAuth with Late API
  - GET `/connect-social/test-connection` - Tests Late API connectivity
  - Uses `redirect_url` parameter: `{FRONTEND_URL}/brand/profiles?success=true&platform={platform}`
  - Removed callback endpoint (no longer needed)

### Frontend
- **`frontend/src/components/Profiles/IntegrationsList.tsx`**
  - Added `useSearchParams` for reading URL query parameters
  - Added `successMessage` state and display
  - Added `useEffect` to detect `?success=true&platform=X` on page load
  - Shows green success banner for 5 seconds, then auto-clears
  - Cleans URL by removing query parameters after reading

- **`frontend/src/lib/api/client.ts`**
  - Added `startSocialConnect()` function
  - Returns `authUrl` from backend

### Configuration
- **`backend/.env`**
  - `LATE_API_KEY` - Your Late API key (required)
  - `FRONTEND_URL` - Frontend URL for redirect (default: http://localhost:3000)

---

## 🚀 Quick Start

### 1. Install Dependencies

Backend:
```bash
cd backend
pip install -r requirements.txt
```

Frontend:
```bash
cd frontend
npm install
```

### 2. Configure Environment

Create/update `backend/.env`:
```env
LATE_API_KEY=your_late_api_key_here
FRONTEND_URL=http://localhost:3000
```

### 3. Start Servers

Backend:
```bash
cd backend
uvicorn backend.main:app --reload
```

Frontend:
```bash
cd frontend
npm run dev
```

### 4. Test OAuth Flow

1. Navigate to: http://localhost:3000/brand/profiles
2. Click "Connect" on TikTok (or any platform)
3. You'll be redirected to TikTok authorization
4. After authorizing, you'll return to profiles page with success message
5. Success banner shows for 5 seconds then disappears

---

## 🔧 API Endpoints

### POST `/connect-social/start`

Initiates OAuth flow for a social platform.

**Request Body:**
```json
{
  "platform": "tiktok",
  "user_id": "profile_123"
}
```

**Response:**
```json
{
  "authUrl": "https://www.tiktok.com/auth/authorize?...",
  "platform": "tiktok",
  "profile_id": "profile_123"
}
```

**Supported Platforms:**
- `tiktok`
- `instagram`
- `linkedin`
- `twitter`
- `facebook`

### GET `/connect-social/test-connection`

Tests connectivity to Late API (diagnostic endpoint).

**Response:**
```json
{
  "success": true,
  "status_code": 404,
  "api_reachable": true
}
```

---

## 🎨 Frontend Components

### Success Message Display

Located in `IntegrationsList.tsx`:

```tsx
{successMessage && (
  <div className="p-4 bg-kinetic-mint/10 border border-kinetic-mint/20 rounded-lg">
    <p className="text-sm text-kinetic-mint">{successMessage}</p>
  </div>
)}
```

Features:
- Green (`kinetic-mint`) success banner
- Shows platform name capitalized
- Auto-clears after 5 seconds
- Removes query parameters from URL

### Connect Button Logic

```tsx
const handleConnect = async (platformId: string) => {
  setConnecting(platformId);
  setError(null);

  try {
    const { authUrl } = await brandApi.startSocialConnect({
      platform: platformId,
      user_id: profileId,
    });

    // Redirect to social platform for authorization
    window.location.href = authUrl;
  } catch (err) {
    console.error('Failed to start OAuth:', err);
    setError(err instanceof Error ? err.message : 'Failed to connect account');
    setConnecting(null);
  }
};
```

---

## 🔍 Debugging

### Check Backend Connection

```bash
curl http://localhost:8000/connect-social/test-connection
```

**Expected Response:**
```json
{"success": true, "status_code": 404, "api_reachable": true}
```

### Test OAuth Start Endpoint

```bash
curl -X POST http://localhost:8000/connect-social/start \
  -H "Content-Type: application/json" \
  -d '{"platform": "tiktok", "user_id": "test_user_123"}'
```

**Expected Response:**
```json
{
  "authUrl": "https://www.tiktok.com/auth/authorize?...",
  "platform": "tiktok",
  "profile_id": "test_user_123"
}
```

### Verify URL Parameters After Redirect

After authorizing on TikTok, the URL should be:
```
http://localhost:3000/brand/profiles?success=true&platform=tiktok
```

Check browser console for:
- Success message state update
- Query parameter detection
- URL cleanup after 5 seconds

---

## 🔐 Security Considerations

### Current Implementation
- ✅ Late API key stored in backend only (never exposed to frontend)
- ✅ OAuth handled by Late API (secure, no token exposure)
- ✅ HTTPS required in production (Late API requirement)
- ✅ CORS configured for frontend origin only

### Production TODO
- [ ] Add CSRF protection for OAuth state parameter
- [ ] Store connection data in Supabase (profileId, platform, tokens)
- [ ] Implement token refresh logic
- [ ] Add rate limiting for OAuth endpoints
- [ ] Enable webhook for token updates from Late API

---

## 📊 Next Steps

### 1. Save Connection to Database
After successful OAuth, save to Supabase:

```typescript
// In useEffect after detecting success
const saveConnection = async () => {
  await supabase.from('social_connections').insert({
    profile_id: profileId,
    platform: platform,
    connected_at: new Date().toISOString(),
    // Add other fields from Late API response
  });
};
```

### 2. Implement Disconnect
Add mutation to remove connection:

```typescript
const handleDisconnect = async (integrationId: string) => {
  await supabase.from('social_connections')
    .delete()
    .eq('id', integrationId);
    
  // Optionally call Late API to revoke token
};
```

### 3. Add Token Refresh
Implement background job to refresh expiring tokens:

```python
# backend/services/token_refresh.py
async def refresh_expired_tokens():
    connections = await get_expiring_connections()
    for conn in connections:
        new_token = await late_api.refresh_token(conn.refresh_token)
        await update_connection_token(conn.id, new_token)
```

### 4. Enable Posting
Once connections are saved, enable posting through Late API:

```python
from backend.services.late_client import post_to_social

await post_to_social(
    profile_id="profile_123",
    platform="tiktok",
    content={
        "caption": "Check this out!",
        "media_urls": ["https://..."]
    }
)
```

---

## 🐛 Common Issues

### "Late API key not configured"
- Check `backend/.env` has `LATE_API_KEY=...`
- Restart backend after adding env variable
- Verify key is valid at https://getlate.dev/dashboard

### "Invalid platform"
- Platform must be one of: `tiktok`, `instagram`, `linkedin`, `twitter`, `facebook`
- Check case sensitivity (must be lowercase)

### "Failed to reach Late API"
- Verify internet connection
- Test connectivity: `curl https://getlate.dev`
- DNS should resolve to: `216.150.1.193`

### Success parameter not detected
- Check URL after redirect: `?success=true&platform=tiktok` should be present
- Verify `useSearchParams` is imported from `next/navigation`
- Check browser console for React errors

### Success message doesn't disappear
- Verify `setTimeout` in useEffect is working
- Check React strict mode (may cause double renders in dev)
- Look for JavaScript errors in console

---

## 📚 Related Documentation

- **Late API Docs**: https://docs.getlate.dev
- **Late Dashboard**: https://getlate.dev/dashboard
- **OAuth 2.0 Spec**: https://oauth.net/2/

---

## 🎉 Testing Checklist

Before deploying to production:

- [ ] Backend starts without errors
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Test connection endpoint returns success
- [ ] Click "Connect" redirects to social platform
- [ ] After authorizing, redirects back to frontend
- [ ] Success message displays correctly
- [ ] Success message auto-clears after 5 seconds
- [ ] URL query parameters are removed
- [ ] Error messages display for failed connections
- [ ] Loading state shows while connecting
- [ ] Multiple platforms can be tested

---

## 🔑 Key Improvements Made

### Before (Original Approach)
❌ Complex backend callback endpoint  
❌ Had to store temporary state in memory  
❌ Two redirects (Late → Backend → Frontend)  
❌ More error-prone  

### After (Simplified Approach)
✅ Uses Late's built-in `redirect_url` parameter  
✅ No temporary state needed  
✅ Single redirect (Late → Frontend directly)  
✅ Cleaner, more maintainable  
✅ Better user experience (faster)  

---

**Status**: ✅ Implementation complete. Ready for testing with valid Late API key.

**Next Action**: Test with real Late API key, then implement database storage for connections.
