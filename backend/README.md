# SyncLife Backend

## Setup
```bash
npm install
npm run dev       # Development with hot reload
npm run build     # Compile TypeScript
npm run start     # Run compiled output
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | Port the server listens on (default: 3001) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/health` | Health check |
| POST   | `/api/sheets/create` | Create user spreadsheet |
| GET    | `/api/sheets/rows/:sheet` | Fetch rows from a sheet |
| POST   | `/api/logs/meal` | Append meal log |
| POST   | `/api/logs/workout` | Append workout log |
| POST   | `/api/logs/water` | Append water log |
| POST   | `/api/logs/transaction` | Append finance transaction |
| POST   | `/api/logs/gold` | Append gold entry |
| POST   | `/api/logs/summary` | Write daily summary |
| POST   | `/api/goals` | Write user goals |
| GET    | `/api/queue/size` | Get pending queue count |
| POST   | `/api/queue/flush` | Flush offline write queue |

## Auth

Every request (except `/api/health`) requires:
```
Authorization: Bearer <google-oauth-access-token>
```

The access token is obtained by the mobile app via Google OAuth (expo-auth-session).
The backend uses it to call Google Sheets API on behalf of the user.
