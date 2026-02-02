Purpose
-------
This folder contains small repository classes that wrap Supabase queries for each table (e.g., `PostRepository`, `TemplateRepository`). Repositories centralize typed DB access and error handling.

How to add or update a repo
---------------------------
1. Add a new file `src/lib/supabase/repos/<Name>Repository.ts` with a class exposing static methods.
2. Use literal table names with `supabase.from('table_name')` (to satisfy typed overloads).
3. Keep authorization checks consistent (use `requireUserId()` or accept `userId` param).
4. Return raw rows or typed objects; throw on Supabase errors.

Example responsibilities
------------------------
- Query building and rate-limiting considerations.
- Low-level CRUD operations.
- Minimal transformation (parsing JSON columns is OK).
