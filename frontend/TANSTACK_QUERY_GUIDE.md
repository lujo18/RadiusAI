# TanStack Query + Backend Integration Guide

## 🚀 Quick Start

### 1. Environment Variables

Create/update `.env.local`:

```bash
# Local Development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production (Serverless)
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
# or
NEXT_PUBLIC_API_URL=https://your-function.azurewebsites.net
# or
NEXT_PUBLIC_API_URL=https://your-cloud-function.cloudfunctions.net
```

### 2. Using Hooks in Components

```tsx
import { useScheduledPosts, useGenerateWeek } from '@/lib/api/hooks';

function Dashboard() {
  // Fetch data (automatic caching, loading, error handling)
  const { data: posts, isLoading, error } = useScheduledPosts();

  // Mutation (create/update/delete)
  const { mutate: generateWeek, isLoading: isGenerating } = useGenerateWeek();

  const handleGenerate = () => {
    generateWeek('your-style-guide-content', {
      onSuccess: (data) => {
        console.log('Generated:', data);
      },
      onError: (error) => {
        console.error('Failed:', error);
      }
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Week'}
      </button>
      {posts?.map(post => <div key={post.id}>{post.title}</div>)}
    </div>
  );
}
```

## 📡 Backend FastAPI Routes to Build

### Content API

```python
# FastAPI backend routes needed

@app.get("/api/content/scheduled")
async def get_scheduled_posts(user_id: str = Depends(get_current_user)):
    """Return list of scheduled posts"""
    return {"posts": [...]}

@app.post("/api/content/generate")
async def generate_week_content(
    styleGuide: str,
    user_id: str = Depends(get_current_user)
):
    """Generate 98 posts using AI"""
    # Your AI generation logic
    return {"posts": [...], "message": "Generated 98 posts"}

@app.delete("/api/content/{post_id}")
async def delete_post(post_id: str, user_id: str = Depends(get_current_user)):
    """Delete a post"""
    return {"success": True}

@app.put("/api/content/{post_id}")
async def update_post(
    post_id: str,
    updates: dict,
    user_id: str = Depends(get_current_user)
):
    """Update post details"""
    return {"post": {...}}
```

### Analytics API

```python
@app.get("/api/analytics")
async def get_analytics(
    timeframe: str = "week",
    user_id: str = Depends(get_current_user)
):
    """Return analytics data"""
    return {
        "performanceData": [...],
        "stats": {...}
    }

@app.get("/api/analytics/variants")
async def get_variant_performance(user_id: str = Depends(get_current_user)):
    """Return A/B test results"""
    return {"variants": [...]}

@app.post("/api/analytics/analyze")
async def analyze_and_evolve(user_id: str = Depends(get_current_user)):
    """Run AI analysis and update strategy"""
    # Your AI analysis logic
    return {"insights": [...], "updatedStyleGuide": "..."}
```

### Style Guide API

```python
@app.get("/api/style-guide")
async def get_style_guide(user_id: str = Depends(get_current_user)):
    """Get user's style guide"""
    return {"content": "...", "lastUpdated": "..."}

@app.put("/api/style-guide")
async def update_style_guide(
    content: str,
    user_id: str = Depends(get_current_user)
):
    """Update style guide"""
    return {"content": content, "lastUpdated": "..."}
```

### User API

```python
@app.get("/api/user/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    """Get user profile"""
    return {"id": "...", "name": "...", "email": "...", "plan": "..."}

@app.put("/api/user/profile")
async def update_profile(
    updates: dict,
    user_id: str = Depends(get_current_user)
):
    """Update user profile"""
    return {"id": "...", "name": "...", ...}

@app.get("/api/user/accounts")
async def get_connected_accounts(user_id: str = Depends(get_current_user)):
    """Get connected social accounts"""
    return {"accounts": [...]}
```

## 🔐 Firebase Auth Verification in FastAPI

```python
# backend/auth.py
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase Admin
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Verify Firebase token and return user_id"""
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")
```

