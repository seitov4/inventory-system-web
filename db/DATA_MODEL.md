# Inventory Management System - Data Model Documentation

## Architectural Principles

1. **Stock is a derived entity** - Stock quantities can ONLY be changed through Movement records
2. **Complete audit trail** - Every stock change must be recorded in Movement table
3. **Transactional integrity** - Sales, returns, and transfers must be atomic
4. **Multi-warehouse support** - One product can exist in multiple warehouses
5. **Soft deletes** - Products use `is_active` flag instead of hard deletion

---

## Entity Relationship Diagram

```
User (1) ──────< (M) Movement
User (1) ──────< (M) Sale
User (1) ──────< (M) Notification

Product (1) ────< (M) Stock
Product (1) ────< (M) Movement
Product (1) ────< (M) SaleItem

Warehouse (1) ───< (M) Stock
Warehouse (1) ───< (M) Movement
Warehouse (1) ───< (M) Sale

Sale (1) ───────< (M) SaleItem
Sale (1) ───────< (M) Movement (via related_entity_id)
```

---

## Tables

### 1. users

**Purpose**: System users (cashiers, managers, owners, admins)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| email | VARCHAR(255) | UNIQUE | Email (can be null if phone exists) |
| phone | VARCHAR(50) | UNIQUE | Phone (can be null if email exists) |
| first_name | VARCHAR(100) | | User first name |
| last_name | VARCHAR(100) | | User last name |
| store_name | VARCHAR(255) | | Store name (for store owners) |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'cashier' | cashier \| manager \| owner \| admin |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: email, role

**Constraints**: At least one of email or phone must be provided

---

### 2. products

**Purpose**: Product catalog

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| name | VARCHAR(255) | NOT NULL | Product name |
| sku | VARCHAR(100) | NOT NULL, UNIQUE | Stock Keeping Unit |
| barcode | VARCHAR(100) | UNIQUE | Barcode (nullable) |
| category | VARCHAR(255) | | Product category |
| purchase_price | NUMERIC(10,2) | | Purchase price |
| sale_price | NUMERIC(10,2) | | Sale price |
| min_stock | INTEGER | DEFAULT 0 | Minimum stock level for alerts |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: sku, barcode, category, is_active

**Constraints**: sku must be unique, barcode must be unique if provided

---

### 3. warehouses

**Purpose**: Physical locations (stores, warehouses)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| name | VARCHAR(255) | NOT NULL | Warehouse name |
| type | VARCHAR(50) | | store \| warehouse |
| address | TEXT | | Physical address |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

**Indexes**: type

---

### 4. stock

**Purpose**: Current stock quantities (derived entity, updated only via Movement)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| product_id | INTEGER | FK → products.id, NOT NULL | Product reference |
| warehouse_id | INTEGER | FK → warehouses.id, NOT NULL | Warehouse reference |
| quantity | INTEGER | NOT NULL, DEFAULT 0, ≥ 0 | Current quantity |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**: product_id, warehouse_id, (product_id, warehouse_id)

**Constraints**: 
- UNIQUE (product_id, warehouse_id)
- quantity >= 0

**Important**: This table should NEVER be updated directly. All changes must go through Movement table.

---

### 5. movements

**Purpose**: Complete audit trail of all stock changes (CORE ENTITY)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| product_id | INTEGER | FK → products.id, NOT NULL | Product reference |
| warehouse_id | INTEGER | FK → warehouses.id, NOT NULL | Warehouse reference |
| direction | SMALLINT | NOT NULL, -1 or +1 | -1 = decrease, +1 = increase |
| qty | INTEGER | NOT NULL, > 0 | Quantity (always positive) |
| source_type | VARCHAR(20) | NOT NULL | IN \| OUT \| SALE \| RETURN \| TRANSFER \| ADJUST |
| related_entity_id | INTEGER | | Reference to sale_id, transfer_id, etc. |
| created_by | INTEGER | FK → users.id | User who created movement |
| comment | TEXT | | Optional comment/reason |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: 
- product_id
- warehouse_id
- source_type
- created_at
- created_by
- related_entity_id (partial, WHERE IS NOT NULL)
- (product_id, warehouse_id, created_at DESC)

**Constraints**:
- direction IN (-1, 1)
- qty > 0

**Business Rules**:
- Each Movement record affects ONE warehouse
- For TRANSFER operations, create TWO Movement records:
  - Movement 1: direction=-1, warehouse_id=from_warehouse
  - Movement 2: direction=+1, warehouse_id=to_warehouse
- direction determines stock increase/decrease: stock.quantity += (direction * qty)

---

### 6. sales

