Purpose
-------
`routers/` contains FastAPI route modules that map HTTP endpoints to service functions. Keep routing thin — business logic should live in services.

How to add a route
------------------
1. Create a router module `backend/routers/<feature>.py` with a `APIRouter()` instance.
2. Inject service dependencies (e.g., DB client, auth) via FastAPI `Depends`.
3. Keep validation in Pydantic models and call service-layer functions.

Testing
-------
- Use FastAPI TestClient for integration tests against the router.
