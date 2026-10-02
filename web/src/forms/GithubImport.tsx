import { FormEvent, useState } from 'react';
import { track } from '../analytics';
import { GithubError, GithubErrorCode, LanguageSummary, Repo, fetchRepos, notableRepos, repoToProject, summarizeLanguages } from '../github';
import { Resume, emptyCompany, emptySkill } from '../model';

const PERSONAL = '個人開発';

const ERROR_MESSAGES: Record<GithubErrorCode, string> = {
  'invalid-user': 'ユーザー名の形式が正しくありません。',
  'not-found': 'ユーザーが見つかりません。',
  'rate-limited': 'GitHub API の利用上限に達しました。しばらくしてから再度お試しください。',
  network: 'GitHub に接続できませんでした。',
};

interface Result {
  languages: LanguageSummary[];
  repos: Repo[];
}

interface Props {
  resume: Resume;
  onChange: (patch: Partial<Resume>) => void;
}

/**
 * Lists what a public GitHub account shows and lets the user pick what to add.
 * Nothing is added without being ticked, and everything added stays editable.
 */
export function GithubImport({ resume, onChange }: Props) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GithubErrorCode | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [languages, setLanguages] = useState<Set<string>>(new Set());
  const [repos, setRepos] = useState<Set<string>>(new Set());

  const known = new Set(resume.skills.map((skill) => skill.name.trim().toLowerCase()));

  async function load(event: FormEvent): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const all = await fetchRepos(username);
      const next = { languages: summarizeLanguages(all), repos: notableRepos(all) };
      setResult(next);
      setLanguages(new Set(next.languages.map((entry) => entry.language).filter((name) => !known.has(name.toLowerCase()))));
      setRepos(new Set());
      track('tool_input', { source: 'github' });
    } catch (caught) {
      const code = caught instanceof GithubError ? caught.code : 'network';
      setError(code);
      track('tool_error', { source: 'github', error_type: code });
    } finally {
      setLoading(false);
    }
  }

  function toggle(set: Set<string>, key: string, apply: (next: Set<string>) => void): void {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    apply(next);
  }

  function add(): void {
    if (!result) return;
    const patch: Partial<Resume> = {};

    const newSkills = result.languages
      .filter((entry) => languages.has(entry.language) && !known.has(entry.language.toLowerCase()))
      .map((entry) => ({ ...emptySkill('言語'), name: entry.language }));
    if (newSkills.length > 0) patch.skills = [...resume.skills, ...newSkills];

    const projects = result.repos.filter((repo) => repos.has(repo.name)).map(repoToProject);
    if (projects.length > 0) {
      const existing = resume.companies.find((company) => company.name.trim() === PERSONAL);
      patch.companies = existing
        ? resume.companies.map((company) =>
            company === existing ? { ...company, projects: [...company.projects, ...projects] } : company,
          )
        : [...resume.companies, { ...emptyCompany(), name: PERSONAL, projects }];
    }

    onChange(patch);
    setResult(null);
  }

  return (
    <details className="github">
      <summary>GitHub から下書きする</summary>
      <p className="muted note">公開リポジトリの言語と主なリポジトリを api.github.com から取得します。選んだものだけ追加されます。</p>
      <form className="inline" onSubmit={(event) => void load(event)}>
        <input
          aria-label="GitHub ユーザー名"
          placeholder="username"
          autoComplete="off"
          spellCheck={false}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <button type="submit" disabled={loading || !username.trim()}>
          {loading ? '取得中…' : '取得'}
        </button>
      </form>
      {error && <p className="note">{ERROR_MESSAGES[error]}</p>}
      {result && (
        <div className="picks">
          {result.languages.length === 0 && result.repos.length === 0 && <p className="muted">公開リポジトリがありません。</p>}
          {result.languages.length > 0 && (
            <fieldset>
              <legend>スキル（言語）に追加</legend>
              {result.languages.map((entry) => {
                const already = known.has(entry.language.toLowerCase());
                return (
                  <label key={entry.language}>
                    <input
                      type="checkbox"
                      disabled={already}
                      checked={!already && languages.has(entry.language)}
                      onChange={() => toggle(languages, entry.language, setLanguages)}
                    />
                    {entry.language}
                    <span className="muted">
                      {' '}
                      {entry.repos} repo{entry.repos > 1 ? 's' : ''}
                      {already && ' · 追加済み'}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}
          {result.repos.length > 0 && (
            <fieldset>
              <legend>「{PERSONAL}」のプロジェクトに追加</legend>
              {result.repos.map((repo) => (
                <label key={repo.name}>
                  <input type="checkbox" checked={repos.has(repo.name)} onChange={() => toggle(repos, repo.name, setRepos)} />
                  {repo.name}
                  <span className="muted">
                    {repo.language && ` ${repo.language}`}
                    {repo.stargazers_count > 0 && ` ★${repo.stargazers_count}`}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="actions">
            <button type="button" onClick={add} disabled={languages.size === 0 && repos.size === 0}>
              選んだものを追加
            </button>
            <button type="button" className="ghost" onClick={() => setResult(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </details>
  );
}
