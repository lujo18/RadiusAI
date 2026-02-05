# Automation Frontend API Quick Reference

## 1. Import Hooks in Components

```typescript
import {
  useAutomations,
  useAutomation,
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
  useToggleAutomationActive,
  useUpdateAutomationSchedule,
  useUpdateAutomationNextRun,
  useAutomationRuns,
  useLatestAutomationRun,
  useAutomationSuccessRate,
} from '@/lib/api/hooks';
```

## 2. Fetch Automations for a Brand

```typescript
function AutomationsList({ brandId }: { brandId: string }) {
  const { data: automations, isLoading, error } = useAutomations(brandId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {automations?.map(auto => (
        <li key={auto.id}>{auto.name}</li>
      ))}
    </ul>
  );
}
```

## 3. Get Single Automation Details

```typescript
function AutomationDetail({ automationId }: { automationId: string }) {
  const { data: automation } = useAutomation(automationId);
  
  return (
    <div>
      <h2>{automation?.name}</h2>
      <p>Active: {automation?.is_active ? 'Yes' : 'No'}</p>
      <p>Next Run: {automation?.next_run_at}</p>
    </div>
  );
}
```

## 4. Create New Automation

```typescript
function CreateAutomation({ brandId }: { brandId: string }) {
  const { mutate: create, isPending } = useCreateAutomation();
  
  const handleSubmit = () => {
    create({
      brandId,
      payload: {
        name: 'Weekly Newsletter',
        template_ids: ['t1', 't2'],
        cta_ids: ['c1'],
        platforms: ['instagram'],
        schedule: {
          weekday: ['Monday', 'Friday'],
          time: ['09:00'],
        },
        next_run_at: new Date().toISOString(),
        cursor_template_index: 0,
        cursor_cta_index: 0,
        is_active: true,
        error_count: 0,
      },
    });
  };
  
  return <button onClick={handleSubmit} disabled={isPending}>Create</button>;
}
```

## 5. Update Automation

```typescript
const { mutate: update } = useUpdateAutomation();

update({
  id: 'automation-id',
  updates: {
    name: 'Updated Name',
    is_active: false,
  },
});
```

## 6. Toggle Active Status

```typescript
const { mutate: toggle } = useToggleAutomationActive();

toggle({
  id: automationId,
  isActive: true,
});
```

## 7. Update Schedule

```typescript
const { mutate: updateSchedule } = useUpdateAutomationSchedule();

updateSchedule({
  id: automationId,
  schedule: {
    weekday: ['Monday', 'Wednesday', 'Friday'],
    time: ['09:00', '14:00'],
  },
});
```

## 8. Delete Automation

```typescript
const { mutate: deleteAuto } = useDeleteAutomation();

deleteAuto(automationId);
```

## 9. View Automation Execution History

```typescript
function AutomationHistory({ automationId }: { automationId: string }) {
  const { data: runs } = useAutomationRuns(automationId, 20);
  
  return (
    <ul>
      {runs?.map(run => (
        <li key={run.id}>
          <strong>{run.status}</strong> - {new Date(run.run_started_at).toLocaleString()}
          {run.error_message && <p>Error: {run.error_message}</p>}
        </li>
      ))}
    </ul>
  );
}
```

## 10. Get Latest Run (Real-time Polling)

```typescript
function LatestRunStatus({ automationId }: { automationId: string }) {
  const { data: latestRun } = useLatestAutomationRun(automationId, {
    refetchInterval: 10000, // Poll every 10 seconds
  });
  
  return (
    <div>
      <p>Latest Status: {latestRun?.status}</p>
      <p>Ran at: {latestRun?.run_started_at}</p>
    </div>
  );
}
```

## 11. View Success Rate Metrics

```typescript
function SuccessMetrics({ automationId }: { automationId: string }) {
  const { data: metrics } = useAutomationSuccessRate(automationId, 7); // Last 7 days
  
  return (
    <div>
      <p>Total Runs: {metrics?.total}</p>
      <p>Successful: {metrics?.successes}</p>
      <p>Failed: {metrics?.failures}</p>
      <p>Success Rate: {metrics?.rate}%</p>
    </div>
  );
}
```

## 12. View Failed Runs Only

```typescript
function FailedRuns({ automationId }: { automationId: string }) {
  const { data: failed } = useFailedAutomationRuns(automationId, 10);
  
  return (
    <ul>
      {failed?.map(run => (
        <li key={run.id}>
          {run.error_message}
        </li>
      ))}
    </ul>
  );
}
```

