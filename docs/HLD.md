# High-Level Design (HLD) Document
## Project: Predictive Distribution System (v1 Cold Email Engine)

### 1. System Architecture Overview

The system is decoupled into four operational layers running within a cohesive Docker Compose topology optimized for a single low-cost VPS ($10–$15/month):

```mermaid
graph TB
    subgraph Gateway["Reverse Proxy & Edge"]
        Caddy["Caddy Server (Auto Let's Encrypt SSL, CNAME CTD Routing)"]
    end

    subgraph AppServer["Application Layer"]
        WebUI["Next.js 15 SSR / App Router (Dashboard & Admin)"]
        APIServer["Fastify API Server (Node.js TypeScript, Port 4000)"]
    end

    subgraph AsyncCore["Asynchronous Worker Layer (BullMQ)"]
        DispatchWorker["Dispatcher Worker (Jitter, Scheduler, Rotation)"]
        WarmupWorker["Warmup & Health Worker (P2P Email Warmup)"]
        IMAPSyncWorker["IMAP Listener (Stop-on-Reply & Bounce Ingestion)"]
        AIPersonalizer["AI Enrichment Worker (BYOK LiteLLM)"]
        ScraperWorker["Lead Scraper Worker (Google Maps, Apify, Cheerio Crawler)"]
    end

    subgraph Persistence["Storage & State Layer"]
        PG[("PostgreSQL 16 (Relational & Workspace Schemas)")]
        Valkey[("Valkey 7 / Redis (Queue, Locks, Jitter State)")]
    end

    Caddy -->|/api/*| APIServer
    Caddy -->|/*| WebUI
    APIServer --> PG
    APIServer --> Valkey
    Valkey --> DispatchWorker
    Valkey --> WarmupWorker
    Valkey --> IMAPSyncWorker
    Valkey --> AIPersonalizer
    Valkey --> ScraperWorker
    DispatchWorker --> PG
    IMAPSyncWorker --> PG
    AIPersonalizer --> PG
    ScraperWorker --> PG
```

---

### 2. Relational Data Model (PostgreSQL 16)

```mermaid
erDiagram
    WORKSPACE ||--o{ USER : contains
    WORKSPACE ||--o{ INBOX : owns
    WORKSPACE ||--o{ CAMPAIGN : organizes
    WORKSPACE ||--o{ LEAD : maintains
    WORKSPACE ||--o{ SCRAPE_JOB : initiates
    CAMPAIGN ||--o{ SEQUENCE_STEP : defines
    CAMPAIGN ||--o{ CAMPAIGN_INBOX_POOL : assigns
    CAMPAIGN ||--o{ LEAD_CAMPAIGN : enrolls
    LEAD_CAMPAIGN ||--o{ EMAIL_LOG : produces
    SCRAPE_JOB ||--o{ LEAD : produces

    SCRAPE_JOB {
        uuid id PK
        uuid workspace_id FK
        string provider "GOOGLE_MAPS | APIFY | CUSTOM_CRAWLER"
        string query
        string location
        string status "QUEUED | PROCESSING | COMPLETED | FAILED"
        int total_found
        int emails_extracted
        jsonb config
        timestamp created_at
    }

    WORKSPACE {
        uuid id PK
        string name
        string slug
        jsonb byok_keys_encrypted
        jsonb settings
        timestamp created_at
    }

    INBOX {
        uuid id PK
        uuid workspace_id FK
        string email_address
        string display_name
        string smtp_host
        int smtp_port
        string smtp_user
        string smtp_pass_encrypted
        string imap_host
        int imap_port
        int daily_limit
        int sent_today
        boolean is_active
        boolean warmup_enabled
        jsonb dns_status
    }

    CAMPAIGN {
        uuid id PK
        uuid workspace_id FK
        string name
        string status "DRAFT | ACTIVE | PAUSED | COMPLETED"
        int autonomy_tier "0 = Spintax, 1 = Copilot, 2 = Autonomous"
        jsonb sending_window "days, start_time, end_time, timezone"
        int min_delay_seconds
        int max_delay_seconds
    }

    SEQUENCE_STEP {
        uuid id PK
        uuid campaign_id FK
        int step_number
        int delay_days
        string subject_template
        text body_template
    }

    LEAD {
        uuid id PK
        uuid workspace_id FK
        string email
        string first_name
        string last_name
        string company
        string website
        jsonb custom_attributes
    }

    LEAD_CAMPAIGN {
        uuid id PK
        uuid campaign_id FK
        uuid lead_id FK
        string status "UNCONTACTED | IN_PROGRESS | REPLIED | BOUNCED | UNSUBSCRIBED"
        int current_step
        timestamp next_scheduled_at
    }

    EMAIL_LOG {
        uuid id PK
        uuid lead_campaign_id FK
        uuid inbox_id FK
        string message_id
        string status "QUEUED | SENT | OPENED | CLICKED | BOUNCED | REPLIED"
        string subject_sent
        text body_sent
        timestamp sent_at
    }
```

---

### 3. Core Engine Mechanics & Algorithms

