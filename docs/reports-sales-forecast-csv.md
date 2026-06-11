# Sales Forecast CSV Export

## Endpoint

```http
GET /api/reports/sales-forecast-csv
```

Authentication is required. Tenant roles `owner`, `manager`, and `admin` are
allowed by the route; `cashier` and `staff` are forbidden.

The backend always uses `req.user.store_id` from the authenticated tenant user.
`store_id` from query params, request body, or headers is ignored and is not used
for export scoping.

## Query Params

- `from`: optional date in `YYYY-MM-DD`.
- `to`: optional date in `YYYY-MM-DD`.
- `format`: optional, one of `realistic`, `simple`, `extended`.

Date defaults:

- No `from` and no `to`: current month through today.
- Only `from`: `to` defaults to today.
- Only `to`: `from` defaults to the first day of the current month.

## Default Format

The default format is `realistic`, matching the forecasting sample:

```csv
date,store_id,sales,quantity_sold,profit,customer_traffic,has_promotion,is_holiday
2026-06-01,default-store,102615.23,24,25487.22,261,0,0
```

## Formats

Simple:

```csv
date,sales,store_id
2026-06-01,102615.23,default-store
```

Realistic:

```csv
date,store_id,sales,quantity_sold,profit,customer_traffic,has_promotion,is_holiday
2026-06-01,default-store,102615.23,24,25487.22,261,0,0
```

Extended:

```csv
date,store_id,sales,revenue,total,has_promotion,quantity_sold,profit,customer_traffic,is_holiday
2026-06-01,default-store,102615.23,102615.23,102615.23,0,24,25487.22,261,0
```

## Field Meanings

- `date`: sales date, `YYYY-MM-DD`.
- `store_id`: export-safe store identifier. Uses `stores.slug` when available,
  otherwise `store_` plus a zero-padded store id.
- `sales`: completed daily sales revenue from `sales.total_amount`.
- `revenue`: same as `sales`, extended format only.
- `total`: same as `sales`, extended format only.
- `quantity_sold`: sum of `sale_items.qty`.
- `profit`: uses product `purchase_price` when available. If purchase price is
  missing, the row uses an estimated profit of 25% of item revenue.
- `customer_traffic`: estimated as `GREATEST(orders_count * 5, quantity_sold * 3)`
  because no dedicated traffic table is present.
- `has_promotion`: currently `0`; no promotion calendar is present.
- `is_holiday`: currently `0`; no holiday calendar is present.

## Missing Dates

The export uses a continuous daily time series with PostgreSQL `generate_series`.
If there are no completed sales for a date, the CSV still includes a row with:

```csv
sales=0, quantity_sold=0, profit=0, customer_traffic=0, has_promotion=0, is_holiday=0
```

## Security

The CSV contains only forecasting fields. It does not export emails, phone numbers,
password hashes, JWTs, platform admin data, private customer data, raw internal
user fields, or data from other stores.

## Frontend Download

The Reports page Sales Report card includes a `Forecast CSV` button. The frontend
uses the existing API client and JWT interceptor, requests the file as a blob, reads
the filename from `Content-Disposition` when available, and triggers a browser
download. CSV content is not displayed in the UI.

## PowerShell Test

```powershell
$login = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"owner@test.local","password":"test123"}'

$token = $login.data.token

Invoke-WebRequest `
  -Uri "http://localhost:5000/api/reports/sales-forecast-csv?from=2026-06-01&to=2026-06-30" `
  -Headers @{ Authorization = "Bearer $token" } `
  -OutFile ".\sales_forecast_realistic_export.csv"

Get-Content .\sales_forecast_realistic_export.csv -TotalCount 5
```