## 13. View Successful Runs Only

```typescript
function SuccessfulRuns({ automationId }: { automationId: string }) {
  const { data: successful } = useSuccessfulAutomationRuns(automationId, 10);
  
  return (
    <ul>
      {successful?.map(run => (
        <li key={run.id}>
          ✓ {new Date(run.run_started_at).toLocaleString()}
        </li>
      ))}
    </ul>
  );
}
```

## 14. Get All Runs Across Automations for Brand

```typescript
function BrandRunHistory({ brandId }: { brandId: string }) {
  const { data: allRuns } = useAutomationRunsByBrand(brandId, 100);
  
  return (
    <div>
      Total runs across all automations: {allRuns?.length}
    </div>
  );
}
```

## 15. Error Handling Pattern

```typescript
function AutomationForm({ brandId }: { brandId: string }) {
  const { mutate: create } = useCreateAutomation();
  
  const handleCreate = async () => {
    create(
      {
        brandId,
        payload: { /* ... */ },
      },
      {
        onSuccess: (data) => {
          console.log('Created:', data.id);
          // Show success toast
        },
        onError: (error) => {
          console.error('Failed to create:', error.message);
          // Show error toast
        },
      }
    );
  };
  
  return <button onClick={handleCreate}>Create</button>;
}
```

## Query States

All hooks return:
```typescript
{
  data: T,              // The actual data
  isLoading: boolean,   // Initial fetch in progress
  isPending: boolean,   // Mutation in progress
  error: Error | null,  // Any error
  refetch: () => void,  // Manual refetch (queries)
}
```

## Cache Invalidation

Mutations automatically invalidate relevant caches:
- `useCreateAutomation()` → invalidates `automationKeys.lists()`
- `useUpdateAutomation()` → invalidates `automationKeys.lists()` and updates detail
- `useDeleteAutomation()` → removes detail, invalidates lists
- `useToggleAutomationActive()` → updates detail and lists
- `useUpdateAutomationSchedule()` → updates detail and lists
- `useUpdateAutomationNextRun()` → updates detail and lists

## Stale Times

- Automations queries: **5 minutes**
- Automation runs queries: **2 minutes**
- Latest run query: **1 minute** (allows fast polling)
- Success rate: **5 minutes**

## Direct API Access

If you need to bypass hooks (rare):

```typescript
// Import surface API directly
import { automationApi } from '@/lib/api/surface/automationApi';
import { automationRunApi } from '@/lib/api/surface/automationRunApi';

// Use directly
const automations = await automationApi.list(brandId);
const runs = await automationRunApi.list(automationId);
const deleted = await automationApi.delete(automationId);
```

## Type Definitions

```typescript
import type { Database } from '@/types/database';

type Automation = Database['public']['Tables']['automations']['Row'];
type AutomationRun = Database['public']['Tables']['automation_runs']['Row'];
type AutomationInsert = Database['public']['Tables']['automations']['Insert'];
type AutomationUpdate = Database['public']['Tables']['automations']['Update'];
```

## Common Patterns

### Full CRUD Example
```typescript
function AutomationManager({ brandId, automationId }: Props) {
  const { data: automation } = useAutomation(automationId);
  const { mutate: update, isPending: isUpdating } = useUpdateAutomation();
  const { mutate: delete: deleteAuto } = useDeleteAutomation();
  
  return (
    <div>
      <h2>{automation?.name}</h2>
      <button
        onClick={() => update({ id: automationId, updates: { is_active: false } })}
        disabled={isUpdating}
      >
        Disable
      </button>
      <button onClick={() => deleteAuto(automationId)}>Delete</button>
    </div>
  );
}
```

### Performance Dashboard
```typescript
function Dashboard({ automationId }: Props) {
  const { data: latest } = useLatestAutomationRun(automationId);
  const { data: metrics } = useAutomationSuccessRate(automationId, 7);
  const { data: recentRuns } = useAutomationRuns(automationId, 10);
  
  return (
    <div>
      <h3>Latest: {latest?.status}</h3>
      <p>{metrics?.rate}% success rate (last 7 days)</p>
      <h4>Recent Executions:</h4>
      {recentRuns?.map(run => (
        <div key={run.id}>{run.status}</div>
      ))}
    </div>
  );
}
```
