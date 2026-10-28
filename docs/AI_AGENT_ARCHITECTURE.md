# AI Architecture & Configurable Autonomy Specification
## Project: Predictive Distribution System

### 1. Vision & Design Principle
The AI engine in this distribution system is designed around **Pragmatic Agency Utility**, not black-box gimmicks. AI must be **strictly optional**, **controllable on a granular slider**, and **economically neutral** to the platform provider via BYOK (Bring-Your-Own-Key).

---

### 2. The 3-Tier Autonomy Slider (Configurable Per Campaign)

Users can configure the autonomy level per workspace or override it per campaign:

```
[ Tier 0: Deterministic ] <---------> [ Tier 1: Copilot / HITL ] <---------> [ Tier 2: Guardrailed Autonomous ]
   • 100% Rule-based                     • AI draft proposals                   • Dynamic runtime generation
   • Native Spintax                      • Bulk review & edit screen            • Auto-dispatch upon validation
   • 0 LLM API calls                     • Human approves batch                 • Fallback to Tier 0 on failure
```

#### Tier 0: Deterministic & Spintax (Zero AI Cost)
* Uses standard mustache variables (`{{firstName}}`, `{{company}}`, `{{role}}`) and recursive spintax:
  - `{Hey|Hi|Hello} {{firstName}}, loved the update on {{company}}'s recent launch.`
* Runs locally with zero latency, zero token costs, and 0% risk of hallucinations.

#### Tier 1: Copilot / Human-in-the-Loop (HITL) - Default Recommended
* System analyzes the lead's company domain, LinkedIn summary, or tech stack signals.
* Pre-generates personalized observations or pain-point hooks (e.g., `"Noticed your engineering team is scaling Python microservices; typically teams encounter bottleneck X..."`).
* Populates a **Bulk Approval Table** in the UI:
  - Displays: `Lead`, `Generated Hook`, `Confidence Score`, `Edit Field`, `Approve All / Reject`.
  - Queued emails do not dispatch until marked `APPROVED`.

#### Tier 2: Guardrailed Autonomous (High Velocity)
* For mature campaigns with validated prompts:
  - Generates emails dynamically right before the queue dispatch job executes.
  - Enforces automated quality guardrails:
    1. **Length Guardrail**: Rejects outputs $>120$ words or $<30$ words.
    2. **Tone & Keyword Blacklist**: Prohibits generic spam clichés (e.g., `"I hope this email finds you well"`, `"Synergy"`, `"Revolutionary"`).
    3. **Hallucination Fallback**: If LLM confidence is low or API returns error/timeout, the engine automatically falls back to the deterministic Tier 0 spintax template without stalling the queue.

---

### 3. Bring-Your-Own-Key (BYOK) Engine

#### Supported Providers:
* **DeepSeek (V3 / R1)**: Recommended for high-speed, ultra-low cost ($0.14 - $0.28 / 1M tokens).
* **OpenAI (GPT-4o-mini / GPT-4o)**
* **Anthropic (Claude 3.5 Haiku / Sonnet)**
* **Groq (Llama-3.3-70B / Mixtral)**: Sub-second inference latency.
* **Local / Self-hosted**: Any OpenAI-compatible endpoint (Ollama / vLLM).

#### Security & Secret Storage:
1. Keys are encrypted at rest using AES-256-GCM with a workspace-scoped initialization vector (IV) and master secret key stored in environment variables.
2. Keys are decrypted strictly in-memory during worker job execution and are never returned to the frontend after saving (masked as `sk-...abcd`).

---

### 4. Scraped Lead Intelligence & Agency Pitch Generation
When leads are acquired via Google Maps API or Apify, the raw payload contains rich contextual signals:
* **Google Maps Signals**: Star rating, review count, customer sentiment summary, business category, business hours, and photo count.
* **Website Crawl Signals**: Meta title, hero headline, tech stack signatures (WordPress, Shopify, Webflow, custom React), presence of online booking/chat widgets.

The AI Engine formats these into agency pain-point hooks:
* *Example (Web Development Agency)*: "Noticed {{company}} has a stellar 4.9-star rating across 240+ Google reviews, but your current site lacks mobile-first scheduling, which often costs local practices 20–30% of visitor conversions."
* *Example (AI Automation Agency)*: "Saw you're handling over 150 inquiries a week based on your Google Maps traffic volume—most teams we partner with lose 3 hours a day answering the same FAQs manually."

---

### 5. Prompt Engineering & Grounding Contract

To ensure high reply rates for a software services agency, prompts are grounded on concrete evidence:
```json
{
  "agency_capabilities": ["Cloud Migration", "Fullstack TypeScript", "AI Agents", "React/Next.js Performance"],
  "lead_signals": {
    "company": "Acme Health",
    "open_roles": ["Senior Backend Engineer (Node.js/PostgreSQL)"],
    "tech_stack": ["React", "Express", "AWS"],
    "recent_news": "Raised Series A funding 2 months ago"
  },
  "objective": "Pitch staff augmentation or dedicated engineering sprint to alleviate hiring bottleneck without sounding generic."
}
```

#### Output Schema (Strict JSON Mode):
```json
{
  "subject_line": "acme's node.js roadmap + quick q",
  "personalized_hook": "Saw Acme is looking for a Senior Node/Postgres engineer following your Series A—scaling backend while interviewing can be a bottleneck.",
  "confidence_score": 0.94,
  "flagged_words": []
}
```
