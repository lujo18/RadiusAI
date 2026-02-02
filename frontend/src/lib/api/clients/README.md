Purpose
-------
`clients/` contains HTTP clients used by services (e.g., `backendClient`). These should be small axios/fetch wrappers that handle auth injection and low-level retry logic.

How to add a client
-------------------
1. Add a client file that exports a configured axios instance.
2. Add interceptors to inject Supabase session tokens when needed.
3. Keep clients stateless and focused on transport.
