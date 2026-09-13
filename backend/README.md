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
