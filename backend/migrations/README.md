# Database Migrations

This folder contains database migration scripts for the BAK UP CIC E-Voucher System.

## How to Run Migrations

### On Render (Production)

1. Open Render Dashboard
2. Go to your web service
3. Click "Shell" tab
4. Run the migration script:
   ```bash
   cd backend/migrations
   python3 add_redemption_requests_table.py
   ```

### Locally (Development)

1. Ensure DATABASE_URL environment variable is set:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost/dbname"
   ```

2. Run the migration script:
   ```bash
   cd backend/migrations
   python3 add_redemption_requests_table.py
   ```

## Migration History

| Version | Date | Script | Description |
|---------|------|--------|-------------|
| 1.0.4 | 2026-01-12 | `add_redemption_requests_table.py` | Added redemption_requests table for 2-step voucher redemption workflow with recipient approval |

## Important Notes

- Always backup your database before running migrations
- Run migrations in order (by version number)
- Each migration should only be run ONCE
- Migrations are idempotent (safe to run multiple times) but may show warnings
- Verify migration success before proceeding with application deployment

## Troubleshooting

### "DATABASE_URL not set" error
Make sure the DATABASE_URL environment variable is configured in your environment.

### "Table already exists" warning
This is normal if the migration was already run. The script uses `CREATE TABLE IF NOT EXISTS`.

### Connection timeout
Check your database connection settings and network connectivity.

### Permission denied
Ensure your database user has CREATE TABLE and CREATE INDEX permissions.
