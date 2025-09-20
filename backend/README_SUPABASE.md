Supabase Progress Persistence

This guide explains how to enable real Supabase persistence for user progress and how to run a test script that uses the service-role key.

1) Create the tables in Supabase
- Open your Supabase SQL editor and run the migration file:

  - `backend/migrations/001_create_progress_tables.sql`

2) Set environment variables (PowerShell example)

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<your-service-role-key>"
```

3) Run the integration test script

```powershell
cd backend
python .\scripts\supabase_progress_test.py
```

If the script prints the inserted rows and aggregates, persistence is working.

Security note: Only use the `SUPABASE_SERVICE_ROLE_KEY` on trusted servers (never in client-side code). For app servers, store keys in environment variables or a secrets manager.
