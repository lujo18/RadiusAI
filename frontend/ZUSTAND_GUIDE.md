# Zustand Store Usage Guide

## Auth Store

```tsx
import { useAuthStore } from '@/store';

function MyComponent() {
  // Select specific values (recommended - prevents unnecessary re-renders)
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // Usage
  const handleLogin = async () => {
    const userData = { id: '1', name: 'John', email: 'john@example.com', plan: 'pro' };
    const token = 'your-jwt-token';
    login(userData, token); // Automatically persists to localStorage
  };

  const handleLogout = () => {
    logout(); // Clears user data and token
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome {user?.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## Dashboard Store

```tsx
import { useDashboardStore } from '@/store';

function Dashboard() {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const isGenerating = useDashboardStore((state) => state.isGenerating);
  const setIsGenerating = useDashboardStore((state) => state.setIsGenerating);
  const scheduledPosts = useDashboardStore((state) => state.scheduledPosts);
  const addPost = useDashboardStore((state) => state.addPost);

  const handleGenerateWeek = async () => {
    setIsGenerating(true);
    // API call here
    const newPost = {
      id: '123',
      platform: 'Instagram',
      title: 'New Post',
      caption: 'Caption',
      scheduledTime: new Date(),
      status: 'scheduled',
      variantId: 'A',
    };
    addPost(newPost);
    setIsGenerating(false);
  };

  return (
    <div>
      <button onClick={() => setActiveTab('analytics')}>
        View Analytics
      </button>
      <button onClick={handleGenerateWeek} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Week'}
      </button>
    </div>
  );
}
```

## Style Guide Store

```tsx
import { useStyleGuideStore } from '@/store';

function StyleGuideEditor() {
  const content = useStyleGuideStore((state) => state.content);
  const setContent = useStyleGuideStore((state) => state.setContent);
  const saveContent = useStyleGuideStore((state) => state.saveContent);
  const isDirty = useStyleGuideStore((state) => state.isDirty);

  const handleSave = async () => {
    // Save to backend
    await fetch('/api/style-guide', {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    saveContent(content); // Updates lastUpdated and clears isDirty
  };

  return (
    <div>
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
      />
      {isDirty && <span>Unsaved changes</span>}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

## Analytics Store

```tsx
import { useAnalyticsStore } from '@/store';

function AnalyticsDashboard() {
  const performanceData = useAnalyticsStore((state) => state.performanceData);
  const setPerformanceData = useAnalyticsStore((state) => state.setPerformanceData);
  const timeframe = useAnalyticsStore((state) => state.timeframe);
  const setTimeframe = useAnalyticsStore((state) => state.setTimeframe);

  const fetchAnalytics = async () => {
    const data = await fetch(`/api/analytics?timeframe=${timeframe}`);
    const json = await data.json();
    setPerformanceData(json.performanceData);
  };

  return (
    <div>
      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
      <button onClick={fetchAnalytics}>Refresh</button>
    </div>
  );
}
```

## Best Practices

### ✅ DO:
- Select only the state you need
- Use separate selectors for better performance
- Keep actions in the store, not in components
- Use persist middleware for user preferences

### ❌ DON'T:
- Don't select the entire store unless you need everything
- Don't mutate state directly (Zustand handles immutability)
- Don't put API calls in the store (keep them in components/services)

## Performance Optimization

```tsx
// ❌ Bad - re-renders on any state change
const { user, isAuthenticated, login, logout } = useAuthStore();

// ✅ Good - only re-renders when user changes
const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login); // Actions don't cause re-renders
```

## DevTools

Install Zustand DevTools for debugging:

```bash
npm install @redux-devtools/extension
```

Then wrap your store:

```tsx
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({ /* ... */ }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }
  )
);
```
