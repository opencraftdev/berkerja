# Spec: Berkerja - Automated Job Aggregation System

## 1. Product Overview

**Name:** Berkerja
**Type:** Full-stack web application (Next.js + Supabase)
**Core Functionality:** Automated job aggregation system that parses user CVs, generates search keywords via deep agents, scrapes job listings from major platforms, and presents a unified dashboard.
**Target Users:** Job seekers wanting to automate job hunting across Glints, LinkedIn, and JobStreet.

## 2. Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js (App Router) |
| Database | Supabase (PostgreSQL) |
| AI/LLM | OpenRouter (Claude 3 Haiku via deep agents) |
| Browser Automation | Vercel `agent-browser` |
| Auth | Supabase Auth |
| Styling | Tailwind CSS + shadcn/ui |
| Agent Framework | deepagents.js (LangChain/LangGraph) |

## 3. Architecture

### 3.1 Data Flow
```
User CV Upload → Parse Text → Deep Agent Analysis → Keyword Generation → Agent Browser Scraping → Dashboard Display
```

### 3.2 Deep Agent Workflow (CV → Keywords)

The `CvKeywordAgent` uses deepagents.js with planning + sub-agents:

```
┌─────────────────────────────────────────────────────────────┐
│                    CvKeywordAgent                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ skills-      │  │ role-        │  │ market-      │   │
│  │ extractor    │  │ analyzer      │  │ researcher   │   │
│  │ (sub-agent)  │  │ (sub-agent)   │  │ (sub-agent)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                │                  │              │
│         └────────────────┴──────────────────┘              │
│                          │                                 │
│                    ┌─────┴─────┐                          │
│                    │ synthesizer │                         │
│                    │ (main agent) │                         │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

**Sub-agents:**
- `skills-extractor`: Identifies technical skills, soft skills, tools
- `role-analyzer`: Determines current/past roles, seniority level
- `market-researcher`: Researches job titles and market trends for the role

**Main agent (synthesizer):** Combines sub-agent outputs → generates final keyword queries

### 3.3 Database Schema (Supabase)

**Tables:**

1. **`profiles`** - User profiles
   - `id` (uuid, PK)
   - `email` (text)
   - `created_at` (timestamp)

2. **`cvs`** - Parsed CV text
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles)
   - `raw_text` (text)
   - `file_name` (text)
   - `analysis_result` (jsonb) — structured output from deep agent
   - `created_at` (timestamp)

3. **`keywords`** - Generated/edited keywords
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles)
   - `cv_id` (uuid, FK → cvs)
   - `queries` (text[])
   - `generation_notes` (text) — agent's reasoning
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

4. **`jobs`** - Scraped job listings
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles)
   - `title` (text)
   - `company` (text)
   - `location` (text)
   - `url` (text)
   - `description_snippet` (text)
   - `full_description` (text)
   - `platform` (enum: 'glints', 'linkedin', 'jobstreet')
   - `keyword_query` (text)
   - `status` (enum: 'new', 'clicked', 'pending', 'applied')
   - `scraped_at` (timestamp)
   - `created_at` (timestamp)

## 4. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cv/upload` | POST | Upload and parse CV (PDF/DOCX) |
| `/api/cv/analyze` | POST | Deep agent CV analysis + keyword generation |
| `/api/keywords` | GET | Fetch user's keywords |
| `/api/keywords` | PATCH | Update keywords manually |
| `/api/jobs/scrape` | POST | Trigger agent-browser scraping |
| `/api/jobs/[id]` | PATCH | Update job status |
| `/api/jobs` | GET | Fetch user's scraped jobs |

## 5. UI Pages

### Phase 1: CV Management (`/cv`)
- File upload dropzone (PDF, DOCX)
- List of uploaded CVs
- View parsed CV text + deep agent analysis results

### Phase 2: Keyword Generation (`/keywords`)
- Display generated keywords as editable tags
- "Regenerate" button to trigger deep agent analysis
- Show agent reasoning/notes
- Manual add/edit/delete keywords
- Save keywords to database

### Phase 3: Job Scraping (Internal)
- No user-facing page
- Triggered via "Start Scraping" button on Keywords page
- Background job via API route

### Phase 4: Job Dashboard (`/jobs`)
- Unified job listing table/grid
- Filters: platform, keyword, status, date
- Sort: date scraped, title, company
- "Apply" button → opens job URL in new tab
- Status tracking (new → clicked → pending → applied)

## 6. Component Inventory

### Layout
- `Sidebar` - Navigation sidebar
- `Header` - Top bar with user info

### CV Components
- `CvUploadDropzone` - File upload UI
- `CvList` - List of user's CVs
- `CvViewer` - Display parsed CV text + analysis

### Keyword Components
- `KeywordEditor` - Tag-based keyword editor
- `KeywordGenerateButton` - Triggers deep agent
- `KeywordAnalysisNotes` - Shows agent reasoning