## 🎯 Usage Examples

### Fetching Data

```tsx
// Simple fetch
const { data, isLoading } = useScheduledPosts();

// With error handling
const { data, isLoading, error, refetch } = useScheduledPosts();

// Manual refetch
<button onClick={() => refetch()}>Refresh</button>

// Dependent query (only runs when user exists)
const { data } = useQuery({
  queryKey: ['userPosts', userId],
  queryFn: () => fetchUserPosts(userId),
  enabled: !!userId, // Only run if userId exists
});
```

### Mutations

```tsx
// Generate week
const { mutate, isLoading, error } = useGenerateWeek();

mutate(styleGuide, {
  onSuccess: (data) => {
    toast.success('Generated 98 posts!');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});

// Delete post
const { mutate: deletePost } = useDeletePost();
deletePost('post-id-123');

// Update post
const { mutate: updatePost } = useUpdatePost();
updatePost({
  postId: 'post-123',
  updates: { title: 'New Title' }
});
```

### Optimistic Updates

```tsx
const { mutate } = useMutation({
  mutationFn: updatePost,
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['posts'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['posts']);

    // Optimistically update
    queryClient.setQueryData(['posts'], (old) => {
      return old.map(p => 
        p.id === variables.postId ? { ...p, ...variables.updates } : p
      );
    });

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['posts'], context.previous);
  },
});
```

## 🌐 Deploying to Serverless

### Vercel (Recommended for Next.js)

```bash
# Deploy frontend
vercel deploy

# Add environment variable in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

### FastAPI Backend Options

**1. Vercel (Python Serverless)**
```python
# api/index.py
from fastapi import FastAPI
app = FastAPI()
# ... your routes
```

**2. AWS Lambda + API Gateway**
```bash
pip install mangum
# Use mangum to wrap FastAPI for Lambda
```

**3. Google Cloud Run**
```dockerfile
FROM python:3.11
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**4. Railway / Render**
- Push to GitHub
- Connect repo
- Auto-deploys on push

## 🔍 DevTools

Open React Query DevTools (development only):
- Bottom-left floating icon
- Shows all queries, cache state, network calls
- Perfect for debugging

## 📊 Query Configuration

```tsx
// Global config in QueryProvider.tsx
staleTime: 60 * 1000,     // How long data is fresh
gcTime: 5 * 60 * 1000,    // How long to keep in cache
retry: 1,                  // Retry failed requests once
refetchOnWindowFocus: false, // Don't refetch on tab focus
```

## 🎨 Common Patterns

### Loading & Error States

```tsx
const { data, isLoading, isError, error } = useScheduledPosts();

if (isLoading) return <Spinner />;
if (isError) return <Error message={error.message} />;

return <PostList posts={data} />;
```

### Pagination

```tsx
const [page, setPage] = useState(1);
const { data } = useQuery({
  queryKey: ['posts', page],
  queryFn: () => fetchPosts(page),
  keepPreviousData: true, // Keep old data while fetching new
});
```

### Infinite Scroll

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

## 🚨 Error Handling

```tsx
// In hooks.ts
export function useScheduledPosts() {
  return useQuery({
    queryKey: queryKeys.scheduledPosts,
    queryFn: async () => {
      try {
        return await contentApi.getScheduledPosts();
      } catch (error) {
        // Custom error handling
        if (error.response?.status === 404) {
          return []; // Return empty array for 404
        }
        throw error; // Let React Query handle other errors
      }
    },
  });
}
```

## 📝 Quick Reference

| Hook | Purpose | Auto-Refetch |
|------|---------|--------------|
| `useScheduledPosts` | Get posts | 30s |
| `useAnalytics` | Get analytics | 2min, 5min |
| `useStyleGuide` | Get style guide | 10min |
| `useGenerateWeek` | Create posts | - |
| `useDeletePost` | Delete post | - |

All set! Build your FastAPI routes and the frontend will automatically connect. 🚀
