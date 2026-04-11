# Berkerja Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Berkerja - automated job aggregation system with CV upload, deep agent keyword generation, and record-replay job scraping.

**Architecture:** Next.js app with Supabase DB, deepagents.js for CV analysis, agent-browser CLI with record-replay pattern for scraping.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL), deepagents.js, agent-browser CLI, Tailwind CSS + shadcn/ui, OpenRouter

---

## File Structure

```
marketing-automation/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── cv/page.tsx
│   │   │   ├── keywords/page.tsx
│   │   │   ├── jobs/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── cv/upload/route.ts
│   │   │   ├── cv/analyze/route.ts
│   │   │   ├── keywords/route.ts
│   │   │   ├── jobs/route.ts
│   │   │   ├── jobs/[id]/route.ts
│   │   │   └── jobs/scrape/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/sidebar.tsx
│   │   ├── layout/header.tsx
│   │   ├── cv/upload-dropzone.tsx
│   │   ├── cv/cv-list.tsx
│   │   ├── cv/cv-viewer.tsx
│   │   ├── keywords/keyword-editor.tsx
│   │   ├── keywords/keyword-generate-button.tsx
│   │   ├── jobs/job-card.tsx
│   │   ├── jobs/job-filters.tsx
│   │   └── jobs/job-list.tsx
│   ├── config/
│   │   ├── supabase.ts
│   │   └── env.ts
│   ├── lib/
│   │   ├── deepagents/
│   │   │   ├── cv-agent.ts
│   │   │   ├── subagents/skills-extractor.ts
│   │   │   ├── subagents/role-analyzer.ts
│   │   │   └── subagents/market-researcher.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── scraper/
│   │       ├── runner.ts
│   │       └── recorder.ts
│   ├── features/
│   │   ├── cv-management/
│   │   │   ├── api/upload.ts
│   │   │   ├── api/analyze.ts
│   │   │   ├── components/cv-upload.tsx
│   │   │   ├── hooks/use-cv.ts
│   │   │   └── types/cv.ts
│   │   ├── keyword-generation/
│   │   │   ├── api/generate.ts
│   │   │   ├── components/keyword-editor.tsx
│   │   │   ├── hooks/use-keywords.ts
│   │   │   └── types/keyword.ts
│   │   ├── job-scraping/
│   │   │   ├── api/scrape.ts
│   │   │   ├── components/scraper-status.tsx
│   │   │   ├── hooks/use-scraper.ts
│   │   │   └── types/job.ts
│   │   └── job-dashboard/
│   │       ├── api/jobs.ts
│   │       ├── components/job-list.tsx
│   │       ├── hooks/use-jobs.ts
│   │       └── types/job.ts
│   ├── types/
│   │   ├── cv.ts
│   │   ├── job.ts
│   │   └── user.ts
│   └── utils/
│       ├── cn.ts
│       └── format.ts
├── scripts/
│   ├── glints-scraper.sh
│   ├── jobstreet-scraper.sh
│   └── linkedin-scraper.sh
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── package.json
└── .env.local
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "berkerja",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "deepagents": "^0.5.0",
    "@langchain/anthropic": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.8.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.453.0",
    "react-dropzone": "^14.2.9",
    "zod": "^3.23.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Create .env.local.example**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json next.config.js tailwind.config.ts .env.local.example
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: Supabase Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `src/config/supabase.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Create migration SQL**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVs table
CREATE TABLE cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  file_name TEXT NOT NULL,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keywords table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
  queries TEXT[] NOT NULL DEFAULT '{}',
  generation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TYPE job_platform AS ENUM ('glints', 'linkedin', 'jobstreet');
CREATE TYPE job_status AS ENUM ('new', 'clicked', 'pending', 'applied');

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  url TEXT NOT NULL,
  description_snippet TEXT,
  full_description TEXT,
  platform job_platform NOT NULL,
  keyword_query TEXT,
  status job_status NOT NULL DEFAULT 'new',
  scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_keywords_user_id ON keywords(user_id);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_platform ON jobs(platform);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can manage own CVs" ON cvs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own keywords" ON keywords FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
