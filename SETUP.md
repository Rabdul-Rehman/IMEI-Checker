# Setup Guide for Team Members

This guide will help you set up the project on your local machine.

## Quick Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/saad-subhani/imei.info.git
cd imei.info/my-app
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase database password:**
   - Go to: https://supabase.com/dashboard/project/jitbshriojfiobfybivm
   - Navigate to: **Settings** → **Database**
   - Find the **Database password** section
   - Copy the password (or reset it if needed)

3. **Edit `.env.local` file:**
   - Open `.env.local` in a text editor
   - Replace `your_supabase_database_password_here` with the actual password
   - Save the file

### Step 4: Run the Development Server
```bash
npm run dev
```

### Step 5: Test the Application
1. Open your browser and go to: http://localhost:3000
2. Enter a valid 15-digit IMEI number
3. The server-side API should connect to Supabase and return results

## Verifying Server-Side Works

To verify the server-side API is working:

1. **Check the terminal** - You should see:
   - "Ready" message from Next.js
   - No database connection errors

2. **Test the API endpoint directly:**
   ```bash
   # In a new terminal
   curl "http://localhost:3000/api/imei?imei=123456789012345"
   ```

3. **Check browser console** - When you submit an IMEI, check:
   - Network tab shows API calls to `/api/imei`
   - No 500 errors
   - Response contains data

## Troubleshooting

### Database Connection Errors

**Error: "password authentication failed"**
- Check that your `.env.local` file has the correct password
- Verify the password in Supabase Dashboard → Settings → Database

**Error: "could not connect to server"**
- Check your internet connection
- Verify the host is correct: `db.jitbshriojfiobfybivm.supabase.co`
- Check if Supabase is accessible from your network

**Error: "relation does not exist"**
- The database might not be set up yet
- Contact the repository owner to ensure the database is migrated

### Port Already in Use

If port 3000 is already in use:
```bash
# Use a different port
npm run dev -- -p 3001
```

### Missing Dependencies

If you get module not found errors:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PGUSER` | PostgreSQL username | `postgres` |
| `PGHOST` | Database host | `db.jitbshriojfiobfybivm.supabase.co` |
| `PGDATABASE` | Database name | `postgres` |
| `PGPASSWORD` | Database password | (from Supabase Dashboard) |
| `PGPORT` | Database port | `5432` |

## Need Help?

- Check the main [README.md](./README.md)
- Review [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) for database details
- Contact the repository owner for database access
