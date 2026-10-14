# AccessGuard AI — Accessible by Default

> **Automated Barrier Scanner for Public Digital Services**  
> A real-world accessibility engine that audits digital services for critical barriers, provides deterministic WCAG 2.1/2.2 AA guidance, and delivers prioritized, plain-language remediation that non-specialists can act on.

---

## 🏛️ Project Purpose & Problem Statement

Public digital services (government portals, healthcare sites, civic utilities) are essential lifelines for all citizens. However, automated testing is often misunderstood:
- Many tools produce an arbitrary, misleading "compliance percentage score" (e.g. "98% Accessible"), creating false assurance when automated tests can only detect 30–40% of WCAG criteria.
- Many tools flood developers with esoteric accessibility jargon without actionable, plain-language guidance.
- Some tools use ungrounded AI to hallucinate accessibility fixes or fabricate scan results.

**AccessGuard AI adheres to four foundational integrity principles:**
1. **Real Browser Scanning:** Powered by Playwright and axe-core. No synthetic or fake scan results.
2. **Honest Accessibility Metrics:** No fabricated compliance percentages. We present raw violation distribution by severity (*Critical*, *Serious*, *Moderate*, *Minor*), count automated checks passed, and emphasize the necessity of human keyboard/screen reader testing.
3. **Deterministic Distinction:** Built-in guidance is derived directly from WCAG 2.1/2.2 rules and axe-core remediation guides. It is explicitly labeled as **Deterministic Rule-Based Guidance**, never passed off as "AI".
4. **Backend-Only AI Augmentation:** When valid AI API credentials (`AI_API_KEY`) are configured, the backend can produce plain-language translations and reviewed code diffs. Keys are never exposed to the frontend.

---

## 🔒 Security Architecture

### 1. Authentication & Session Strategy
- **Password Hashing:** Passwords hashed using `bcrypt` with 12 salt rounds. No plain-text passwords stored.
- **Session Management:** Cryptographically signed JSON Web Tokens (JWT).
- **Transport Security:** Tokens are delivered in `HttpOnly`, `SameSite=Lax` (or `Strict` in production), `Secure` (in production) cookies, mitigating XSS token theft. Also supports `Authorization: Bearer <token>` for API clients.
- **Input Validation:** Strict sanitization, length boundaries (max 128 characters for passwords to prevent bcrypt DoS), and email format validation.

### 2. SSRF Protection Plan (Server-Side Request Forgery)
Because the scanner navigates to user-specified public URLs, defense-in-depth against SSRF is critical:
- **Protocol Whitelist:** Strictly `http:` and `https:`. Blocks `file:`, `ftp:`, `data:`, `gopher:`, `javascript:`.
- **Hostname Filter:** Denies `localhost`, `*.local`, `metadata.google.internal`, etc.
- **Pre-Flight DNS Resolution:** Resolves target hostname via DNS before initiating connection.
- **IP Range Filtering:** Uses CIDR inspection (`ipaddr.js`) to block:
  - Loopback (`127.0.0.0/8`, `::1`)
  - RFC 1918 Private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - Link-Local & Cloud Metadata (`169.254.0.0/16`, `fe80::/10`)
  - Carrier-grade NAT (`100.64.0.0/10`)
  - Broadcast / Multicast / Reserved (`0.0.0.0/8`, `224.0.0.0/4`, `240.0.0.0/4`)
- **In-Scan Browser Interception (Phase 2):** Playwright route handler (`page.route('**/*', ...)`) intercepts all redirects and dynamic network requests to block open redirect SSRF bypasses.

---

## 📂 Project Structure

```
AccessGuard-AI/
├── package.json               # Root scripts (run client and server concurrently)
├── README.md                  # Project documentation and specifications
│
├── server/                    # Node.js + Express Backend
│   ├── package.json
│   ├── .env.example           # Environment template
│   ├── .env                   # Local configuration
│   ├── src/
│   │   ├── config.js          # Central configuration & secret management
│   │   ├── app.js             # Express app (middleware, CORS, routes)
│   │   ├── index.js           # Server entry point
│   │   ├── db/
│   │   │   ├── database.js    # SQLite connection layer (native node:sqlite)
│   │   │   └── schema.sql     # Database schema (users, scans, scan_violations)
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT verification & HttpOnly cookie handler
│   │   ├── routes/
│   │   │   ├── healthRoutes.js # /api/health endpoint
│   │   │   └── authRoutes.js   # /api/auth/register, /login, /me, /logout
│   │   └── services/
│   │       └── ssrfValidator.js # SSRF DNS pre-resolution & IP blocklist
│   └── tests/                 # Automated test suite (native node:test)
│       ├── health.test.js
│       ├── database.test.js
│       ├── auth.test.js
│       └── ssrfValidator.test.js
│
└── client/                    # React + Vite Frontend
    ├── package.json
    ├── vite.config.js         # Vite configuration with /api proxy
    ├── tailwind.config.js     # Dark navy & vibrant teal design tokens
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── styles/index.css   # Accessible Tailwind base & focus outlines
        ├── App.jsx            # Phase 1 verification view & design system
        └── main.jsx           # Client entrypoint
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js >= 20 (Tested with Node.js v24.20.0)
- npm >= 10 (Tested with npm v11.19.0)

### 1. Setting Up and Running the Backend Server
```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Install Playwright browser binaries
npx playwright install chromium

