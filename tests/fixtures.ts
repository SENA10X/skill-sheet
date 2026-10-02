import { Resume, emptyResume, emptyStack } from '../web/src/model';
import type { Repo } from '../web/src/github';

export const TODAY = '2026-10-02';

export function sampleResume(): Resume {
  return {
    ...emptyResume(TODAY),
    profile: {
      ...emptyResume(TODAY).profile,
      name: '山田 太郎',
      kana: 'やまだ たろう',
      birthday: '1995-10-03',
    },
    education: [{ id: 'e1', date: '2014-04', text: '〇〇大学 工学部 入学' }],
    work: [{ id: 'w1', date: '2018-04', text: '株式会社サンプル 入社' }],
    licenses: [
      { id: 'l1', date: '2017-10', text: '基本情報技術者試験 合格' },
      { id: 'l2', date: '', text: '  ' },
    ],
    summary: 'Web サービスのバックエンド開発に従事。',
    companies: [
      {
        id: 'c1',
        name: '株式会社サンプル',
        start: '2018-04',
        end: '',
        business: 'SaaS の開発',
        employment: '正社員',
        projects: [
          {
            id: 'p1',
            start: '2023-04',
            end: '2024-06',
            title: '決済基盤の刷新',
            role: 'リーダー',
            teamSize: '5名',
            phases: ['基本設計', '実装'],
            stack: { ...emptyStack(), languages: 'TypeScript, Go', databases: 'PostgreSQL' },
            description: 'API の再設計。',
            achievements: '',
          },
        ],
      },
    ],
    skills: [
      { id: 's1', category: '言語', name: 'TypeScript', years: '5', level: 4 },
      { id: 's2', category: 'ツール', name: 'Git | GitHub', years: '', level: 0 },
      { id: 's3', category: 'その他', name: '', years: '1', level: 1 },
    ],
    pr: '',
    links: 'https://github.com/example\n\n',
  };
}

export function repo(overrides: Partial<Repo>): Repo {
  return {
    name: 'repo',
    html_url: 'https://github.com/example/repo',
    description: null,
    language: 'TypeScript',
    fork: false,
    archived: false,
    stargazers_count: 0,
    created_at: '2025-01-10T00:00:00Z',
    pushed_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}
