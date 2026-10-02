/**
 * The one document both sheets are rendered from.
 *
 * The 履歴書 and the 職務経歴書 share the person and the licenses, so they are
 * fields of one record rather than two documents that could drift apart.
 * Dates are kept as the strings the inputs produce: 'YYYY-MM-DD' for days,
 * 'YYYY-MM' for months, '' for unset.
 */
export const SCHEMA_VERSION = 1;

export type DocKind = 'rirekisho' | 'shokumu';

export type Era = 'western' | 'japanese';

export interface Profile {
  name: string;
  kana: string;
  birthday: string;
  gender: string;
  postalCode: string;
  address: string;
  addressKana: string;
  phone: string;
  email: string;
  /** A small JPEG data URL, or ''. */
  photo: string;
}

/** One dated line of 学歴, 職歴 or 免許・資格. */
export interface HistoryRow {
  id: string;
  date: string;
  text: string;
}

export const PHASES = ['要件定義', '基本設計', '詳細設計', '実装', 'テスト', '運用保守'] as const;

export type Phase = (typeof PHASES)[number];

export interface Stack {
  languages: string;
  frameworks: string;
  databases: string;
  infra: string;
  tools: string;
}

export const STACK_LABELS: Record<keyof Stack, string> = {
  languages: '言語',
  frameworks: 'FW・ライブラリ',
  databases: 'DB',
  infra: 'インフラ・クラウド',
  tools: 'ツール',
};

export interface Project {
  id: string;
  start: string;
  /** '' while the project is still running. */
  end: string;
  title: string;
  role: string;
  teamSize: string;
  phases: Phase[];
  stack: Stack;
  description: string;
  achievements: string;
}

export interface Company {
  id: string;
  name: string;
  start: string;
  end: string;
  business: string;
  employment: string;
  projects: Project[];
}

export const SKILL_CATEGORIES = ['言語', 'FW・ライブラリ', 'DB', 'インフラ・クラウド', 'ツール', 'その他'] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** 0 means "not rated"; 1–5 follow LEVEL_LABELS. */
export const LEVEL_LABELS = ['', '学習中', '指導の下で対応可', '一人で対応可', '指導・設計可', '専門'] as const;

export interface Skill {
  id: string;
  category: SkillCategory;
  name: string;
  years: string;
  level: number;
}

export interface Resume {
  version: typeof SCHEMA_VERSION;
  createdOn: string;
  era: Era;
  profile: Profile;
  education: HistoryRow[];
  work: HistoryRow[];
  licenses: HistoryRow[];
  motivation: string;
  request: string;
  summary: string;
  companies: Company[];
  skills: Skill[];
  pr: string;
  /** One URL per line. */
  links: string;
}

/** Ids only have to be unique within one document. */
export function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyProfile(): Profile {
  return {
    name: '',
    kana: '',
    birthday: '',
    gender: '',
    postalCode: '',
    address: '',
    addressKana: '',
    phone: '',
    email: '',
    photo: '',
  };
}

export function emptyRow(): HistoryRow {
  return { id: makeId(), date: '', text: '' };
}

export function emptyStack(): Stack {
  return { languages: '', frameworks: '', databases: '', infra: '', tools: '' };
}

export function emptyProject(): Project {
  return {
    id: makeId(),
    start: '',
    end: '',
    title: '',
    role: '',
    teamSize: '',
    phases: [],
    stack: emptyStack(),
    description: '',
    achievements: '',
  };
}

export function emptyCompany(): Company {
  return { id: makeId(), name: '', start: '', end: '', business: '', employment: '', projects: [] };
}

export function emptySkill(category: SkillCategory = '言語'): Skill {
  return { id: makeId(), category, name: '', years: '', level: 0 };
}

export function emptyResume(createdOn: string): Resume {
  return {
    version: SCHEMA_VERSION,
    createdOn,
    era: 'western',
    profile: emptyProfile(),
    education: [],
    work: [],
    licenses: [],
    motivation: '',
    request: '',
    summary: '',
    companies: [],
    skills: [],
    pr: '',
    links: '',
  };
}
