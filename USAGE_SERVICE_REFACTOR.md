# Backend Usage Service Refactor - Optimized System

## Overview
The usage service has been refactored with a cleaner architecture that centralizes product ID resolution and usage tracking. The new system uses helper methods for reusable logic and supports any metric (brands, templates, posts, etc.).

## Key Improvements

### 1. **Product ID Resolution** (`_get_user_product_id`)
```python
def _get_user_product_id(user_id: str) -> Optional[str]
```
- Checks if user has `stripe_product_id` (they are an owner)
- If not owner, finds their team and gets the team owner's product_id via foreign keys
- Returns the product_id for use in rate limit lookups
- Handles both owner and team member scenarios

### 2. **Team Usage Extraction** (`_get_team_usage`)
```python
def _get_team_usage(team_id: str) -> Dict[str, Any]
```
- Retrieves the usage JSON from team_activity row
- Returns empty dict if team_activity doesn't exist
- Single responsibility: just extract usage data

### 3. **Metric Limit Lookup** (`_get_metric_limit`)
```python
def _get_metric_limit(product_id: Optional[str], metric_name: str) -> Optional[int]
```
- Gets limit for any metric from product_rate_limits table
- Looks for `rules.limits.{metric_name}` structure
- Falls back to legacy rules parsing if needed
- Works for: "brand_count", "template_count", "post_count", etc.

### 4. **Metric Usage Lookup** (`_get_metric_usage`)
```python
def _get_metric_usage(team_id: str, metric_name: str) -> int
```
- Gets current usage count for any metric
- Returns 0 if not found
- Used by both read and write operations

---

## Generic Usage Methods (Reusable for Any Metric)

### Read Operation
```python
def get_metric_usage(user_id: str, metric_name: str) -> Dict[str, Any]
```
Returns:
```json
{
  "metric_count": 2,
  "metric_limit": 5,
  "remaining": 3
}
```

### Check + Write Operation
```python
def check_and_track_metric(user_id: str, metric_name: str, amount: int = 1) -> Dict[str, Any]
```
Returns:
```json
{
  "allowed": true,
  "metric_count": 3,
  "metric_limit": 5,
  "remaining": 2,
  "message": null
}
```
or
```json
{
  "allowed": false,
  "metric_count": 5,
  "metric_limit": 5,
  "remaining": 0,
  "message": "Brand_count limit reached: 5/5"
}
```

### Remove Operation
```python
def decrement_metric(user_id: str, metric_name: str, amount: int = 1) -> Dict[str, Any]
```
Returns:
```json
{
  "metric_count": 4,
  "metric_limit": 5,
  "remaining": 1
}
```

---

## Specific Metric Methods (Brand & Template Examples)

### Brand Usage
```python
# Read
def get_brand_usage(user_id: str) -> Dict[str, Any]

# Check + Write
def check_and_track_brand(user_id: str, amount: int = 1) -> Dict[str, Any]

# Remove
def decrement_brand(user_id: str, amount: int = 1) -> Dict[str, Any]
```

### Template Usage
```python
# Read
def get_template_usage(user_id: str) -> Dict[str, Any]

# Check + Write
def check_and_track_template(user_id: str, amount: int = 1) -> Dict[str, Any]

# Remove
def decrement_template(user_id: str, amount: int = 1) -> Dict[str, Any]
```

---

## Usage Flow Example

### Creating a Brand (with limit enforcement)
```python
# 1. Check limit before UI action
usage = get_brand_usage(user_id)
if usage['remaining'] <= 0:
    # Show UI error: "Brand limit reached"
    return

# 2. Frontend calls backend to track
result = check_and_track_brand(user_id, amount=1)
if not result['allowed']:
    # Backend rejected: limit exceeded
    return 403 Forbidden

# 3. Proceed with brand creation
brand = create_brand(...)

# 4. If deleted later, decrement
decrement_brand(user_id, amount=1)
```

---

