# Expanded list of app/ imports referencing backend top-level modules or backend.*

## app/config.py

- Line 1: from backend.config import Config  
  - Type: from
  - Module: backend.config

## app/core/workers/analytics/__init__.py

- Line 2: from backend.services.workers.analytics.create_analytic_tracker import (  
  - Type: from
  - Module: backend.services.workers.analytics.create_analytic_tracker

- Line 5: from backend.services.workers.analytics.analytic_worker import *  
  - Type: from
  - Module: backend.services.workers.analytics.analytic_worker

## app/core/workers/analytics/analytic_worker.py

- Line 1: from services.workers.analytics.analytic_worker import (  
  - Type: from
  - Module: services.workers.analytics.analytic_worker

## app/core/workers/automation/__init__.py

- Line 2: from backend.services.workers.automation.automation_worker import *  
  - Type: from
  - Module: backend.services.workers.automation.automation_worker

## app/features/analytics/service.py

- Line 231: from backend.services.workers.analytics.create_analytic_tracker import create_analytic_tracker as _create_analytic_tracker  
  - Type: from
  - Module: backend.services.workers.analytics.create_analytic_tracker

## app/features/generate/genai/client.py

- Line 1: from app.core.config import settings  
  - Type: from
  - Module: app.core.config

## app/features/integrations/groq/client.py

- Line 1: from app.core.config import settings  
  - Type: from
  - Module: app.core.config

## app/features/integrations/groq/util/GenerateBrand.py

- Line 2: from backend.services.integrations.groq.util.GenerateBrand import generate_brand  
  - Type: from
  - Module: backend.services.integrations.groq.util.GenerateBrand

## app/features/integrations/social/profile/connect_account.py

- Line 2: from backend.services.profile.connect_account import connect_social  
  - Type: from
  - Module: backend.services.profile.connect_account

## app/features/integrations/social/profile/post.py

- Line 2: from backend.services.profile.post import *  
  - Type: from
  - Module: backend.services.profile.post

## app/features/integrations/social/provider.py

- Line 2: from backend.services.integrations.social.provider import get_social_provider  
  - Type: from
  - Module: backend.services.integrations.social.provider

## app/features/integrations/social/service.py

- Line 3: from backend.services.integrations.social.postforme.analytics_client import (  
  - Type: from
  - Module: backend.services.integrations.social.postforme.analytics_client

## app/features/integrations/supabase/client.py

- Line 2: from app.core.config import settings  
  - Type: from
  - Module: app.core.config

## app/features/integrations/supabase/db/platformIntegration.py

- Line 2: from backend.services.integrations.supabase.db.platformIntegration import *  
  - Type: from
  - Module: backend.services.integrations.supabase.db.platformIntegration

## app/features/integrations/unsplash/client.py

- Line 3: from app.core.config import settings  
  - Type: from
  - Module: app.core.config

## app/features/posts/utilities/renderSlides.py

- Line 2: from backend.services.pillow.renderSlides import SlideRenderer  
  - Type: from
  - Module: backend.services.pillow.renderSlides

## app/features/posts/utilities/slide_generation.py

- Line 2: from backend.services.slides.slide_generation import generate_slideshows  
  - Type: from
  - Module: backend.services.slides.slide_generation

## app/features/usage/service.py

- Line 291: from services.usage.service import track_slides_generated as _track_slides_generated  
  - Type: from
  - Module: services.usage.service

- Line 294: from backend.services.usage.service import track_slides_generated as _track_slides_generated  
  - Type: from
  - Module: backend.services.usage.service

## app/shared/security/decode_state.py

- Line 4: from app.core.config import settings  
  - Type: from
  - Module: app.core.config

## app/shared/security/generate_state.py

- Line 4: from app.core.config import settings  
  - Type: from
  - Module: app.core.config