#### 3.1 Jitter & Sender Pool Distribution Algorithm
1. Every minute, the scheduler queries `LEAD_CAMPAIGN` records where `status = 'IN_PROGRESS'` and `next_scheduled_at <= NOW()`.
2. For each eligible lead, the dispatcher selects an available inbox from the campaign's `CAMPAIGN_INBOX_POOL` where:
   $$\text{sent\_today} < \text{daily\_limit} \quad \text{and} \quad \text{is\_active} = \text{true}$$
3. An atomic distributed lock is acquired in Valkey for that specific inbox to guarantee that no two emails from the same sender are dispatched concurrently.
4. Jitter Delay Calculation:
   $$t_{\text{dispatch}} = \text{NOW}() + \text{random}(\text{min\_delay\_seconds}, \text{max\_delay\_seconds})$$
   (Typical range: 180s to 360s, preventing bursts that trigger spam filters).

#### 3.2 Real-Time Stop-on-Reply Engine
```mermaid
sequenceDiagram
    autonumber
    actor Lead
    participant IMAP as IMAP Worker (IDLE / Poll)
    participant DB as PostgreSQL
    participant Q as Valkey / BullMQ

    Lead->>IMAP: Replies to cold email
    IMAP->>IMAP: Parse Message-ID & In-Reply-To header
    IMAP->>DB: Match In-Reply-To with EMAIL_LOG.message_id
    alt Match Found
        DB->>DB: Update LEAD_CAMPAIGN.status = 'REPLIED'
        IMAP->>Q: Remove pending jobs for this lead
        IMAP->>DB: Create Inbound Event & Notification
    else Unrecognized Thread
        IMAP->>DB: Fallback search by sender email address
    end
```

#### 3.3 Configurable Lead Scraping & Enrichment Waterfall
```mermaid
flowchart TD
    Start["User triggers Scrape Job (Query: 'AI agencies in SF', Provider: Google Maps / Apify)"] --> Adapter["Provider Adapter (BYOK Google Maps / Apify API)"]
    Adapter --> RawPlaces["Raw Company Results (Name, Address, Phone, Website, Rating, Reviews)"]
    RawPlaces --> DomainFilter{"Has Valid Website?"}
    DomainFilter -- No --> LogPhone["Store Phone / Location info in Lead record"]
    DomainFilter -- Yes --> HeadlessCrawler["Built-in Fast Crawler (Cheerio / HTTP)"]
    HeadlessCrawler --> CrawlPages["Probe /contact, /about, /team, and root mailto links"]
    CrawlPages --> RegexExtract["Extract & Clean Public Business Emails"]
    RegexExtract --> Dedupe{"Exists in Workspace?"}
    Dedupe -- Yes (Duplicate) --> Skip["Skip duplicate or merge metadata"]
    Dedupe -- No --> SaveLead["Insert into LEAD (Tag: source=google_maps, metadata=reviews/rating)"]
    SaveLead --> Enroll{"Auto-enroll in Campaign?"}
    Enroll -- Yes --> QueueCampaign["Assign to Target Campaign Sequence"]
    Enroll -- No --> ContactList["Save to General Leads List"]
```

---

### 4. Custom Tracking Domain (CTD) Architecture
* To avoid blacklisting shared tracking domains, users configure a CNAME:
  `track.agencydomain.com -> ctd.yourplatform.com`
* **Caddy** handles on-demand automated TLS for all custom subdomains via HTTP-01 challenge.
* When a recipient opens an email or clicks a masked link, Caddy forwards the request to Fastify:
  - Open tracking: Returns a $1\times 1$ transparent GIF (`Content-Type: image/gif`).
  - Link tracking: Records click event with user-agent and IP, then issues an immediate `302 Redirect` to the destination URL.

---

### 5. Multi-Tenant Security & Isolation
1. **Workspace Data Boundary**: Every SQL query is scoped by `workspace_id`.
2. **Encrypted Vault**: Sensitive keys (BYOK tokens, SMTP/IMAP passwords) are stored encrypted via AES-256-GCM. Decryption keys are held strictly in server memory via environment variables (`MASTER_ENCRYPTION_KEY`).
3. **Tenant Throttling**: Valkey sliding window rate limiter prevents any single tenant from monopolizing the dispatch queue.

---

### 6. Deployment Topology & Resource Footprint

| Service | Technology | Idle RAM Usage | Peak RAM Usage |
| :--- | :--- | :--- | :--- |
| Reverse Proxy | Caddy 2 | ~15 MB | ~30 MB |
| Web UI | Next.js 15 (Node Standalone) | ~70 MB | ~120 MB |
| API Server | Fastify (TypeScript) | ~45 MB | ~90 MB |
| Worker Service | BullMQ Workers | ~55 MB | ~110 MB |
| Database | PostgreSQL 16 Alpine | ~60 MB | ~150 MB |
| Cache & Queue | Valkey 7 / Redis Alpine | ~15 MB | ~35 MB |
| **Total Stack** | **Docker Compose** | **~260 MB** | **~535 MB** |

> **Result**: Runs comfortably on a **$7–$12/month VPS** (e.g., Hetzner 4GB RAM), well within the $20–$25 monthly target budget!
