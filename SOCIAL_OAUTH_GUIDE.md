# Social Media OAuth Integration Guide

## Overview

This guide explains how to connect social media accounts (TikTok, Instagram, LinkedIn, Twitter, Facebook) using the generalized OAuth flow with Late API.

## Architecture

```
Frontend → Backend → Social Platform OAuth → Backend → Late API → Backend → Success
```

**Key Points:**
- Late API never touches the user's browser
- No Late redirects or branding (except unavoidable OAuth consent screens)
- Complete control over UX
- All tokens stored securely on your backend

## API Endpoints

### 1. Start OAuth Flow

```http
POST /connect-social/start
```

**Request Body:**
```json
{
  "platform": "tiktok",  // tiktok, instagram, linkedin, twitter, facebook
  "user_id": "optional-user-id"
}
```

**Response:**
```json
{
  "authUrl": "https://www.tiktok.com/auth/authorize?...",
  "platform": "tiktok",
  "message": "Redirect user to authUrl to authorize TikTok access"
}
```

**Frontend Implementation:**
```typescript
// Start OAuth flow
const response = await fetch('/api/connect-social/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ platform: 'tiktok', user_id: userId })
});

const { authUrl } = await response.json();

// Redirect user to social platform
window.location.href = authUrl;
```

### 2. OAuth Callback (Automatic)

```http
GET /connect-social/callback?code=xxx&state=yyy
```

**Query Parameters:**
- `code`: Authorization code from social platform
- `state`: Connect token (automatically passed by OAuth flow)

**Response:**
```json
{
  "success": true,
  "platform": "tiktok",
  "profile": {
    "profileId": "late-profile-id",
    "accessToken": "encrypted-token",
    "refreshToken": "encrypted-refresh-token",
    "expiresIn": 3600,
    "username": "user_handle",
    "displayName": "User Name"
  },
  "userId": "your-user-id",
  "message": "TikTok account connected successfully"
}
```

## Frontend Integration

### Complete Flow Example

```typescript
// pages/connect-social.tsx
import { useState } from 'react';

export default function ConnectSocialPage() {
  const [platform, setPlatform] = useState('tiktok');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      // Step 1: Start OAuth flow
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connect-social/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ 
          platform,
          user_id: currentUserId 
        })
      });

      const { authUrl } = await response.json();

      // Step 2: Redirect to social platform for authorization
      window.location.href = authUrl;

      // Step 3: User will be redirected back to /connect-social/callback
      // (handled automatically by your backend)
      
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Connect Social Media</h1>
      <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
        <option value="tiktok">TikTok</option>
        <option value="instagram">Instagram</option>
        <option value="linkedin">LinkedIn</option>
        <option value="twitter">Twitter</option>
        <option value="facebook">Facebook</option>
      </select>
      <button onClick={handleConnect} disabled={loading}>
        {loading ? 'Connecting...' : `Connect ${platform}`}
      </button>
    </div>
  );
}
```

### Success Page

After the callback completes, redirect users to your own success page:

```typescript
// pages/social-connected.tsx
export default function SocialConnectedPage() {
  const router = useRouter();
  const { platform, success } = router.query;

  return (
    <div className="glass-card">
      <h1>✅ {platform} Connected!</h1>
      <p>Your {platform} account is now connected and ready to use.</p>
      <button onClick={() => router.push('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}
```

## Backend Configuration

### 1. Environment Setup

Add to `backend/.env`:

```env
LATE_API_KEY=your_late_api_key_here
```

Get your API key from: https://dashboard.getlate.dev/settings/api

### 2. Configure OAuth Redirect URL

In your social platform's developer settings, set the redirect URL to:

```
https://yourdomain.com/connect-social/callback
```

**Development:**
```
http://localhost:8000/connect-social/callback
```

**Production:**
```
https://api.yourdomain.com/connect-social/callback
```

### 3. Platform-Specific Setup

#### TikTok
1. Create app at https://developers.tiktok.com/
2. Add redirect URL: `{your_backend}/connect-social/callback`
3. Request permissions: `user.info.basic`, `video.publish`