**Purpose**: Sales transactions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| cashier_id | INTEGER | FK → users.id | Cashier user |
| warehouse_id | INTEGER | FK → warehouses.id, NOT NULL | Warehouse/store |
| total_amount | NUMERIC(12,2) | NOT NULL | Total sale amount |
| discount | NUMERIC(12,2) | DEFAULT 0 | Total discount |
| payment_type | VARCHAR(50) | | cash \| card \| mixed |
| status | VARCHAR(20) | DEFAULT 'completed' | completed \| returned |
| created_at | TIMESTAMP | DEFAULT NOW() | Sale timestamp |

**Indexes**: cashier_id, warehouse_id, status, created_at

**Business Rules**:
- Creating a sale automatically creates Movement records for each item (SALE type, direction=-1)
- Returning a sale creates Movement records (RETURN type, direction=+1)

---

### 7. sale_items

**Purpose**: Items within a sale

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| sale_id | INTEGER | FK → sales.id, NOT NULL | Sale reference |
| product_id | INTEGER | FK → products.id, NOT NULL | Product reference |
| qty | INTEGER | NOT NULL, > 0 | Quantity sold |
| price | NUMERIC(10,2) | NOT NULL | Unit price |
| discount | NUMERIC(10,2) | DEFAULT 0 | Item discount |

**Indexes**: sale_id, product_id

**Constraints**: qty > 0

---

### 8. notifications

**Purpose**: System notifications for users

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Primary key |
| type | VARCHAR(50) | NOT NULL | low_stock \| system \| analytics |
| user_id | INTEGER | FK → users.id | Target user |
| payload | JSONB | | Notification data (flexible) |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes**: user_id, type, is_read, created_at DESC

**Business Rules**:
- Low stock notifications are automatically created when stock.quantity <= product.min_stock
- Notifications are created after Movement records are committed

---

## Key Business Logic

### Stock Updates

All stock updates follow this pattern:

1. Create Movement record(s) with appropriate direction and source_type
2. Update stock.quantity: `quantity += (direction * qty)`
3. Check if quantity <= min_stock → create Notification if needed
4. All within a single database transaction

### Transfer Operations

Transfer between warehouses requires TWO Movement records:

```sql
-- Movement 1: Decrease from source warehouse
INSERT INTO movements (product_id, warehouse_id, direction, qty, source_type, ...)
VALUES (product_id, from_warehouse_id, -1, qty, 'TRANSFER', ...);

-- Movement 2: Increase to destination warehouse
INSERT INTO movements (product_id, warehouse_id, direction, qty, source_type, ...)
VALUES (product_id, to_warehouse_id, 1, qty, 'TRANSFER', ...);
```

### Sale Operations

1. Create Sale record
2. Create SaleItem records
3. For each SaleItem, create Movement (direction=-1, source_type='SALE', related_entity_id=sale.id)
4. Update Stock
5. Check min_stock → create Notifications if needed
6. All in one transaction

### Return Operations

1. Update Sale.status = 'returned'
2. For each SaleItem, create Movement (direction=+1, source_type='RETURN', related_entity_id=sale.id)
3. Update Stock
4. All in one transaction

---

## Data Integrity Rules

1. **Stock consistency**: Stock.quantity = SUM(Movement.direction * Movement.qty) for each (product_id, warehouse_id)
2. **Non-negative stock**: Stock.quantity >= 0 (enforced by CHECK constraint)
3. **Movement audit**: Every stock change has a corresponding Movement record
4. **Soft deletes**: Products are marked is_active=false instead of being deleted

---

## Query Patterns

### Get current stock for a product in a warehouse
```sql
SELECT quantity FROM stock 
WHERE product_id = ? AND warehouse_id = ?;
```

### Get movement history for a product
```sql
SELECT * FROM movements 
WHERE product_id = ? 
ORDER BY created_at DESC;
```

### Get low stock products
```sql
SELECT s.*, p.name, p.min_stock 
FROM stock s
JOIN products p ON p.id = s.product_id
WHERE s.quantity <= p.min_stock 
  AND p.is_active = TRUE;
```

### Get sales with items
```sql
SELECT s.*, si.product_id, si.qty, si.price
FROM sales s
LEFT JOIN sale_items si ON si.sale_id = s.id
WHERE s.id = ?;
```

---

## Migration Notes

The schema supports both old and new Movement structure during migration:
- Old: `warehouse_from`, `warehouse_to`, `quantity`, `reason`
- New: `warehouse_id`, `direction`, `qty`, `source_type`, `comment`, `related_entity_id`

Application code should be updated to use the new structure gradually.

