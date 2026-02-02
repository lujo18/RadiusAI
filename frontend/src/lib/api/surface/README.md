Purpose
-------
`surface/` exposes the UI-friendly API the rest of the app imports. Keep this layer thin and stable — it should translate frontend needs into service calls.

Guidelines
----------
- Only export small, stable functions for the UI to consume.
- Avoid heavy logic here — delegate to services.
- Provide consistent parameter shapes and throw clear errors.

Example flow for a new feature
------------------------------
1. Add orchestration in `services/`.
2. Add a thin wrapper in `surface/` that calls the service.
3. Add React Query hooks in `hooks/` that call `surface/`.
