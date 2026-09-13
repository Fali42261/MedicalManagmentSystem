# MediDesk Pharmacy ERP UI

Production-structured React and Vite frontend for medical-store inventory, purchases, sales, billing, suppliers, customers, accounts, GST, reports and administration.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment configuration

All browser environment variables use the `VITE_` prefix. Development data comes from [DummyJSON](https://dummyjson.com/) and can later be replaced by the .NET API without changing UI components.

```env
VITE_API_BASE_URL=https://dummyjson.com
VITE_API_TIMEOUT_MS=12000
VITE_API_RETRY_COUNT=1
VITE_APP_NAME=MediDesk
VITE_APP_ENV=development
```

Never commit `.env`. Add new keys to `.env.example` with safe placeholder values.

## Source structure

```text
src/
  components/   Reusable UI and API-state components
  config/       Validated environment configuration
  constants/    API endpoints, HTTP methods and static keys
  context/      Shared API-backed application state
  hooks/        Reusable React hooks
  services/     Generic HTTP client and business API methods
  utils/        API response-to-UI model mappers
  App.jsx       Application shell and routing
  pages.jsx     Feature screens
```

## Data flow

Screens consume `usePharmacyData`. The provider calls `pharmacy.api.js`, which uses the generic client and endpoint constants. Loading, retry and error states are handled centrally.

CRUD business methods are available for medicine, partner and transaction operations. DummyJSON simulates writes but does not persist them; the service interface can be pointed to the future .NET backend.

## Quality checks

```bash
npm run lint
npm run build
```