#### Instagram
1. Create app at https://developers.facebook.com/
2. Enable Instagram Basic Display API
3. Add redirect URL
4. Request permissions: `user_profile`, `user_media`

#### LinkedIn
1. Create app at https://www.linkedin.com/developers/
2. Add redirect URL
3. Request permissions: `r_liteprofile`, `w_member_social`

## Storing Connection Data

After successful callback, save the profile data to Supabase:

```python
# In social_connect.py callback endpoint
from services.integrations.supabase.client import get_supabase

async def social_connect_callback(...):
    # ... existing code ...
    
    profile_data = response.json()
    
    # Save to Supabase
    supabase = get_supabase()
    supabase.table('social_connections').insert({
        'user_id': user_id,
        'platform': platform,
        'late_profile_id': profile_data['profileId'],
        'access_token': encrypt(profile_data['accessToken']),  # Encrypt tokens!
        'refresh_token': encrypt(profile_data['refreshToken']),
        'expires_at': datetime.now() + timedelta(seconds=profile_data['expiresIn']),
        'username': profile_data.get('username'),
        'display_name': profile_data.get('displayName'),
        'connected_at': datetime.now()
    }).execute()
    
    return {
        "success": True,
        "platform": platform,
        "profile": profile_data
    }
```

## Database Schema

Create a `social_connections` table in Supabase:

```sql
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  late_profile_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,  -- Encrypted
  refresh_token TEXT NOT NULL,  -- Encrypted
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  username VARCHAR(255),
  display_name VARCHAR(255),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Index for fast lookups
CREATE INDEX idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
```

## Error Handling

### Common Errors

**"LATE_API_KEY not configured"**
- Add `LATE_API_KEY` to `backend/.env`
- Restart backend server

**"Invalid or expired connect token"**
- User took too long (>10 minutes)
- Ask user to restart the connection flow
- Consider increasing timeout in production

**"Unsupported platform"**
- Check platform name is one of: tiktok, instagram, linkedin, twitter, facebook
- Platform names are case-insensitive

**Late API errors (4xx/5xx)**
- Check Late API status: https://status.getlate.dev
- Verify your API key is valid
- Check Late dashboard for rate limits

## Testing

### 1. Test Start Endpoint

```bash
curl -X POST http://localhost:8000/connect-social/start \
  -H "Content-Type: application/json" \
  -d '{"platform": "tiktok", "user_id": "test-user"}'
```

### 2. Test Callback (Manual)

After getting authUrl and completing OAuth:

```bash
curl "http://localhost:8000/connect-social/callback?code=test_code&state=connect_token_here"
```

### 3. Check Connection Status

```bash
curl http://localhost:8000/connect-social/status/your_connect_token
```

## Production Checklist

- [ ] Use Redis for `connect_token_cache` (not in-memory dict)
- [ ] Encrypt access_token and refresh_token before storing
- [ ] Set up token refresh cron job (tokens expire)
- [ ] Add rate limiting to prevent abuse
- [ ] Enable HTTPS for all OAuth redirects
- [ ] Configure proper CORS for frontend domain
- [ ] Add logging for OAuth failures
- [ ] Set up monitoring/alerts for Late API errors
- [ ] Add user-facing error messages
- [ ] Test with real social media accounts

## Security Best Practices

1. **Never expose Late API key to frontend**
2. **Always encrypt tokens in database**
3. **Use HTTPS in production**
4. **Validate state parameter to prevent CSRF**
5. **Clean up expired tokens regularly**
6. **Implement rate limiting**
7. **Log all OAuth attempts for audit**

## Next Steps

1. Create frontend components for social connection UI
2. Add token refresh logic for expired access tokens
3. Implement posting functionality using Late API
4. Add disconnect/revoke functionality
5. Build analytics dashboard for connected accounts

## Resources

- [Late API Documentation](https://docs.getlate.dev)
- [Late API Dashboard](https://dashboard.getlate.dev)
- [TikTok Developer Portal](https://developers.tiktok.com)
- [Instagram API Docs](https://developers.facebook.com/docs/instagram-api)
- [LinkedIn API Docs](https://learn.microsoft.com/en-us/linkedin/)
