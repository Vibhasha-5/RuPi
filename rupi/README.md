# RuPi — AI-Powered Financial Platform

> **Your every rupee counts.**  
> Tax Agent · Investment Agent · Security Agent — all in one platform.


## Prerequisites

Install these before anything else:

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Any | https://git-scm.com |
| Node.js *(optional, for local dev without Docker)* | 18 or later | https://nodejs.org |

Verify Docker is working:

docker --version
docker compose version


## Quick Start with Docker

### Step 1 — Clone the repository
git clone https://github.com/YOUR_USERNAME/rupi.git
cd rupi

### Step 2 — Create your environment file
cp .env.example .env

Open `.env` in any text editor and set at minimum:

```env
JWT_SECRET=replace_with_any_long_random_string_at_least_64_chars
SESSION_SECRET=replace_with_another_long_random_string
```

> **Tip — generate secure secrets instantly:**
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> Run it twice — use the first output for `JWT_SECRET`, the second for `SESSION_SECRET`.

Leave everything else as-is for local development.

### Step 3 — Start all services
docker compose up --build

The first run downloads images and installs dependencies. This takes **2–4 minutes**. Subsequent starts take under 10 seconds.

You will see output ending with:
rupi-mongo  | MongoDB starting...
rupi-app    | ✅ Connected to MongoDB: mongodb://mongo:27017/rupi
rupi-app    | 🚀 RuPi server running on http://localhost:5000

### Step 4 — Open the app

Go to **http://localhost:5000** in your browser.

> ⚠️ Do **not** open `index.html` directly as a file. Always use http://localhost:5000

To stop all services:

docker compose down


Your database is **preserved** in a Docker volume even after stopping. To wipe everything and start completely fresh:
docker compose down -v

## Step-by-Step: Register a User & Verify the DB

Follow these exact steps to confirm data is flowing from the browser into MongoDB.

### Step 1 — Start the stack
docker compose up --build

Wait until you see `RuPi server running on http://localhost:5000`.

### Step 2 — Create an account in the browser

1. Open **http://localhost:5000**
2. Click **Get Started** — you land on the Signup page
3. Fill in: First Name, Last Name, Email, Password (minimum 8 characters)
4. Click **Create Account**
5. You are redirected to the Profile Setup page

### Step 3 — Complete profile setup

Fill in your details and click **Save Profile**. This sets `profileComplete: true` in the DB and redirects you to the Tax Agent dashboard.

### Step 4 — Verify data reached MongoDB

**Option A — Mongo Express browser GUI (easiest):**

Start with the dev profile to include Mongo Express:
docker compose --profile dev up

Open **http://localhost:8081** — login with:
- Username: `admin`
- Password: `rupi2026`

Navigate to: **rupi → users** — you will see your newly created user document with all fields.

**Option B — MongoDB shell inside Docker:**

With the stack already running, open a second terminal:

docker exec -it rupi-mongo mongosh rupi

Then run queries inside the shell:

```js
// Count all registered users
db.users.countDocuments()

// View all users (password hash hidden)
db.users.find({}, { password: 0 }).pretty()

// Find one user by email
db.users.findOne({ email: "your@email.com" }, { password: 0 })

// Exit
exit
```

**Option C — Test the API directly with curl:**

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@rupi.dev","password":"securepass123"}'

A successful response looks like:

```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@rupi.dev",
    "profileComplete": false,
    "authProvider": "email"
  }
}
```

Now confirm it is in the database:

```bash
docker exec -it rupi-mongo mongosh rupi \
  --eval "db.users.findOne({email:'test@rupi.dev'},{password:0})"
```

## Viewing the Database (Mongo Express GUI)

Mongo Express is a browser-based MongoDB admin panel bundled with this project.

Start it alongside the main stack using the `dev` profile:

```bash
docker compose --profile dev up
```

| URL | What you see |
|-----|-------------|
| http://localhost:5000 | RuPi app |
| http://localhost:8081 | Mongo Express (database GUI) |

Credentials for Mongo Express:
- **Username:** `admin`
- **Password:** `rupi2026`

Inside Mongo Express you can view, search, edit, and delete documents directly in the browser. It is the quickest way to confirm that registrations are hitting the database.

> Mongo Express is a development tool only. It does **not** start unless you use `--profile dev`.


## Running Without Docker (Local Dev)

If you prefer running Node.js directly (faster for active development):

### Step 1 — Install MongoDB locally

Download MongoDB Community Edition from https://www.mongodb.com/try/download/community and start it:

# Windows — use MongoDB Compass or run: mongod

### Step 2 — Install Node.js dependencies
npm install

### Step 3 — Configure environment
cp .env.example .env

Edit `.env` and change the MongoDB URI to use localhost:

```env
MONGODB_URI=mongodb://localhost:27017/rupi
```

### Step 4 — Start the server
# Development mode with auto-reload on file changes
npm run dev

# Or production mode
npm start

Server starts at **http://localhost:5000**.

## Environment Variables

All variables live in `.env` (copied from `.env.example`). Never commit `.env` to Git — it is already in `.gitignore`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `MONGODB_URI` | Yes | `mongodb://mongo:27017/rupi` | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing auth tokens. Must be a long random string |
| `SESSION_SECRET` | **Yes** | — | Secret for session cookies |
| `GOOGLE_CLIENT_ID` | No | — | From Google Cloud Console. Required only for Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | — | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | No | `http://localhost:5000/api/auth/google/callback` | OAuth redirect URL |
| `CLIENT_URL` | No | `http://localhost:5000` | Frontend origin for CORS |