# Start server in development mode
npm run dev

# Or start in standard production mode
npm start
```
The backend starts on `http://localhost:5000`.  
- Health check: `http://localhost:5000/api/health`
- Initiate Scan: `POST http://localhost:5000/api/scans` (Requires JWT auth)
- Scan History: `GET http://localhost:5000/api/scans` (Requires JWT auth)
- Scan Details: `GET http://localhost:5000/api/scans/:id` (Requires JWT auth)

### 2. Running Automated Tests
```bash
# Run complete test suite (includes authentication, database, SSRF, and real Playwright accessibility tests)
cd server
npm test
```

### 3. Running the Frontend Client
```bash
# In a separate terminal, navigate to client directory
cd client

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## 🧭 Project Roadmap & Phase Status

- [x] **Phase 1 (Complete): Foundations & Authentication**
  - Project scaffolding, workspace configuration, and README.
  - Express API server with `/api/health` monitoring.
  - SQLite database layer using embedded `node:sqlite` with schema for users, scans, and violations.
  - Secure authentication (bcrypt hashing with 12 salt rounds, JWT, HttpOnly cookies, `/register`, `/login`, `/logout`, `/me`).
  - SSRF protection architecture with pre-flight DNS resolution and private CIDR blocklist.
  - React + Vite client scaffolding with Dark Navy & Teal design system.

- [x] **Phase 2 (Complete): Real Accessibility Scanning Engine**
  - Headless Playwright integration with `@axe-core/playwright`.
  - Authenticated `POST /api/scans` accepting website URLs and executing real browser audits.
  - Extraction of genuine axe-core violations: rule ID, impact, description, help URL, WCAG tags, affected element selectors, HTML snippets, and failure summaries.
  - Deterministic WCAG guidance engine labeling built-in guidance strictly as deterministic rule-based advice (never fabricated as AI).
  - Clear automated testing disclaimers: explains automated testing limitations (~30-40% of WCAG criteria) without misleading percentage scores.
  - Defense-in-depth SSRF protection: DNS pre-flight verification, and in-flight Playwright route interception (`context.route`) blocking loopback, private ranges, link-local, and cloud metadata across initial requests, subresources, and redirects.
  - Per-user scan ownership and concurrency limits.
  - Complete automated test suite using controlled local test fixtures (34 tests passing).

- [x] **Phase 3 / Frontend Experience (Complete): Dark Navy & Teal Client UI**
  - Responsive, accessible Sign In (`/login`) and Register (`/register`) pages with real-time password criteria verification.
  - Real authentication integration with HttpOnly cookie handling (`credentials: 'include'`) and `AuthContext`.
  - Protected Dashboard layout (`/dashboard`) with sidebar navigation and genuine compliance metrics calculated strictly from real scan data.
  - Interactive Scan Launcher (`/scans/new`) with URL validation, live multi-step audit progress timer, and clear error alerts for unreachable or SSRF-blocked sites.
  - Detailed Audit Inspector (`/scans/:id`) with severity filtering (Critical, Serious, Moderate, Minor), selector/HTML evidence cards, and deterministic guidance.
  - Searchable Audit History (`/history`) with live status badges and inspect links.
  - Configurable API URL via `VITE_API_URL` without exposing backend secrets.
  - Vitest + Testing Library test suite (7 tests passing) and production build verified.

- [ ] **Phase 4 (Upcoming): AI Remediation Integration**
  - Backend-only AI adapter to provide plain-language explanations and reviewed code diffs when `AI_API_KEY` is present.
  - Authentic AI integration with deterministic fallback when credentials are not configured.

- [ ] **Phase 5 (Upcoming): Audit Reports & Export**
  - Exportable audit reports (JSON / HTML summary), scan history exports, and end-to-end verification.