## Data Structures

### Product Rate Limits (database)
```json
{
  "product_id": "prod_123",
  "rules": {
    "limits": {
      "brands": 5,
      "templates": 10,
      "posts": 100
    }
  }
}
```

### Team Activity Usage (database)
```json
{
  "team_id": "team_123",
  "usage": {
    "brand_count": 2,
    "template_count": 4,
    "post_count": 25,
    "credits": {
      "text_generation": 100,
      "image_generation": 50,
      "total": 150
    }
  }
}
```

### User -> Team -> Owner Resolution Chain
```
User (user_id)
├─ If stripe_product_id exists → Use directly (owner)
└─ Else lookup team:
   └─ Team (team_id)
      └─ owner_id
         └─ Owner User
            └─ stripe_product_id (found here)
```

---

## Implementation Benefits

1. **DRY (Don't Repeat Yourself)**
   - Generic helpers eliminate duplicate logic
   - New metrics only need 3 lines to implement

2. **Maintainability**
   - Clear separation of concerns
   - Helpers are testable in isolation
   - Single source of truth for limit lookup

3. **Flexibility**
   - Add new metrics without changing core logic
   - Support multiple limit sources (legacy rules + new limits structure)

4. **Future-Proof**
   - Can support team hierarchies
   - Easy to add more metadata (tier levels, feature flags)

---

## API Endpoints (No Changes to Existing)

All existing endpoints continue to work:
- `GET /api/usage/brands` → calls `get_brand_usage`
- `POST /api/usage/brands/track` → calls `check_and_track_brand`
- `GET /api/usage/templates` → calls `get_template_usage`
- `POST /api/usage/templates/track` → calls `check_and_track_template`

---

## Testing Recommendations

### Unit Tests (for helpers)
```python
def test_get_user_product_id_owner():
    """User with stripe_product_id is owner"""
    product_id = _get_user_product_id(owner_user_id)
    assert product_id == "prod_123"

def test_get_user_product_id_team_member():
    """User without stripe_product_id resolves via team owner"""
    product_id = _get_user_product_id(team_member_user_id)
    assert product_id == "prod_123"  # Team owner's product

def test_get_metric_limit():
    """Get limit for any metric"""
    brand_limit = _get_metric_limit("prod_123", "brand_count")
    assert brand_limit == 5

def test_check_and_track_brand_allowed():
    """Brand creation allowed when under limit"""
    result = check_and_track_brand(user_id, amount=1)
    assert result['allowed'] == True
    assert result['brand_count'] == 1

def test_check_and_track_brand_denied():
    """Brand creation denied when at limit"""
    # Setup: user already has 5 brands (at limit)
    result = check_and_track_brand(user_id, amount=1)
    assert result['allowed'] == False
    assert result['remaining'] == 0
```

### Integration Tests
1. Create user as owner → set product_id → check limit works
2. Create user as team member → resolve owner's product_id → check limit works
3. Create brand → increment brand_count → delete brand → decrement brand_count
4. Upgrade plan → product_limit increases → new metrics allowed

---

## File Changes

- **Modified**: `/backend/services/usage/service.py`
  - Added helpers: `_get_user_product_id`, `_get_team_usage`, `_get_metric_limit`, `_get_metric_usage`
  - Added generic methods: `get_metric_usage`, `check_and_track_metric`, `decrement_metric`
  - Refactored: `get_brand_usage`, `check_and_track_brand`, `decrement_brand` (brand trio)
  - Refactored: `get_template_usage`, `check_and_track_template`, `decrement_template` (template trio)
  - **No changes to API layer** (routers/usage.py)

---

## Migration Notes

- ✅ All existing endpoints continue to work
- ✅ Database schema unchanged
- ✅ Frontend API unchanged
- ✅ Backward compatible with existing client code
- ✅ Build verification: All routes compiled successfully

The system is now cleaner, more maintainable, and ready for adding more metrics in the future.
