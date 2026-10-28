# Engineering Standards & Architecture Conventions
## Project: Predictive Distribution System

### 1. Monorepo / Directory Structure
To keep the codebase maintainable, modular, and easy to deploy via single or multiple containers, we follow a clean workspace layout:

```
predictive-distribution-system/
├── apps/
│   ├── web/                     # Next.js 15 Web Application (UI, Landing, Dashboard)
│   │   ├── app/                 # App Router (pages & server components)
│   │   ├── components/          # Reusable UI components (Shadcn-based)
│   │   └── lib/                 # Frontend helpers & API clients
│   │
│   └── api/                     # Fastify API Server & Background Workers
│       ├── src/
│       │   ├── routes/          # REST endpoints (auth, inboxes, campaigns, leads)
│       │   ├── workers/         # BullMQ queue processors (dispatch, warmup, imap)
│       │   ├── services/        # Business logic (spintax, crypto, DNS, AI BYOK)
│       │   └── index.ts         # Fastify server entrypoint
│
├── packages/
│   ├── db/                      # Drizzle ORM Schema, migrations, database client
│   │   ├── src/schema/          # Strongly-typed table definitions
│   │   └── drizzle.config.ts
│   │
│   ├── core/                    # Shared types, validation schemas (Zod), spintax parser
│   │   └── src/
│   │
│   └── tsconfig/                # Shared TypeScript base configs
│
├── deploy/                      # Production deployment configurations
│   ├── docker-compose.prod.yml  # Multi-service container orchestration
│   ├── Caddyfile                # Caddy reverse proxy config with auto-SSL & CTD
│   └── .env.example             # Documented environment template
│
└── docs/                        # Architecture & specification documentation
    ├── SPECIFICATION.md
    ├── AI_AGENT_ARCHITECTURE.md
    ├── HLD.md
    └── CODING_STANDARDS.md
```

---

### 2. TypeScript & Coding Principles
* **Strict Type Safety**: All packages enforce `strict: true` in `tsconfig.json`. Explicit `any` is forbidden.
* **Schema Validation at Boundaries**: Every network payload (HTTP input, Webhooks, BullMQ job data) must be validated with **Zod** before processing.
* **Fail Fast & Explicit Errors**: Custom typed error classes (`AppError`, `UnauthorizedError`, `RateLimitError`) with standardized JSON responses:
  ```json
  {
    "success": false,
    "error": {
      "code": "INBOX_DNS_UNVERIFIED",
      "message": "SPF or DMARC record verification failed for domain client-dev.agency",
      "details": { "missing": ["DMARC"] }
    }
  }
  ```
* **Pure Logic Separation**: Pure business algorithms (e.g., Spintax parser, Jitter calculator, DNS verification, prompt builders) must be pure functions isolated from database or I/O side effects, enabling 100% unit test coverage.

---

### 3. Database & Multi-Tenancy Rules
* **Workspace Scoping**: Every table representing user data must include `workspace_id: uuid`.
* **Zero Plaintext Secrets**: Passwords, IMAP credentials, and BYOK API keys must pass through `encryptSecret()` before inserting and `decryptSecret()` upon job pickup.
* **Soft Deletes**: Campaigns and leads use `deleted_at: timestamp` to prevent accidental cascades while preserving audit trails.

---

### 4. Testing & Quality Gates
* **Unit Testing (Vitest)**:
  - Spintax recursion and permutation validity.
  - Jitter range calculations and scheduling window math.
  - Email header parsing (In-Reply-To, Message-ID).
* **Integration Testing**:
  - Mock SMTP/IMAP servers (e.g., MailHog / GreenMail) to verify the full dispatch and reply detection loop without touching real mail servers.
* **Linting & Formatting**:
  - ESLint with TypeScript rules + Prettier for deterministic formatting.
