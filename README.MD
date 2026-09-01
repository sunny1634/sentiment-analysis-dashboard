# Real-Time Sentiment Analysis Dashboard

A real-time sentiment analysis dashboard with a Node.js authentication layer and JWT-based sessions.

## Authentication

The `feature/jwt-auth` branch adds:

- Email/password registration and login.
- Password hashing with `bcryptjs` (12 salt rounds).
- Short-lived 15-minute JWT access tokens.
- 7-day JWT refresh tokens.
- Both tokens stored in `HttpOnly`, `SameSite=Lax` cookies; `Secure` is enabled in production.
- JWT issuer/audience validation and token-type checks.
- Rate limiting on login and registration.
- Helmet security headers.
- Protected dashboard assets and `/api/sentiment`.
- Logout that clears both auth cookies.

### Request flow

```text
Browser
  │
  ├─ POST /api/auth/register or /api/auth/login
  │       └─ bcrypt verifies password
  │       └─ server signs access + refresh JWTs
  │       └─ HttpOnly cookies returned
  │
  ├─ GET /
  │       └─ access JWT verified by middleware
  │
  ├─ GET /api/auth/me
  │       └─ confirms current user
  │
  └─ GET /api/sentiment
          └─ access JWT verified
          └─ server returns sentiment_data.json
```

The browser never stores the JWT in `localStorage` or `sessionStorage`. JavaScript sends requests with normal same-origin credentials, while the browser manages the HttpOnly cookies.

### Token lifecycle

1. Login/register creates an access token (15 minutes) and refresh token (7 days).
2. Protected requests use the access-token cookie.
3. When the access token expires, the client can call `POST /api/auth/refresh`; the server verifies the refresh token and rotates both cookies.
4. Logout clears both cookies.

### Production secrets

Copy `.env.example` to `.env` and generate strong, different random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`. Never commit `.env` or real credentials.

## Run locally

```bash
npm install
# Set JWT_SECRET and JWT_REFRESH_SECRET in .env
npm start
```

Then open `http://localhost:3000/login.html` and create an account.

## Important deployment note

The current sentiment data is still sample/local data. Twitter/Reddit credentials should be kept on a server-side integration, never embedded in browser JavaScript. The JWT layer now provides the protected backend boundary needed for that integration.

## Existing dashboard features

- Real-time simulated sentiment monitoring
- TextBlob, VADER, and BERT model selection UI
- Interactive Chart.js visualizations
- Sentiment filtering and confidence thresholds
- JSON export
- Responsive dashboard

## License

MIT License. See `LICENCE.txt`.