```

- [ ] **Step 2: Create src/config/supabase.ts**

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 3: Create src/lib/supabase/client.ts**

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Create src/lib/supabase/server.ts**

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component
          }
        },
      },
    }
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql src/config/supabase.ts src/lib/supabase/
git commit -m "feat: add Supabase schema and client"
```

---

## Task 3: CV Upload & Parsing

**Files:**
- Create: `src/types/cv.ts`
- Create: `src/features/cv-management/types/cv.ts`
- Create: `src/features/cv-management/api/upload.ts`
- Create: `src/app/api/cv/upload/route.ts`
- Create: `src/components/cv/upload-dropzone.tsx`
- Create: `src/app/(dashboard)/cv/page.tsx`

- [ ] **Step 1: Create src/types/cv.ts**

```ts
export interface CV {
  id: string;
  user_id: string;
  raw_text: string;
  file_name: string;
  analysis_result: CVAnalysis | null;
  created_at: string;
}

export interface CVAnalysis {
  skills: string[];
  roles: string[];
  experience_years: number;
  education: string[];
  summary: string;
}
```

- [ ] **Step 2: Create src/features/cv-management/api/upload.ts**

```ts
import { createClient } from '@/lib/supabase/client';
import { CV } from '@/types/cv';

export async function uploadCV(file: File, userId: string): Promise<CV> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  let rawText = '';
  
  if (file.name.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(buffer);
    rawText = pdfData.text;
  } else if (file.name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value;
  } else {
    throw new Error('Unsupported file type');
  }

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('cvs')
    .insert({
      user_id: userId,
      raw_text: rawText,
      file_name: file.name,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserCVs(userId: string): Promise<CV[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

- [ ] **Step 3: Create src/app/api/cv/upload/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadCV } from '@/features/cv-management/api/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    const cv = await uploadCV(file, userId);
    return NextResponse.json(cv);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Create src/components/cv/upload-dropzone.tsx**

```tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/utils/cn';

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function UploadDropzone({ onUpload, isUploading }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError('Please upload a PDF or DOCX file');
      return;
    }
    
    setError(null);
    await onUpload(acceptedFiles[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
        isUploading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-4 text-sm text-gray-600">
        {isUploading
          ? 'Uploading...'
          : isDragActive
          ? 'Drop the CV here'
          : 'Drag & drop a CV here, or click to select'}
      </p>
      <p className="mt-2 text-xs text-gray-400">PDF or DOCX</p>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Create src/app/(dashboard)/cv/page.tsx**

```tsx
'use client';

import { useState } from 'react';
import { UploadDropzone } from '@/components/cv/upload-dropzone';
import { uploadCV, getUserCVs } from '@/features/cv-management/api/upload';
import { CV } from '@/types/cv';

export default function CVPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCv, setSelectedCv] = useState<CV | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const cv = await uploadCV(file, 'user-id');
      setCvs([cv, ...cvs]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CV Management</h1>
      
      <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your CVs</h2>
        {cvs.length === 0 ? (
          <p className="text-gray-500">No CVs uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {cvs.map((cv) => (
              <div
                key={cv.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedCv(cv)}
              >
                <p className="font-medium">{cv.file_name}</p>
                <p className="text-sm text-gray-500">
                  Uploaded {new Date(cv.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCv && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">CV Content</h2>
          <pre className="p-4 bg-gray-100 rounded-lg overflow-auto whitespace-pre-wrap">
            {selectedCv.raw_text}
          </pre>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/types/cv.ts src/features/cv-management/ src/components/cv/ src/app/api/cv/ src/app/\(dashboard\)/cv/
git commit -m "feat: add CV upload and parsing"
```

---

## Task 4: deepagents.js Setup

**Files:**
- Create: `src/lib/deepagents/subagents/skills-extractor.ts`
- Create: `src/lib/deepagents/subagents/role-analyzer.ts`
- Create: `src/lib/deepagents/subagents/market-researcher.ts`
- Create: `src/lib/deepagents/prompts/cv-keywords.ts`
- Create: `src/lib/deepagents/cv-agent.ts`

- [ ] **Step 1: Create src/lib/deepagents/prompts/cv-keywords.ts**

```ts
export const CV_KEYWORD_SYSTEM_PROMPT = `You are an expert job search consultant. Your job is to analyze CVs and generate effective job search keywords.

You have access to three specialized sub-agents:
- skills-extractor: Identifies technical skills, tools, and soft skills
- role-analyzer: Determines job titles, seniority, and career trajectory
- market-researcher: Researches current market trends and job titles

Your output should be a JSON array of 3-5 optimized job search queries that:
1. Combine skills with role titles
2. Reflect current market naming conventions
3. Maximize relevant job matches

Return your final answer as a JSON object:
{
  "keywords": ["query1", "query2", ...],
  "reasoning": "Brief explanation of keyword choices"
}`;
```

- [ ] **Step 2: Create src/lib/deepagents/subagents/skills-extractor.ts**

```ts
import type { SubAgent } from 'deepagents';

export const skillsExtractorSubagent: SubAgent = {
  name: 'skills-extractor',
  description: 'Extracts technical skills, tools, and soft skills from CV text',
  systemPrompt: `You are a skills analyst. Analyze the provided CV text and extract:

1. Technical skills (programming languages, frameworks, tools)
2. Soft skills (communication, leadership, etc.)
3. Domain knowledge (industry-specific expertise)

Format your response as a JSON array of skill strings.`,
};
```

- [ ] **Step 3: Create src/lib/deepagents/subagents/role-analyzer.ts**

```ts
import type { SubAgent } from 'deepagents';

export const roleAnalyzerSubagent: SubAgent = {
  name: 'role-analyzer',
  description: 'Analyzes job roles, seniority, and career trajectory from CV',
  systemPrompt: `You are a career analyst. Analyze the provided CV text and determine:

1. Current job title/role
2. Seniority level (Junior, Mid, Senior, Lead, etc.)
3. Years of experience
4. Career trajectory/direction
5. Industry focus

Format your response as a JSON object with these fields.`,
};
```

- [ ] **Step 4: Create src/lib/deepagents/subagents/market-researcher.ts**

```ts
import type { SubAgent } from 'deepagents';

export const marketResearcherSubagent: SubAgent = {
  name: 'market-researcher',
  description: 'Researches current job market trends and job title variations',
  systemPrompt: `You are a job market researcher. Based on the skills and roles identified, research and suggest:

1. Alternative job titles for the same role
2. Market-specific terminology
3. In-demand variations of skills
4. Related roles that might be good matches

Format your response as a JSON array of suggested job search terms.`,
};
```

- [ ] **Step 5: Create src/lib/deepagents/cv-agent.ts**

```ts
import { createDeepAgent } from 'deepagents';
import { ChatOpenAI } from '@langchain/openai';
import { skillsExtractorSubagent } from './subagents/skills-extractor';
import { roleAnalyzerSubagent } from './subagents/role-analyzer';
import { marketResearcherSubagent } from './subagents/market-researcher';
import { CV_KEYWORD_SYSTEM_PROMPT } from './prompts/cv-keywords';

export function createCvKeywordAgent() {
  return createDeepAgent({
    model: new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0,
    }),
    systemPrompt: CV_KEYWORD_SYSTEM_PROMPT,
    subagents: [
      skillsExtractorSubagent,
      roleAnalyzerSubagent,
      marketResearcherSubagent,
    ],
  });
}

export interface KeywordResult {
  keywords: string[];
  reasoning: string;
}

export async function generateKeywords(cvText: string): Promise<KeywordResult> {
  const agent = createCvKeywordAgent();
  
  const result = await agent.invoke({
    messages: [
      {
        role: 'user',
        content: `Analyze this CV and generate job search keywords:\n\n${cvText}`,
      },
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    const parsed = JSON.parse(content);
    return {
      keywords: parsed.keywords || [],
      reasoning: parsed.reasoning || '',
    };
  } catch {
    return {
      keywords: [],
      reasoning: content,
    };
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/deepagents/
git commit -m "feat: add deepagents.js setup for CV keyword generation"
```

---

## Task 5: CV Analyze API

**Files:**
- Create: `src/features/cv-management/api/analyze.ts`
- Create: `src/app/api/cv/analyze/route.ts`
- Create: `src/components/keywords/keyword-generate-button.tsx`

- [ ] **Step 1: Create src/features/cv-management/api/analyze.ts**

```ts
import { createClient } from '@/lib/supabase/client';
import { generateKeywords, KeywordResult } from '@/lib/deepagents/cv-agent';
import { CV } from '@/types/cv';

export async function analyzeCV(cv: CV): Promise<KeywordResult> {
  const result = await generateKeywords(cv.raw_text);

  const supabase = createClient();
  
  const { error } = await supabase
    .from('cvs')
    .update({ analysis_result: result })
    .eq('id', cv.id);

  if (error) throw error;

  const { error: keywordError } = await supabase.from('keywords').insert({
    user_id: cv.user_id,
    cv_id: cv.id,
    queries: result.keywords,
    generation_notes: result.reasoning,
  });

  if (keywordError) throw keywordError;

  return result;
}
```

- [ ] **Step 2: Create src/app/api/cv/analyze/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeCV } from '@/features/cv-management/api/analyze';

export async function POST(request: NextRequest) {
  try {
    const { cvId } = await request.json();

    if (!cvId) {
      return NextResponse.json({ error: 'Missing cvId' }, { status: 400 });
    }

    const result = await analyzeCV({ id: cvId } as any);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create src/components/keywords/keyword-generate-button.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeCV } from '@/features/cv-management/api/analyze';
import { KeywordResult } from '@/lib/deepagents/cv-agent';

interface KeywordGenerateButtonProps {
  cvId: string;
  onGenerated: (result: KeywordResult) => void;
}

export function KeywordGenerateButton({ cvId, onGenerated }: KeywordGenerateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeCV(cvId);
      onGenerated(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isLoading}>
      <Sparkles className="mr-2 h-4 w-4" />
      {isLoading ? 'Analyzing CV...' : 'Generate Keywords'}
    </Button>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/cv-management/api/analyze.ts src/app/api/cv/analyze/route.ts src/components/keywords/keyword-generate-button.tsx
git commit -m "feat: add CV analyze API with deep agents"
```

---

## Task 6: Keyword Management

**Files:**
- Create: `src/features/keyword-generation/types/keyword.ts`
- Create: `src/features/keyword-generation/api/generate.ts`
- Create: `src/app/api/keywords/route.ts`
- Create: `src/components/keywords/keyword-editor.tsx`
- Create: `src/app/(dashboard)/keywords/page.tsx`

- [ ] **Step 1: Create src/features/keyword-generation/types/keyword.ts`

```ts
export interface Keyword {
  id: string;
  user_id: string;
  cv_id: string | null;
  queries: string[];
  generation_notes: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Create src/features/keyword-generation/api/generate.ts**

```ts
import { createClient } from '@/lib/supabase/client';
import { Keyword } from '@/features/keyword-generation/types/keyword';

export async function getKeywords(userId: string): Promise<Keyword[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('keywords')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data || [];
}

export async function updateKeywords(
  keywordId: string,
  queries: string[]
): Promise<Keyword> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('keywords')
    .update({ queries, updated_at: new Date().toISOString() })
    .eq('id', keywordId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 3: Create src/app/api/keywords/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getKeywords, updateKeywords } from '@/features/keyword-generation/api/generate';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keywords = await getKeywords(userId);
    return NextResponse.json(keywords);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { keywordId, queries } = await request.json();

    if (!keywordId || !queries) {
      return NextResponse.json(
        { error: 'Missing keywordId or queries' },
        { status: 400 }
      );
    }

    const keyword = await updateKeywords(keywordId, queries);
    return NextResponse.json(keyword);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Create src/components/keywords/keyword-editor.tsx**

```tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface KeywordEditorProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function KeywordEditor({ keywords, onChange, onSave, isSaving }: KeywordEditorProps) {
  const [newKeyword, setNewKeyword] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      onChange([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Add a keyword..."
          onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
        />
        <Button onClick={addKeyword} variant="secondary">
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="gap-1">
            {keyword}
            <button onClick={() => removeKeyword(keyword)} className="ml-1">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Keywords'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create src/app/(dashboard)/keywords/page.tsx**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { KeywordEditor } from '@/components/keywords/keyword-editor';
import { KeywordGenerateButton } from '@/components/keywords/keyword-generate-button';
import { getKeywords } from '@/features/keyword-generation/api/generate';
import { Keyword } from '@/features/keyword-generation/types/keyword';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getKeywords('user-id').then(setKeywords).catch(console.error);
  }, []);

  const currentKeywords = keywords[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Keyword Generation</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Generated Keywords</h2>
        {currentKeywords ? (
          <KeywordEditor
            keywords={currentKeywords.queries}
            onChange={(queries) =>
              setKeywords([{ ...currentKeywords, queries }])
            }
            onSave={() => {}}
            isSaving={isSaving}
          />
        ) : (
          <p className="text-gray-500">
            Upload a CV first to generate keywords
          </p>
        )}
      </div>

      <KeywordGenerateButton
        cvId={currentKeywords?.cv_id || ''}
        onGenerated={(result) => {
          console.log('Generated:', result);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/features/keyword-generation/ src/app/api/keywords/ src/components/keywords/ src/app/\(dashboard\)/keywords/
git commit -m "feat: add keyword management UI and API"
```

---

## Task 7: Scraper Runner (Record & Replay)

**Files:**
- Create: `src/lib/scraper/runner.ts`
- Create: `src/lib/scraper/recorder.ts`
- Create: `scripts/glints-scraper.sh`

- [ ] **Step 1: Create src/lib/scraper/runner.ts**

```ts
import { spawn } from 'child_process';

export interface ScraperResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function runScraperScript(
  scriptPath: string,
  envVars: Record<string, string> = {}
): Promise<ScraperResult> {
  return new Promise((resolve) => {
    const child = spawn('bash', [scriptPath], {
      env: { ...process.env, ...envVars },
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error: errorOutput || undefined,
      });
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        output: '',
        error: err.message,
      });
    });
  });
}
```

- [ ] **Step 2: Create src/lib/scraper/recorder.ts**

```ts
import { spawn } from 'child_process';

export interface RecordedCommand {
  timestamp: number;
  command: string;
  args: string[];
  output?: string;
}

export class ScraperRecorder {
  private commands: RecordedCommand[] = [];
  private currentOutput = '';

  async startRecording(url: string): Promise<void> {
    return new Promise((resolve) => {
      const child = spawn('agent-browser', ['open', url]);

      child.stdout.on('data', (data) => {
        this.currentOutput += data.toString();
      });

      child.on('close', () => {
        resolve();
      });
    });
  }

  async executeCommand(args: string[]): Promise<string> {
    return new Promise((resolve) => {
      const child = spawn('agent-browser', args);

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        this.commands.push({
          timestamp: Date.now(),
          command: 'agent-browser',
          args,
          output,
        });
        resolve(output);
      });
    });
  }

  generateScript(): string {
    const lines = ['#!/bin/bash', ''];
    
    for (const cmd of this.commands) {
      const argsStr = cmd.args.map(a => `"${a}"`).join(' ');
      lines.push(`agent-browser ${argsStr}`);
    }

    return lines.join('\n');
  }

  getCommands(): RecordedCommand[] {
    return [...this.commands];
  }
}
```

- [ ] **Step 3: Create scripts/glints-scraper.sh**

```bash
#!/bin/bash
# Recorded Glints scraper script
# Generated by Berkerja ScraperRecorder

KEYWORD="${1:-frontend developer}"
OUTPUT_FILE="${2:-/tmp/glints-jobs.json}"

agent-browser open "https://glints.com/jobs"
agent-browser fill @search-input "$KEYWORD"
agent-browser click @search-button
sleep 2

agent-browser snapshot > "$OUTPUT_FILE"
agent-browser close
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/scraper/ scripts/glints-scraper.sh
chmod +x scripts/glints-scraper.sh
git commit -m "feat: add scraper runner and recorder"
```

---

## Task 8: Job Scrape API

**Files:**
- Create: `src/features/job-scraping/api/scrape.ts`
- Create: `src/app/api/jobs/scrape/route.ts`
- Create: `src/features/job-scraping/types/job.ts`

- [ ] **Step 1: Create src/features/job-scraping/types/job.ts**

```ts
export type JobPlatform = 'glints' | 'linkedin' | 'jobstreet';
export type JobStatus = 'new' | 'clicked' | 'pending' | 'applied';

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  description_snippet: string | null;
  full_description: string | null;
  platform: JobPlatform;
  keyword_query: string | null;
  status: JobStatus;
  scraped_at: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Create src/features/job-scraping/api/scrape.ts**

```ts
import { createClient } from '@/lib/supabase/client';
import { runScraperScript } from '@/lib/scraper/runner';
import { Job } from '@/features/job-scraping/types/job';

export interface ScrapeOptions {
  platform: 'glints' | 'linkedin' | 'jobstreet';
  keyword: string;
  userId: string;
}

export async function scrapeJobs(options: ScrapeOptions): Promise<Job[]> {
  const scriptMap = {
    glints: 'scripts/glints-scraper.sh',
    linkedin: 'scripts/linkedin-scraper.sh',
    jobstreet: 'scripts/jobstreet-scraper.sh',
  };

  const scriptPath = scriptMap[options.platform];
  
  const result = await runScraperScript(scriptPath, {
    KEYWORD: options.keyword,
  });

  if (!result.success) {
    throw new Error(result.error || 'Scraping failed');
  }

  const jobs = parseJobsFromOutput(result.output, options);

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('jobs')
    .insert(
      jobs.map((job) => ({
        ...job,
        user_id: options.userId,
        platform: options.platform,
        keyword_query: options.keyword,
        scraped_at: new Date().toISOString(),
      }))
    )
    .select();

  if (error) throw error;
  return data;
}

function parseJobsFromOutput(output: string, options: ScrapeOptions): Partial<Job>[] {
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Create src/app/api/jobs/scrape/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { scrapeJobs } from '@/features/job-scraping/api/scrape';

export async function POST(request: NextRequest) {
  try {
    const { platform, keyword, userId } = await request.json();

    if (!platform || !keyword || !userId) {
      return NextResponse.json(
        { error: 'Missing platform, keyword, or userId' },
        { status: 400 }
      );
    }

    const jobs = await scrapeJobs({ platform, keyword, userId });
    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/job-scraping/ src/app/api/jobs/scrape/route.ts
git commit -m "feat: add job scrape API"
```

---

## Task 9: Job Dashboard

**Files:**
- Create: `src/app/api/jobs/route.ts`
- Create: `src/app/api/jobs/[id]/route.ts`
- Create: `src/features/job-dashboard/api/jobs.ts`
- Create: `src/components/jobs/job-card.tsx`
- Create: `src/components/jobs/job-filters.tsx`
- Create: `src/components/jobs/job-list.tsx`
- Create: `src/app/(dashboard)/jobs/page.tsx`

- [ ] **Step 1: Create src/app/api/jobs/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create src/app/api/jobs/[id]/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create src/features/job-dashboard/api/jobs.ts**

```ts
import { createClient } from '@/lib/supabase/client';
import { Job, JobStatus } from '@/features/job-scraping/types/job';

export async function getJobs(filters?: {
  platform?: string;
  status?: string;
}): Promise<Job[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (filters?.platform) {
    query = query.eq('platform', filters.platform);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus
): Promise<Job> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 4: Create src/components/jobs/job-card.tsx**

```tsx
'use client';

import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@/features/job-scraping/types/job';

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, status: string) => void;
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const handleApply = () => {
    window.open(job.url, '_blank');
    onStatusChange(job.id, 'clicked');
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    clicked: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-orange-100 text-orange-800',
    applied: 'bg-green-100 text-green-800',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{job.title}</h3>
            <p className="text-sm text-gray-600">{job.company}</p>
          </div>
          <Badge className={statusColors[job.status]}>
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-2">{job.location}</p>
        {job.description_snippet && (
          <p className="text-sm mb-4 line-clamp-2">{job.description_snippet}</p>
        )}
        <div className="flex justify-between items-center">
          <Badge variant="outline">{job.platform}</Badge>
          <Button onClick={handleApply} size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create src/components/jobs/job-filters.tsx**

```tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JobFiltersProps {
  platform: string;
  status: string;
  onPlatformChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function JobFilters({
  platform,
  status,
  onPlatformChange,
  onStatusChange,
}: JobFiltersProps) {
  return (
    <div className="flex gap-4">
      <Select value={platform} onValueChange={onPlatformChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Platforms</SelectItem>
          <SelectItem value="glints">Glints</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
          <SelectItem value="jobstreet">JobStreet</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="clicked">Clicked</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="applied">Applied</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 6: Create src/components/jobs/job-list.tsx**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { JobCard } from './job-card';
import { JobFilters } from './job-filters';
import { getJobs, updateJobStatus } from '@/features/job-dashboard/api/jobs';
import { Job } from '@/features/job-scraping/types/job';

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const filters: { platform?: string; status?: string } = {};
    if (platform !== 'all') filters.platform = platform;
    if (status !== 'all') filters.status = status;

    setIsLoading(true);
    getJobs(filters)
      .then(setJobs)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [platform, status]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await updateJobStatus(jobId, newStatus as any);
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-4">
      <JobFilters
        platform={platform}
        status={status}
        onPlatformChange={setPlatform}
        onStatusChange={setStatus}
      />

      {isLoading ? (
        <p>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-500">No jobs found</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create src/app/(dashboard)/jobs/page.tsx**

```tsx
import { JobList } from '@/components/jobs/job-list';

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Dashboard</h1>
      <JobList />
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/jobs/ src/features/job-dashboard/ src/components/jobs/ src/app/\(dashboard\)/jobs/
git commit -m "feat: add job dashboard"
```

---

## Task 10: Dashboard Layout & Navigation

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create src/app/(dashboard)/layout.tsx**

```tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/layout/sidebar.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Key, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/cv', label: 'CV', icon: FileText },
  { href: '/keywords', label: 'Keywords', icon: Key },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-4">
        <h1 className="text-xl font-bold">Berkerja</h1>
      </div>
      <nav className="mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create src/components/layout/header.tsx**

```tsx
'use client';

import { User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>
      <div className="flex items-center gap-2">
        <User className="h-8 w-8 text-gray-400" />
        <span className="text-sm font-medium">User</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Modify src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Berkerja - Job Aggregation',
  description: 'Automated job aggregation system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Create src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/layout.tsx src/components/layout/ src/app/layout.tsx src/app/globals.css
git commit -m "feat: add dashboard layout and navigation"
```

---

## Task 11: Utility Functions

**Files:**
- Create: `src/utils/cn.ts`
- Create: `src/utils/format.ts`

- [ ] **Step 1: Create src/utils/cn.ts**

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create src/utils/format.ts**

```ts
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/
git commit -m "feat: add utility functions"
```

---

## Task 12: shadcn/ui Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/select.tsx`

- [ ] **Step 1: Create src/components/ui/button.tsx**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input hover:bg-accent',
        ghost: 'hover:bg-accent',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 2: Create src/components/ui/input.tsx**

```tsx
import * as React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 3: Create src/components/ui/card.tsx**

```tsx
import * as React from 'react';
import { cn } from '@/utils/cn';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardContent };
```

- [ ] **Step 4: Create src/components/ui/badge.tsx**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 5: Create src/components/ui/select.tsx**

```tsx
'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

const Select = SelectPrimitive.Root;
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)]')}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectTrigger, SelectContent, SelectItem };
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shadcn/ui components"
```

---

## Self-Review Checklist

1. **Spec coverage:** All sections covered?
   - [x] CV upload + parsing (Task 3)
   - [x] Deep agent keyword generation (Task 4, 5)
   - [x] Record-replay scraper (Task 7, 8)
   - [x] Job dashboard (Task 9)
   - [x] Layout & navigation (Task 10)

2. **Placeholder scan:** Any TBD/TODO placeholders? No

3. **Type consistency:** All interfaces match?
   - CV type matches in all files
   - Job type matches in all files
   - Keyword type matches in all files

**Plan complete.** Tasks are ordered for dependency-free execution.

---

**Plan saved to:** `docs/superpowers/plans/2026-04-11-berkerja-implementation.md`

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
