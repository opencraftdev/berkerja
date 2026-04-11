import type { PlatformName } from './selectors/config';
import type { PlatformSelector } from './selectors/config';

interface ValidationResult {
  valid: boolean;
  reason?: string;
  newSelectors?: Partial<PlatformSelector['selectors']>;
}

function getOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');
  return key;
}

export async function validateJobs(
  jobs: unknown[],
  platform: PlatformName
): Promise<ValidationResult> {
  if (!jobs || jobs.length === 0) {
    return { valid: false, reason: 'No jobs extracted' };
  }

  const requiredFields = ['title', 'company', 'url'];
  const validJobs = jobs.filter((job: unknown) => {
    if (!job || typeof job !== 'object') return false;
    const j = job as Record<string, unknown>;
    return requiredFields.every((f) => j[f] && typeof j[f] === 'string');
  });

  if (validJobs.length === 0) {
    return { valid: false, reason: 'All jobs missing required fields (title, company, url)' };
  }

  return { valid: true };
}

export async function reExtractSelectors(
  platform: PlatformName,
  currentSelectors: PlatformSelector,
  pageHtml: string
): Promise<Partial<PlatformSelector['selectors']>> {
  const key = getOpenRouterKey();
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

  const prompt = `The selectors for ${platform} job site are broken and failed to extract valid job data.

Current selectors: ${JSON.stringify(currentSelectors.selectors)}

Page HTML snippet (first 2000 chars):
${pageHtml.slice(0, 2000)}

Please analyze the HTML and return NEW CSS selectors that will correctly extract:
- jobList: selector for the container of each job listing
- title: selector for the job title within a job listing
- company: selector for the company name within a job listing  
- location: selector for the location within a job listing
- url: selector for the link to the job detail page (use @href suffix if needed, e.g. "a@href")

Return ONLY valid JSON, no markdown:
{"selectors":{"jobList":"...","title":"...","company":"...","location":"...","url":"..."}}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenRouter');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse selectors from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.selectors;
}
