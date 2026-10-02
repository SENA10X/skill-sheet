/**
 * Drafts skills and personal projects from a public GitHub account.
 *
 * One unauthenticated request to the public REST API — no token, nothing
 * stored. The summarising is kept apart from the fetch so it can be tested
 * without a network.
 */
import { Project, emptyProject, emptyStack } from './model';

/** The fields of GitHub's repository object this tool reads. */
export interface Repo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
}

export type GithubErrorCode = 'invalid-user' | 'not-found' | 'rate-limited' | 'network';

export class GithubError extends Error {
  constructor(readonly code: GithubErrorCode) {
    super(code);
  }
}

export interface LanguageSummary {
  language: string;
  repos: number;
  /** 'YYYY-MM-DD' of the newest push among those repos. */
  lastPushed: string;
}

/** GitHub's own rule: alphanumerics and single inner hyphens, up to 39 chars. */
export function isValidUsername(name: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(name);
}

/** The user's own work only: forks say nothing about what they write. */
function ownRepos(repos: Repo[]): Repo[] {
  return repos.filter((repo) => !repo.fork);
}

/** Languages by how many repositories use them, most used first. */
export function summarizeLanguages(repos: Repo[]): LanguageSummary[] {
  const byLanguage = new Map<string, LanguageSummary>();
  for (const repo of ownRepos(repos)) {
    if (!repo.language) continue;
    const pushed = repo.pushed_at.slice(0, 10);
    const entry = byLanguage.get(repo.language);
    if (entry) {
      entry.repos += 1;
      if (pushed > entry.lastPushed) entry.lastPushed = pushed;
    } else {
      byLanguage.set(repo.language, { language: repo.language, repos: 1, lastPushed: pushed });
    }
  }
  return [...byLanguage.values()].sort(
    (a, b) => b.repos - a.repos || b.lastPushed.localeCompare(a.lastPushed) || a.language.localeCompare(b.language),
  );
}

/** The repositories most worth listing: starred first, then recently active. */
export function notableRepos(repos: Repo[], limit = 6): Repo[] {
  return ownRepos(repos)
    .filter((repo) => !repo.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, limit);
}

/** A personal-project draft for the 職務経歴書, to be edited by hand. */
export function repoToProject(repo: Repo): Project {
  return {
    ...emptyProject(),
    start: repo.created_at.slice(0, 7),
    end: repo.pushed_at.slice(0, 7),
    title: repo.name,
    role: '個人開発',
    teamSize: '1名',
    phases: ['要件定義', '基本設計', '詳細設計', '実装', 'テスト', '運用保守'],
    stack: { ...emptyStack(), languages: repo.language ?? '' },
    description: [repo.description?.trim(), repo.html_url].filter(Boolean).join('\n'),
  };
}

export async function fetchRepos(username: string, fetchImpl: typeof fetch = fetch): Promise<Repo[]> {
  const name = username.trim();
  if (!isValidUsername(name)) throw new GithubError('invalid-user');
  let response: Response;
  try {
    response = await fetchImpl(
      `https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=pushed&type=owner`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
  } catch {
    throw new GithubError('network');
  }
  if (response.status === 404) throw new GithubError('not-found');
  if (response.status === 403 || response.status === 429) throw new GithubError('rate-limited');
  if (!response.ok) throw new GithubError('network');
  const body: unknown = await response.json();
  return Array.isArray(body) ? (body as Repo[]) : [];
}
