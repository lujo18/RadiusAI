# Quick: Add Upgrade CTA to Any Page

## 1. Import Components

```tsx
import UpgradeFlow from '@/components/billing/UpgradeFlow';
import UsageBanner from '@/components/billing/UsageBanner';
```

## 2. Add to Your Component

### Full Banner (Auto-shows at limits)

```tsx
function YourPage() {
  return (
    <div>
      <UsageBanner />
      {/* Your content */}
    </div>
  );
}
```

### Compact Banner

```tsx
<UsageBanner compact className="mb-4" />
```

### Manual Upgrade Button

```tsx
function YourPage() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowUpgrade(true)}>
        Upgrade Plan
      </Button>
      
      <UpgradeFlow
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        trigger="paywall" // or "usage" or "manual"
        message="Custom message here" // optional
      />
    </>
  );
}
```

## 3. Paywall Example

```tsx
function FeatureButton() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { user } = useAuthStore();
  
  const handleClick = () => {
    if (!user?.hasFeature) {
      setShowUpgrade(true);
      return;
    }
    // Do feature action
  };
  
  return (
    <>
      <Button onClick={handleClick}>
        Premium Feature
      </Button>
      
      <UpgradeFlow
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        trigger="paywall"
        message="This feature requires Pro or higher"
      />
    </>
  );
}
```

## Props

### UpgradeFlow

```tsx
interface UpgradeFlowProps {
  isOpen: boolean;              // Control modal visibility
  onClose: () => void;          // Close handler
  trigger?: 'paywall' | 'usage' | 'manual'; // Default message context
  message?: string;             // Custom message (overrides trigger)
}
```

### UsageBanner

```tsx
interface UsageBannerProps {
  className?: string;  // Additional CSS classes
  compact?: boolean;   // Use compact layout (default: false)
}
```

## Backend Endpoints

### Get Available Upgrades

```typescript
const response = await fetch(`${API_URL}/api/billing/available-upgrades`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { upgrades } = await response.json();
// upgrades: Array of plans user can upgrade to
```

### Perform Upgrade

```typescript
const response = await fetch(`${API_URL}/api/billing/upgrade`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    newPriceId: 'price_xxx',  // Stripe Price ID
    // OR
    newProductId: 'prod_xxx', // Stripe Product ID
  }),
});

const { success, message } = await response.json();
```

That's it! 🚀
