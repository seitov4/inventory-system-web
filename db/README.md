# Database Schema Documentation

## Overview

This directory contains the database schema and migrations for the Inventory Management System.

## Files

- `schema.sql` - Main database schema (supports both legacy and new structure)
- `schema_v2.sql` - Complete v2.0 schema with all improvements
- `backend/src/db/init.sql` - Canonical runtime init (Postgres). Preferred for automated setup and runtime init.
- `backend/src/db/init.sqlite.sql` - Canonical runtime init for SQLite.
 - `schema.sql` - (moved) Legacy archived schema available in `db/legacy/`
 - `schema_v2.sql` - (moved) Legacy v2 archived schema available in `db/legacy/`
- `migrations/` - Database migration scripts
  - `001_add_sku_unique_index.sql` - Adds unique constraint to products.sku
  - `002_update_schema_to_v2.sql` - Migrates existing database to v2.0 structure
- `DATA_MODEL.md` - Complete data model documentation

## Architecture Principles

1. **Stock is Derived** - Stock quantities can ONLY be changed through Movement records
2. **Complete Audit Trail** - Every stock change must be recorded in Movement table
3. **Transactional Integrity** - Sales, returns, and transfers are atomic
4. **Multi-Warehouse Support** - One product can exist in multiple warehouses
5. **Soft Deletes** - Products use `is_active` flag instead of hard deletion

## Schema Evolution

The schema supports backward compatibility:
- Legacy fields (warehouse_from, warehouse_to, quantity, reason) are preserved
- New fields (warehouse_id, direction, qty, source_type, comment) are added
- Application code can be migrated gradually

## Quick Start

### Fresh Installation

Recommended: use the canonical init file under the backend package which includes creation + migrations:

```bash
psql -U your_user -d your_database -f backend/src/db/init.sql
```

### Migrating Existing Database

```bash
psql -U your_user -d your_database -f migrations/002_update_schema_to_v2.sql
```

## Key Tables

- **users** - System users (cashier, manager, owner, admin)
- **products** - Product catalog
- **warehouses** - Physical locations (stores, warehouses)
- **stock** - Current stock quantities (updated via Movement only)
- **movements** - Complete audit trail of all stock changes (CORE)
- **sales** - Sales transactions
- **sale_items** - Items within a sale
- **notifications** - System notifications

See `DATA_MODEL.md` for complete documentation.

