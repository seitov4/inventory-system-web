# Employees Management

## Employee List

Store owners manage tenant employees from `Settings -> Employees`.

The list is loaded from:

```http
GET /api/users
```

The backend scopes the query to `req.user.store_id` and returns only active tenant employees:

```sql
store_id = req.user.store_id
is_active IS TRUE
role IN ('manager', 'cashier', 'staff')
```

Owners are not shown in the employee table as removable employees.

## Delete Endpoint

Employees are removed with:

```http
DELETE /api/users/:id
```

Auth:

- Tenant JWT is required.
- Current allowed role is `owner`.

The endpoint never accepts `store_id` from the frontend. It uses `req.user.store_id` and verifies the target user belongs to the same store.

## Soft Delete

Employee deletion is a soft delete:

```sql
UPDATE users
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND store_id = $2
  AND role IN ('manager', 'cashier', 'staff')
  AND is_active IS TRUE
```

The row remains in `users`, so historical sales, movements, reports, and cashier references keep their foreign-key integrity.

Success response:

```json
{
  "success": true,
  "data": {
    "id": 12,
    "is_active": false,
    "message": "Employee deleted successfully."
  }
}
```

## Safety Rules

The backend rejects:

- A user from another store: `404 Employee not found.`
- Self-delete: `403`
- Store owner delete: `403 Store owner cannot be deleted.`
- Cashier/staff callers: route role guard denies access.

This endpoint works only with tenant users in `users`; it does not touch platform admins.

## Inactive Employee Login

Tenant login already checks `is_active`. If an employee is soft-deleted, login is rejected with a forbidden response.

## Frontend Flow

On `Settings -> Employees`:

1. Click `Delete`.
2. Confirm modal opens.
3. Click `Delete` in the modal.
4. The button is disabled while the request runs.
5. On success, the modal closes and the employee is removed from the visible list.
6. On error, a safe backend/user-facing message is shown.

## Manual PowerShell Checks

Login:

```powershell
$login = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"owner@test.local","password":"test123"}'

$token = $login.data.token
```

List active employees:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:5000/api/users" `
  -Headers @{ Authorization = "Bearer $token" }
```

Create a temporary employee for testing:

```powershell
$employee = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/users" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"firstName":"Temp","lastName":"Delete","contact":"+77009990001","role":"cashier","password":"TempPass123"}'

$employeeId = $employee.data.id
```

Delete employee:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:5000/api/users/$employeeId" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }
```

Try delete owner:

```powershell
$owner = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/users/$($owner.data.user.id)" `
  -Method DELETE `
  -Headers @{ Authorization = "Bearer $token" }
```

Expected result: `403 Store owner cannot be deleted.`

Check database state:

```sql
SELECT id, email, phone, role, is_active
FROM users
WHERE store_id = (SELECT store_id FROM users WHERE email='owner@test.local')
ORDER BY id;
```
