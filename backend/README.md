# MediDesk .NET Backend

The backend uses a layered .NET 8 architecture:

```text
MediDesk.Api       HTTP, JWT, Swagger, CORS and dependency registration
MediDesk.Business  Authentication and navigation business rules
MediDesk.Data      Parameterized ADO.NET SQL Server repositories
MediDesk.Common    API contracts, models and configuration options
database           Idempotent SQL schema and permission seed
```

## Local setup

1. Install .NET 8 SDK and SQL Server 2022 or Azure SQL.
2. Create an empty `MediDesk` database.
3. Execute `database/001_initial_schema.sql` against that database.
4. Copy `src/MediDesk.Api/appsettings.Development.json.example` to `appsettings.Development.json`.
5. Replace the SQL password, JWT signing key and bootstrap administrator password.
6. Run the API:

```bash
dotnet restore MediDesk.sln
dotnet build MediDesk.sln --configuration Release
dotnet run --project src/MediDesk.Api
```

Swagger is available at `http://localhost:5182/swagger` in Development. The health endpoint is `GET /api/health`.

## Configuration through environment variables

For production, use secret storage or environment variables rather than JSON secrets:

```text
ConnectionStrings__MediDesk
Jwt__Issuer
Jwt__Audience
Jwt__SigningKey
Jwt__ExpiryMinutes
BootstrapAdmin__FullName
BootstrapAdmin__Email
BootstrapAdmin__Password
Cors__AllowedOrigins__0
```

The bootstrap credentials only create the first administrator when that email does not exist. Remove the bootstrap password from the runtime environment after initial provisioning.

## Authentication flow

- `POST /api/auth/signup` creates a user with the safe default `Billing Operator` role.
- `POST /api/auth/login` verifies the ASP.NET password hash and returns a signed JWT.
- Both responses contain the user and database-generated navigation permissions.
- `GET /api/navigation/me` refreshes the authenticated user's menu.
- The React app sends the JWT as a Bearer token and only renders modules with `View` permission.

## Dynamic modules

### Step 1 — Medicines

- `GET /api/medicines` supports server-side search, status, sorting and pagination.
- `GET /api/medicines/{id}` returns one active medicine.
- `POST /api/medicines` creates a medicine.
- `PUT /api/medicines/{id}` updates with row-version concurrency protection.
- `DELETE /api/medicines/{id}` performs an audited soft delete.
- Every endpoint checks the current user's database permission for View, Add, Edit or Delete.

### Step 2 — Inventory

- `GET /api/inventory/movements` returns the latest immutable stock ledger entries.
- `POST /api/inventory/adjustments` performs Add, Remove or Opening Correction operations.
- Medicine stock update and movement creation run inside one serializable SQL transaction.
- Negative stock, invalid adjustment types and no-change corrections are rejected.
- Opening stock creates its first ledger entry when a medicine is created.
- Inventory View/Edit permissions are checked against the database for every request.

### Step 3 — Medicine Masters

- `GET /api/medicine-masters?type=Category|Manufacturer|Generic` lists active and inactive master records with medicine usage counts.
- `POST /api/medicine-masters` creates a category, manufacturer or generic/salt master.
- `PUT /api/medicine-masters/{id}` updates a master with row-version concurrency protection.
- `DELETE /api/medicine-masters/{id}` performs an audited soft delete.
- Duplicate names are rejected within each master type.
- Masters already used by medicines cannot be renamed or deleted, preserving medicine history.
- The medicine form loads its category, manufacturer and generic dropdowns from these API records.
- Every endpoint checks the current user's database permission for View, Add, Edit or Delete.

### Step 4 — Suppliers

- `GET /api/suppliers` supports search, active/inactive status and pagination.
- `GET /api/suppliers/{id}` returns one supplier that has not been deleted.
- `POST /api/suppliers` creates identity, contact, GST, drug-licence, address and opening-balance details.
- `PUT /api/suppliers/{id}` updates supplier details with row-version concurrency protection.
- `DELETE /api/suppliers/{id}` sets `IsDeleted=1` and `IsActive=0`; no supplier row is physically deleted.
- All list and detail queries filter on `IsDeleted=0`, so soft-deleted suppliers remain auditable but are hidden from the UI.
- Duplicate active business names and GSTIN values are rejected.
- Every endpoint checks the current user's database permission for View, Add, Edit or Delete.

### Step 5 — Purchases

- `GET /api/purchases` supports supplier/invoice search, payment-status filtering and pagination.
- `GET /api/purchases/{id}` returns the purchase header and immutable batch-wise line snapshots.
- `POST /api/purchases` validates the supplier and medicines, calculates line GST/totals server-side and receives the purchase.
- Purchase creation, medicine stock increases, inventory-ledger entries and supplier outstanding updates use one serializable SQL transaction.
- Duplicate medicine batches and duplicate supplier invoice numbers are rejected.
- `DELETE /api/purchases/{id}` is a controlled cancellation: it reverses stock and supplier outstanding, then sets `IsDeleted=1` and `Status='Cancelled'`.
- Cancellation is rejected when received stock has already been consumed or the supplier balance cannot be reversed safely.
- Cancelled purchases remain in the database for audit but are excluded from API lists and the UI.
- Purchase View/Add/Delete permissions are checked against the database for every request.
