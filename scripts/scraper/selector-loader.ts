import { platformSelectors, type PlatformName, type PlatformSelector } from './selectors/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const USER_SELECTORS_PATH = path.join(__dirname, 'selectors', 'user-updated.json');

export function loadSelectors(platform: PlatformName): PlatformSelector {
  const base = platformSelectors[platform];

  if (existsSync(USER_SELECTORS_PATH)) {
    try {
      const userSelectors = JSON.parse(readFileSync(USER_SELECTORS_PATH, 'utf-8'));
      if (userSelectors[platform]) {
        return { ...base, selectors: { ...base.selectors, ...userSelectors[platform].selectors } };
      }
    } catch {
      // Ignore parse errors, use base
    }
  }

  return base;
}

export function saveUserSelectors(
  platform: PlatformName,
  selectors: Partial<PlatformSelector['selectors']>
): void {
  let userSelectors: Record<string, Partial<PlatformSelector['selectors']>> = {};

  if (existsSync(USER_SELECTORS_PATH)) {
    try {
      userSelectors = JSON.parse(readFileSync(USER_SELECTORS_PATH, 'utf-8'));
    } catch {
      // Ignore
    }
  }

  userSelectors[platform] = { ...userSelectors[platform], ...selectors };
  writeFileSync(USER_SELECTORS_PATH, JSON.stringify(userSelectors, null, 2));
}
