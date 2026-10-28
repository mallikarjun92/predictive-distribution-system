# System Requirements & Specification Document (SRS)
## Project: Predictive & Profitable Distribution System (v1 Cold Email Engine)

### 1. Executive Summary & Objective
The Predictive Distribution System is a dual-use (dogfooding for an internal software services agency + multi-tenant SaaS) client acquisition platform. In v1, it focuses on high-deliverability, AI-augmented cold email distribution at near-zero marginal operational cost.

---

### 2. Constraints & Budgetary Baseline
* **Hosting Budget**: $20.00 – $25.00 USD / month.
  - Compute: 1x VPS (Hetzner CPX21 / DigitalOcean 4GB RAM, 3-4 vCPU) (~$8 – $14/mo).
  - Ancillary: Domain routing, SSL certs, DNS verification via Cloudflare (Free Tier).
* **LLM Cost Strategy**: 100% Bring-Your-Own-Key (BYOK). The platform never absorbs generative AI token expenses.
* **Architecture Strategy**: Single-tenant internal deployment dogfooding first, abstracted with strict multi-tenant workspace isolation (`workspace_id` tenant scoping) ready for SaaS monetization.

---

### 3. Functional Requirements & Feature Modules

#### Module 1: Inboxes & Sender Reputation Management
* Connect unlimited SMTP/IMAP inboxes (Google Workspace, Microsoft 365, Zoho, custom private SMTP).
* Automated DNS Health Check: Real-time verification of SPF, DKIM, DMARC, and MX records.
* Custom Tracking Domain (CTD): CNAME masking for tracking pixels and click redirects (preventing shared domain reputation degradation).
* Sending Limits & Jitter: Configurable maximum emails/day per inbox (e.g., 30–50 max) with randomized delays (e.g., 180s–420s intervals) and active sending windows (e.g., Mon–Fri, 9:00 AM – 5:00 PM in recipient's timezone).

#### Module 2: Campaign & Sequence Builder
* Multi-step cadence (Step 1 -> Wait $N$ days -> Step 2 -> Follow-up).
* Multi-Inbox Sender Pools: Campaigns round-robin dynamically across $M$ connected accounts to distribute email volume.
* Native Spintax Engine: `{Hi|Hello|Hey} {{firstName}}, {noticed|saw} your work at {{company}}`.
* Lead State Machine: Tracks lead stages: `UNCONTACTED`, `IN_SEQUENCE`, `REPLIED`, `BOUNCED`, `UNSUBSCRIBED`, `CONVERTED`.
* Automated Reply & Unsubscribe Detection: Real-time IMAP listener/webhook stops sequences immediately upon receiving a reply or opt-out keyword.

#### Module 3: AI-Powered Enrichment & Personalization (Configurable)
* **Tier 0 (Disabled/Manual)**: Standard template variables + native Spintax. Zero AI cost.
* **Tier 1 (Copilot / Human-in-the-Loop)**: AI proposes personalized opening hooks or custom pitch lines based on lead company bio and tech stack; human approves/edits in batch before queue dispatch.
* **Tier 2 (Autonomous with Guardrails)**: AI generates contextual subject lines and email bodies dynamically on queue insertion within strict validation bounds (length, tone, hallucination checks).

#### Module 4: Multi-Tenant SaaS & Key Management
* Workspace isolation with Role-Based Access Control (RBAC: `OWNER`, `ADMIN`, `MEMBER`).
* Secure Vault: AES-256-GCM encryption for stored user BYOK secrets (OpenAI, Anthropic, DeepSeek, Groq, Apify, Google Maps) and SMTP/IMAP passwords.
* Rate Limiting: Per-workspace rate limits to prevent single-tenant queue starvation on shared BullMQ instances.

#### Module 5: Configurable Lead Scraper & Waterfall Enrichment
* **Pluggable Provider Architecture**:
  - **Google Maps / Places API**: Query local and regional businesses by keyword and location (e.g. `"Software development in Austin, TX"`, `"E-commerce brands in London"`). Returns company name, address, phone, website URL, and Google reviews.
  - **Apify Integration**: Run customized Apify actors (Google Maps Scraper, LinkedIn Company Scraper, Clutch.co directories) using user-configured BYOK Apify tokens.
  - **Built-in Headless Website Scraper**: Lightweight Cheerio / Playwright crawler that visits discovered company websites, automatically extracting emails from `/contact`, `/about`, `/team`, privacy policies, and footer mailto links at zero extra API cost.
* **De-duplication & Hygiene Engine**:
  - Automatically deduplicates leads by root domain (`acme.com`) and email address within a workspace.
  - Excludes role-based generic emails (e.g. `no-reply@`, `abuse@`) or flags them for review.
* **Direct Pipeline Ingestion**:
  - Scraped records are automatically tagged with source (`google_maps`, `apify`, `csv_import`), location, and metadata, then piped directly into campaigns or contact lists.

---

### 4. Acceptance Criteria (Given-When-Then Format)

#### AC-01: Inbox Setup & DNS Verification
* **Given** an authenticated user adding a new custom sending inbox,
* **When** they submit SMTP/IMAP host, port, credentials, and from-address,
* **Then** the system must execute an active SMTP authentication probe, check DNS records (MX, SPF, DKIM, DMARC), and block campaign sending if DMARC or SPF are invalid.

#### AC-02: Round-Robin Pool Dispatch with Jitter
* **Given** a campaign with 500 leads assigned to a pool of 5 inboxes (limit: 40 emails/day each),
* **When** the scheduled sending window opens,
* **Then** the dispatcher must distribute emails sequentially across the 5 inboxes, enforce randomized delays between 180s and 360s, and halt an inbox once its daily limit (40) is reached without dropping leads.

#### AC-03: Real-Time Stop-on-Reply Detection
* **Given** a lead currently in Step 1 of a 4-step sequence,
* **When** an incoming email from the lead is detected via IMAP synchronization,
* **Then** the lead state must immediately transition to `REPLIED`, all queued follow-up steps for this lead must be canceled within 10 seconds, and an alert must be logged.

#### AC-04: Configurable AI Personalization & BYOK
* **Given** an agency campaign configured with AI Personalization turned ON (Tier 1 - Copilot),
* **When** leads are imported with company website and job title,
* **Then** the worker must call the user's configured BYOK provider (e.g., DeepSeek / OpenAI), generate an enrichment hook, and present a batch review table where emails remain in `PENDING_REVIEW` until approved.

#### AC-05: Tenant Isolation & Credential Security
* **Given** two distinct tenants ($A$ and $B$) on the platform,
* **When** Tenant $A$ queries inboxes, campaigns, or leads,
* **Then** the database layer must enforce strict workspace isolation (zero cross-tenant visibility), and all stored API keys must be unreadable in plaintext in raw database dumps.

#### AC-06: Configurable Lead Scraper Execution & Ingestion
* **Given** an authenticated user setting up a scraping task with query `"Dental clinics in Austin, TX"` selecting the Google Maps provider,
* **When** the scrape job is triggered,
* **Then** the background worker must retrieve the places list, execute the website crawler to extract public business emails from each company's website, deduplicate against existing leads in the workspace, and deliver verified leads into the target campaign list with source metadata.