### Job Components
- `JobCard` - Individual job display
- `JobFilters` - Filter controls
- `JobList` - Paginated job listing
- `JobStatusBadge` - Visual status indicator

### UI Primitives
- `Button`, `Input`, `Card`, `Badge`, `Dialog`, `Select`

## 7. Key Implementation Details

### CV Parsing
- Use `pdf-parse` for PDF text extraction
- Use `mammoth` for DOCX text extraction
- Store raw text in `cvs.raw_text`

### Deep Agent: CvKeywordAgent

Built with `deepagents.js`:
```typescript
import { createDeepAgent } from 'deepagents';
import { ChatAnthropic } from '@langchain/anthropic';

const cvAgent = createDeepAgent({
  model: new ChatAnthropic({ model: 'claude-sonnet-4-20250514' }),
  systemPrompt: CV_KEYWORD_SYSTEM_PROMPT,
  subagents: [
    { name: 'skills-extractor', ... },
    { name: 'role-analyzer', ... },
    { name: 'market-researcher', ... },
  ],
});
```

**Tools available to agent:**
- `write_todos` — planning
- `read_file` / `write_file` — filesystem (store intermediate results)
- `task` — spawn sub-agents

**Output:** JSON array of keyword queries + reasoning notes

### Agent Browser Scraping (Record & Replay)

**First-time scrape (learning phase):**
1. Use agent-browser CLI with LLM guidance
2. Agent navigates, extracts data, identifies stable CSS selectors
3. **Save interaction as shell script** to `scripts/<platform>-scraper.sh`
4. Store selectors + pagination logic in script

**Subsequent scrapes (replay phase):**
1. Run saved `.sh` script directly via shell
2. **Zero LLM tokens** — pure shell execution
3. Script outputs standardized JSON
4. Only re-record if page structure changes

**Script structure:**
```bash
#!/bin/bash
# scripts/glints-scraper.sh
agent-browser open "https://glints.com/jobs?query=frontend"
agent-browser fill @search-input "$KEYWORD"
agent-browser click @search-button
# ... pagination loop ...
agent-browser snapshot > output.json
agent-browser close
```

**Platform strategy:**
| Platform | Method | Notes |
|----------|--------|-------|
| Glints | Shell script replay | Stable layout, record once |
| JobStreet | Shell script replay | Stable layout, record once |
| LinkedIn | agent-browser always | Anti-bot changes selectors frequently |

### Anti-Bot Mitigations
- Human-like delays between actions
- Rate limiting
- CSS selectors over LLM DOM evaluation when possible

## 8. Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth routes
│   ├── (dashboard)/         # Main app routes
│   │   ├── cv/
│   │   ├── keywords/
│   │   ├── jobs/
│   │   └── settings/
│   ├── api/                 # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # Base UI components
│   ├── layout/              # Layout components
│   └── */                   # Feature components
├── config/                  # Configuration files
├── features/                # Feature modules
│   ├── cv-management/
│   ├── keyword-generation/
│   ├── job-scraping/
│   └── job-dashboard/
├── lib/
│   ├── deepagents/
│   │   ├── cv-agent.ts       # CvKeywordAgent config
│   │   ├── subagents/
│   │   │   ├── skills-extractor.ts
│   │   │   ├── role-analyzer.ts
│   │   │   └── market-researcher.ts
│   │   └── prompts/
│   │       └── cv-keywords.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── scraper/
│       ├── runner.ts         # Execute saved scripts
│       └── recorder.ts       # Record new scripts
├── stores/                  # Global state
├── types/                   # Shared types
├── utils/                   # Utilities
└── scripts/                 # Saved scraper scripts
    ├── glints-scraper.sh
    ├── jobstreet-scraper.sh
    └── linkedin-scraper.sh
```

## 9. Development Slices

### Slice 1: CV + Keywords (Deep Agent)
- Next.js scaffold + Supabase schema
- CV upload and parsing
- deepagents.js setup for CV analysis
- CvKeywordAgent with sub-agents
- Keywords UI (CRUD)

### Slice 2: Scraping Agent (Record & Replay)
- Install agent-browser CLI
- Record Glints scrape using agent-browser + LLM
- Save script to `scripts/glints-scraper.sh`
- Test script replay (zero LLM)
- Supabase job storage

### Slice 3: Dashboard + Integration
- Unified job listing page
- Filters and sorting
- Apply button with URL redirect
- Status tracking in Supabase

## 10. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=              # For deepagents (Claude Sonnet)
AGENT_BROWSER_API_KEY=
```

## 11. Success Criteria

- [ ] User can upload CV (PDF/DOCX) and see parsed text
- [ ] Deep agent analyzes CV using planning + sub-agents
- [ ] Agent generates 3-5 relevant keywords with reasoning notes
- [ ] User can edit keywords before scraping
- [ ] Scraping extracts jobs from at least Glints
- [ ] Dashboard shows unified job listings
- [ ] "Apply" button opens job URL and updates status
- [ ] All data persisted in Supabase
