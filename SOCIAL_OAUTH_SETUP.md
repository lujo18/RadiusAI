# Social OAuth Implementation - Quick Setup

## ✅ What Was Implemented

A generalized OAuth flow for connecting social media accounts (TikTok, Instagram, LinkedIn, Twitter, Facebook) using the Late API.

### Files Created/Modified:

1. **`backend/routers/social_connect.py`** (NEW)
   - Generalized OAuth endpoints
   - Platform-agnostic implementation
   - Routes: `/connect-social/start`, `/connect-social/callback`, `/connect-social/status/{token}`, `/connect-social/cancel/{token}`

2. **`backend/main.py`** (MODIFIED)
   - Added `social_connect` router import
   - Registered router with FastAPI app

3. **`backend/config.py`** (MODIFIED)
   - Added `get_settings()` helper function
   - `LATE_API_KEY` already configured

4. **`backend/.env.example`** (MODIFIED)
   - Added `LATE_API_KEY` example

5. **`SOCIAL_OAUTH_GUIDE.md`** (NEW)
   - Complete implementation guide
   - Frontend integration examples
   - Platform setup instructions
   - Security best practices

6. **`backend/test_social_connect.py`** (NEW)
   - Unit tests for router validation
   - All tests passing ✅

## 🚀 Quick Start

### 1. Add Late API Key

Add to `backend/.env`:
```env
LATE_API_KEY=your_late_api_key_here
```

Get your key from: https://dashboard.getlate.dev/settings/api

### 2. Test the Endpoints

#### Start OAuth Flow
```bash
curl -X POST http://localhost:8000/connect-social/start \
  -H "Content-Type: application/json" \
  -d '{"platform": "tiktok", "user_id": "test-user"}'
```

Response:
```json
{
  "authUrl": "https://www.tiktok.com/auth/authorize?...",
  "platform": "tiktok",
  "message": "Redirect user to authUrl to authorize TikTok access"
}
```

#### Check Status
```bash
curl http://localhost:8000/connect-social/status/{connect_token}
```

### 3. Configure OAuth Redirect

In your social platform's developer console, set the redirect URL to:
- **Development**: `http://localhost:8000/connect-social/callback`
- **Production**: `https://api.yourdomain.com/connect-social/callback`

## 📋 Supported Platforms

- ✅ TikTok
- ✅ Instagram
- ✅ LinkedIn
- ✅ Twitter
- ✅ Facebook

## 🔌 API Endpoints

### POST `/connect-social/start`
Start OAuth flow for a platform

**Body:**
```json
{
  "platform": "tiktok|instagram|linkedin|twitter|facebook",
  "user_id": "optional-user-id"
}
```

### GET `/connect-social/callback`
OAuth callback (automatic redirect from social platform)

**Query Params:**
- `code`: Authorization code
- `state`: Connect token

### GET `/connect-social/status/{connect_token}`
Check if a connect token is valid

### DELETE `/connect-social/cancel/{connect_token}`
Cancel an in-progress connection

## 🎨 Frontend Integration Example

```typescript
// Start OAuth flow
const connectSocial = async (platform: string) => {
  const response = await fetch('/api/connect-social/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, user_id: userId })
  });

  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirect to social platform
};

// Use it
<button onClick={() => connectSocial('tiktok')}>
  Connect TikTok
</button>
```

## 🔒 Security Features

- ✅ Connect tokens expire after 10 minutes
- ✅ Automatic cleanup of expired tokens
- ✅ Platform validation
- ✅ Error handling for all Late API failures
- ✅ State parameter validation (CSRF protection)

## 📦 Next Steps

1. **Production Ready**:
   - Replace in-memory `connect_token_cache` with Redis
   - Encrypt access/refresh tokens before storing
   - Set up token refresh cron job

2. **Database**:
   - Create `social_connections` table in Supabase
   - Store Late profile data (see SOCIAL_OAUTH_GUIDE.md)

3. **Frontend**:
   - Create social connection UI components
   - Add success/error pages
   - Display connected accounts in settings

4. **Testing**:
   - Test with real social media accounts
   - Verify OAuth flows end-to-end
   - Test token expiration/refresh

## 📚 Documentation

See [SOCIAL_OAUTH_GUIDE.md](./SOCIAL_OAUTH_GUIDE.md) for:
- Complete architecture explanation
- Frontend integration examples
- Platform-specific setup instructions
- Database schema
- Security best practices
- Troubleshooting guide

## ✅ Tests

Run tests:
```bash
cd backend
python test_social_connect.py
```

All tests passing:
- ✅ Platform validation
- ✅ Endpoint configuration
- ✅ Router structure

## 🎯 Key Features

1. **Platform Agnostic**: Single codebase for all platforms
2. **Generalized Routes**: `/connect-social/*` instead of platform-specific
3. **Server-Side Flow**: Late API never touches user's browser
4. **Complete Control**: Your branding, your UX, your success pages
5. **Secure**: Token expiration, validation, cleanup
6. **Type Safe**: Full type hints, proper error handling
7. **Tested**: Unit tests verify core functionality

## 💡 Usage Tips

- Use the `user_id` parameter to associate connections with your users
- Store the returned `profileId` from Late API - you'll need it for posting
- Set up proper error handling in your frontend
- Monitor Late API rate limits
- Use webhooks for real-time connection status updates

---

**Implementation Complete!** 🎉

The OAuth flow is ready to use. Add your `LATE_API_KEY` and start connecting social accounts.
