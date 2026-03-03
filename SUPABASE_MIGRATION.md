# Migrating Database to Supabase

This guide will help you export your local PostgreSQL database and upload it to Supabase.

## Method 1: Using PowerShell Script (Recommended)

1. **Run the export script:**
   ```powershell
   cd my-app
   .\export-to-supabase.ps1
   ```

2. **Enter your database credentials when prompted:**
   - Host (default: localhost)
   - Port (default: 5432)
   - Database name
   - Username
   - Password

3. **The script will generate three files:**
   - `database-schema.sql` - Schema only (tables, indexes, constraints)
   - `database-data.sql` - Data only (INSERT statements)
   - `database-complete.sql` - Complete database (schema + data)

## Method 2: Using pg_dump Directly

If you prefer to use pg_dump directly:

```powershell
# Export complete database
pg_dump -h localhost -p 5432 -U your_username -d your_database_name --no-owner --no-acl -f database-export.sql

# Or export schema and data separately
pg_dump -h localhost -p 5432 -U your_username -d your_database_name --schema-only --no-owner --no-acl -f schema.sql
pg_dump -h localhost -p 5432 -U your_username -d your_database_name --data-only --no-owner --no-acl -f data.sql
```

## Method 3: Using Environment Variables

If you have your database credentials in environment variables:

```powershell
# Set environment variables
$env:PGPASSWORD = "your_password"

# Export database
pg_dump -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE --no-owner --no-acl -f database-export.sql

# Clear password
$env:PGPASSWORD = $null
```

## Uploading to Supabase

### Option A: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard:**
   - Visit https://supabase.com
   - Sign in to your account
   - Create a new project or select an existing one

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Import your database:**
   - Open the `database-complete.sql` file in a text editor
   - Copy all the contents
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify:**
   - Go to "Table Editor" to verify your tables were created
   - Check that data was imported correctly

### Option B: Using Supabase CLI

1. **Install Supabase CLI:**
   ```powershell
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```powershell
   supabase login
   ```

3. **Link your project:**
   ```powershell
   supabase link --project-ref your-project-ref
   ```

4. **Push database:**
   ```powershell
   Get-Content database-complete.sql | supabase db push
   ```

### Option C: Using psql (Direct Connection)

1. **Get your Supabase connection string:**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the "Connection string" (URI format)

2. **Import using psql:**
   ```powershell
   psql "your-supabase-connection-string" -f database-complete.sql
   ```

## Updating Your Application

After migrating to Supabase, update your environment variables:

1. **Get Supabase connection details:**
   - Go to Supabase Dashboard → Settings → Database
   - Note down:
     - Host
     - Port (usually 5432)
     - Database name
     - Username
     - Password

2. **Update your `.env.local` file in `my-app` folder:**
   ```env
   PGUSER=your_supabase_user
   PGHOST=db.your-project-ref.supabase.co
   PGDATABASE=postgres
   PGPASSWORD=your_supabase_password
   PGPORT=5432
   ```

3. **Or use Supabase connection string:**
   ```env
   DATABASE_URL=postgresql://user:password@db.project-ref.supabase.co:5432/postgres
   ```

## Troubleshooting

### Common Issues:

1. **Permission errors:**
   - Use `--no-owner --no-acl` flags with pg_dump
   - Supabase will handle ownership automatically

2. **Connection refused:**
   - Check if PostgreSQL is running locally
   - Verify host and port are correct

3. **Authentication failed:**
   - Double-check username and password
   - Ensure PostgreSQL allows connections from your IP

4. **Import errors in Supabase:**
   - Some PostgreSQL-specific features may not work in Supabase
   - Check Supabase documentation for compatibility
   - You may need to modify the SQL file manually

## Database Schema

Your database contains:
- `brands` table - Phone brands
- `phones` table - Phone models with specifications

Make sure both tables are exported correctly before uploading to Supabase.
