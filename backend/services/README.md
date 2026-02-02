Purpose
-------
This folder contains backend service-level code used by the FastAPI app (or workers). Services encapsulate domain logic, background processing, and integrations with external systems (AI, storage, etc.).

How to add a new backend service
-------------------------------
1. Create a module under `backend/services/<feature>/` and expose functions/classes for the feature.
2. Keep IO (network, DB) centralized and injectable where possible for testability.
3. Add unit tests and a small integration test for external clients.

Running & Testing
-----------------
- Use the project's virtualenv and run the backend in dev mode:

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
