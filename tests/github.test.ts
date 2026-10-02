import { describe, expect, it } from 'vitest';
import {
  GithubError,
  fetchRepos,
  isValidUsername,
  notableRepos,
  repoToProject,
  summarizeLanguages,
} from '../web/src/github';
import { repo } from './fixtures';

describe('summarizeLanguages', () => {
  it('counts own repositories per language, most used first', () => {
    const summary = summarizeLanguages([
      repo({ name: 'a', language: 'TypeScript', pushed_at: '2026-01-01T00:00:00Z' }),
      repo({ name: 'b', language: 'Go', pushed_at: '2026-05-01T00:00:00Z' }),
      repo({ name: 'c', language: 'TypeScript', pushed_at: '2026-09-01T00:00:00Z' }),
      repo({ name: 'd', language: 'Rust', pushed_at: '2025-01-01T00:00:00Z' }),
      repo({ name: 'fork', language: 'Go', fork: true }),
      repo({ name: 'none', language: null }),
    ]);
    expect(summary).toEqual([
      { language: 'TypeScript', repos: 2, lastPushed: '2026-09-01' },
      { language: 'Go', repos: 1, lastPushed: '2026-05-01' },
      { language: 'Rust', repos: 1, lastPushed: '2025-01-01' },
    ]);
  });
});

describe('notableRepos', () => {
  it('lists starred repositories first, then recent ones, without forks or archives', () => {
    const names = notableRepos([
      repo({ name: 'old', pushed_at: '2024-01-01T00:00:00Z' }),
      repo({ name: 'starred', stargazers_count: 3, pushed_at: '2023-01-01T00:00:00Z' }),
      repo({ name: 'recent', pushed_at: '2026-09-01T00:00:00Z' }),
      repo({ name: 'fork', fork: true, stargazers_count: 100 }),
      repo({ name: 'archived', archived: true, stargazers_count: 50 }),
    ]).map((entry) => entry.name);
    expect(names).toEqual(['starred', 'recent', 'old']);
  });
});

describe('repoToProject', () => {
  it('drafts a personal project from a repository', () => {
    const project = repoToProject(
      repo({ name: 'strip-alpha', description: 'Remove alpha channels.', language: 'TypeScript' }),
    );
    expect(project).toMatchObject({
      title: 'strip-alpha',
      start: '2025-01',
      end: '2026-09',
      role: '個人開発',
      description: 'Remove alpha channels.\nhttps://github.com/example/repo',
    });
    expect(project.stack.languages).toBe('TypeScript');
  });
});

describe('fetchRepos', () => {
  function respond(status: number, body: unknown = []): typeof fetch {
    return async () => new Response(JSON.stringify(body), { status });
  }

  it('validates the username before any request', async () => {
    expect(isValidUsername('SENA10X')).toBe(true);
    for (const name of ['', '-a', 'a-', 'a--b', 'a/b', 'a'.repeat(40)]) {
      expect(isValidUsername(name), name).toBe(false);
    }
    await expect(fetchRepos('../x', respond(200))).rejects.toMatchObject({ code: 'invalid-user' });
  });

  it('maps HTTP failures to fixed codes', async () => {
    await expect(fetchRepos('someone', respond(404))).rejects.toMatchObject({ code: 'not-found' });
    await expect(fetchRepos('someone', respond(403))).rejects.toMatchObject({ code: 'rate-limited' });
    await expect(fetchRepos('someone', respond(500))).rejects.toMatchObject({ code: 'network' });
    const offline: typeof fetch = async () => {
      throw new TypeError('offline');
    };
    await expect(fetchRepos('someone', offline)).rejects.toBeInstanceOf(GithubError);
  });

  it('returns the repositories', async () => {
    const repos = [repo({ name: 'a' })];
    await expect(fetchRepos(' someone ', respond(200, repos))).resolves.toEqual(repos);
  });
});
