# Outline: Imports inside backend/app/ referencing modules outside app/

## File: app/core/workers/analytics/analytic_worker.py

- Line 1: from services.workers.analytics.analytic_worker import (  
  - Type: from
  - Module: services.workers.analytics.analytic_worker

## File: app/features/usage/service.py

- Line 291: from services.usage.service import track_slides_generated as _track_slides_generated  
  - Type: from
  - Module: services.usage.service

## File: app/shared/security/decode_state.py

- Line 4: from config import Config  
  - Type: from
  - Module: config


Total occurrences: 3