### Getting Google OAuth credentials (optional)

1. Go to https://console.cloud.google.com
2. Create or select a project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy the Client ID and Client Secret into your `.env`


## API Reference

All endpoints are relative to `http://localhost:5000`.

### Auth Routes — `/api/auth`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | `{ firstName, lastName, email, password }` | Create a new account. Returns JWT token and user object |
| `POST` | `/api/auth/login` | `{ email, password }` | Sign in. Returns JWT token and user object |
| `GET` | `/api/auth/me` | — *(token required)* | Get the currently authenticated user |
| `GET` | `/api/auth/google` | — | Start Google OAuth sign-in flow |
| `DELETE` | `/api/auth/delete` | — *(token required)* | Permanently delete own account |

### User Routes — `/api/user`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/profile` | Get full user profile *(token required)* |
| `PUT` | `/api/user/profile` | Update profile fields *(token required)* |

### Sending the auth token

Include the token from login or register in the `Authorization` header of every protected request:

```
Authorization: Bearer eyJhbGci...
```

Example with curl:

```bash
TOKEN="your_token_here"

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Sharing the Project (GitHub + Docker)

This section explains what persists across machines and how the team shares a consistent starting state.

### What travels with the code vs what stays local

| Data | Where it lives | Shared via GitHub? |
|------|---------------|-------------------|
| User accounts | MongoDB Docker volume | ❌ No — each machine has its own database |
| App code, routes, styles | Git repository | ✅ Yes |
| Database schema and indexes | `backend/config/mongo-init.js` | ✅ Yes — applied automatically on first start |
| Shared test accounts (seed data) | `backend/config/mongo-init.js` | ✅ Yes — if you add them |

### Adding shared seed data for the whole team

To give every developer the same starting test accounts, add inserts to `backend/config/mongo-init.js`.

First generate a bcrypt hash for your shared test password. Run this once in your terminal:

```bash
node -e "require('bcryptjs').hash('rupi2026dev', 12).then(h => console.log(h))"
```

Copy the output hash, then add this block inside `mongo-init.js`:

```js
// ── Seed: shared demo account ──
// Password for this account is: rupi2026dev
const demoHash = 'PASTE_YOUR_BCRYPT_HASH_HERE';

db.users.insertMany([
  {
    email: 'demo@rupi.dev',
    password: demoHash,
    firstName: 'Demo',
    lastName: 'User',
    authProvider: 'email',
    profileComplete: true,
    incomeRange: '10-15L',
    taxRegime: 'new',
    riskAppetite: 'moderate',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ Seed data inserted');
```

Push to GitHub. Every teammate who clones the repo and runs:

```bash
docker compose up --build
```

...will automatically get the seed data on their first run. They can log in with `demo@rupi.dev` / `rupi2026dev` immediately.

> **Important:** `mongo-init.js` only runs when the MongoDB volume is **empty** — meaning the very first `docker compose up`, or after `docker compose down -v`. It will not re-run on normal restarts.

To force a fresh init and pick up new seed data:

```bash
docker compose down -v   # deletes DB volume
docker compose up --build
```

### The correct Git workflow for the team

```bash
# Clone the repo (first time)
git clone https://github.com/YOUR_USERNAME/rupi.git
cd rupi

# Always create your own .env — never commit it
cp .env.example .env
# Edit .env and add your JWT_SECRET and SESSION_SECRET

# Start everything
docker compose up --build

# Make code changes, then commit and push
git add .
git commit -m "feat: describe your change"
git push origin main
```

### When a teammate pulls your changes

```bash
git pull origin main

# If Dockerfile or package.json changed, rebuild the image:
docker compose up --build

# For code-only changes, a normal restart is enough:
docker compose up
```

---

## Common Errors & Fixes

### `ERR_CONNECTION_REFUSED` when visiting localhost:5000

The containers are not running. Check their status:
docker compose ps

All services should show `running`. If not, start them:
docker compose up --build

### `Cannot connect to the Docker daemon`

Docker Desktop is not open. Launch it from your Applications folder or Start Menu, wait for it to finish starting, then try again.

### `MongoServerError: connect ECONNREFUSED`

The app started before MongoDB was fully ready. Usually the health check handles this automatically. If it persists:
docker compose down && docker compose up

### Auth tokens fail or login redirects loop

Your `.env` is missing `JWT_SECRET`. Open `.env` and add any long random string as the value.

### Page shows blank or 404 after login

You navigated directly to a `file:///` path. Always use **http://localhost:5000**. The Express server serves all HTML pages from that origin.

### Port 5000 or 27017 already in use

# Windows
netstat -ano | findstr :5000
```

To use a different port, edit `docker-compose.yml`:

```yaml
ports:
  - "5001:5000"   # App now accessible at localhost:5001
```

### Mongo Express login fails at localhost:8081

Make sure you started with the dev profile:
docker compose --profile dev up

Default credentials: `admin` / `rupi2026`

### I wiped my data accidentally

You ran `docker compose down -v` which deletes the database volume — this is expected behavior for a clean slate. Re-register at http://localhost:5000 or load seed data as described above.

---

*Built with <3 - Team Rupi*
