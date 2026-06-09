# Mobile Reports API Contract

## Purpose

Reports API for the iOS mobile app.

All tenant report endpoints are scoped by `req.user.store_id`.
The client must not send `store_id` in query params or request body.

## Base URL

Development:
`https://manpower-dish-dupe.ngrok-free.dev/api`

Production:
`https://your-production-domain.com/api`

## Auth

Send a bearer token in every request:

```http
Authorization: Bearer <token>
```

Login example:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@test.local",
  "password": "test123"
}
```

## Roles

Current tenant roles in backend auth:

- `owner`
- `manager`
- `cashier`
- `staff`

Reports access:

- `GET /api/reports/transactions`: `owner`, `manager`
- `GET /api/reports/revenue-daily`: `owner`, `manager`
- `GET /api/reports/filters`: `owner`, `manager`
- `GET /api/reports/sales`: `owner` only, existing web export endpoint

Current MVP rule:

- `cashier` and `staff` receive `403`
- legacy tenant `admin` role is not active in the current auth layer

## Query Params

Supported by `GET /api/reports/transactions`:

- `from`: optional, `YYYY-MM-DD`
- `to`: optional, `YYYY-MM-DD`
- `product_id`: optional integer
- `category`: optional string
- `employee_id`: optional integer
- `operation_type`: optional enum
- `limit`: optional integer, default `100`
- `offset`: optional integer, default `0`

Supported by `GET /api/reports/revenue-daily`:

- `from`
- `to`
- `product_id`
- `category`
- `employee_id`
- `operation_type`

Date defaults:

- if `from` and `to` are omitted: current month through today
- if only `from` is sent: `to = today`
- if only `to` is sent: `from = first day of current month`

Validation:

- invalid dates return `400`
- invalid numeric filters return `400`
- unknown `operation_type` values return `400`

## Operation Types

API-level values for iOS:

- `SALE`
- `RETURN`
- `WRITE_OFF`

Current backend support:

- `SALE`: supported
- `RETURN`: supported
- `WRITE_OFF`: not supported yet for report queries

Current backend mapping:

- `SALE` comes from completed rows in `sales` + `sale_items`
- `RETURN` comes from `movements` rows where `source_type/type = RETURN`
- `WRITE_OFF` is not exposed yet because stock-out/write-off is not stored with a stable report-specific source value

`GET /api/reports/filters` returns:

- `WRITE_OFF` with `"supported": false`

## Endpoints

### `GET /api/reports/transactions`

Detailed report rows for sales and returns.

Example:

```http
GET /api/reports/transactions?from=2026-06-01&to=2026-06-08&category=Food&employee_id=2&operation_type=SALE
```

Response:

```json
{
    "success": true,
    "data": {
        "filters": {
            "from": "2026-06-01",
            "to": "2026-06-08",
            "product_id": null,
            "category": "Food",
            "employee_id": 2,
            "operation_type": "SALE"
        },
        "pagination": {
            "limit": 100,
            "offset": 0,
            "total": 2
        },
        "transactions": [
            {
                "id": 101,
                "date": "2026-06-08T10:35:00.000Z",
                "product_id": 12,
                "product_name": "Milk 1L",
                "category": "Food",
                "quantity": 3,
                "unit_price": 800,
                "total_amount": 2400,
                "employee_id": 1,
                "employee_name": "Test Owner",
                "employee_role": "owner",
                "operation_type": "SALE",
                "source": "sales"
            }
        ]
    },
    "error": null
}
```

Notes:

- `total_amount` for a row is computed from item-level line totals
- sale rows come from `sales` + `sale_items`
- return rows come from `movements`
- no user password fields are returned

### `GET /api/reports/revenue-daily`

Daily revenue breakdown for completed sales.

Example:

```http
GET /api/reports/revenue-daily?from=2026-06-01&to=2026-06-08
```

Response:

```json
{
    "success": true,
    "data": {
        "period": {
            "from": "2026-06-01",
            "to": "2026-06-08"
        },
        "series": [
            {
                "date": "2026-06-05",
                "revenue": 2900,
                "orders_count": 1,
                "items_sold": 4
            }
        ],
        "summary": {
            "total_revenue": 2900,
            "orders_count": 1,
            "items_sold": 4,
            "average_order_value": 2900
        }
    },
    "error": null
}
```

Notes:

- revenue includes completed sales only
- if `operation_type=RETURN` or `WRITE_OFF`, the endpoint currently returns an empty series with zero totals

### `GET /api/reports/filters`

Single request for filter options.

Example:

```http
GET /api/reports/filters
```

Response:

```json
{
    "success": true,
    "data": {
        "products": [
            {
                "id": 1,
                "name": "Milk 1L",
                "sku": "MILK-001",
                "category": "Food"
            }
        ],
        "categories": ["Food", "Drinks"],
        "employees": [
            {
                "id": 1,
                "name": "Test Owner",
                "email": "owner@test.local",
                "role": "owner",
                "is_active": true
            }
        ],
        "operationTypes": [
            {
                "value": "SALE",
                "label": "Sale",
                "supported": true
            },
            {
                "value": "RETURN",
                "label": "Return",
                "supported": true
            },
            {
                "value": "WRITE_OFF",
                "label": "Write-off",
                "supported": false
            }
        ]
    },
    "error": null
}
```

Recommendation for iOS:

- use this endpoint for employees, products, categories, and operation types
- do not use `GET /api/users` for mobile report filters
- do not use `GET /api/products/left` for mobile report filters

### Existing endpoints

`GET /api/reports/sales`

- existing web export endpoint
- requires `from` and `to`
- owner only
- completed sales only

`GET /api/sales/chart`

- existing web/dashboard chart endpoint
- owner only
- current month only
- no report filters
- not recommended for iOS reports

`GET /api/users`

- owner only
- store-scoped
- safe response fields
- not ideal for iOS reports because manager access is blocked and response shape is broader than the report filter use case

`GET /api/products/left`

- authenticated tenant endpoint
- store-scoped
- returns stock quantities and product info
- heavier than needed for mobile report filters

## PDF Export

Current decision:

- PDF export is generated inside iOS from fetched JSON report data
- backend does not provide `/api/reports/export/pdf` yet

Future optional endpoint:

```http
GET /api/reports/export/pdf?from=2026-06-01&to=2026-06-08&operation_type=SALE
```

Expected response:

- `application/pdf`

## Swift Notes

- Dates are ISO strings
- Numbers are JSON numbers
- Nullable fields return `null`
- Use `CodingKeys` for `snake_case` fields
