/**
 * Reading a Resume back from JSON.
 *
 * Saved data comes from older versions of the tool, hand-edited files and
 * localStorage, so nothing is trusted: every field is checked and anything
 * missing or of the wrong type falls back to its empty value. A file is only
 * rejected when it is not JSON or not an object at all.
 */
import {
  Company,
  HistoryRow,
  LEVEL_LABELS,
  PHASES,
  Phase,
  Profile,
  Project,
  Resume,
  SCHEMA_VERSION,
  SKILL_CATEGORIES,
  Skill,
  SkillCategory,
  Stack,
  emptyProfile,
  emptyStack,
  makeId,
} from './model';

export class ImportError extends Error {
  constructor(readonly code: 'not-json' | 'not-object') {
    super(code);
  }
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function list<T>(value: unknown, read: (item: Json) => T): T[] {
  return Array.isArray(value) ? value.filter(isObject).map(read) : [];
}

function id(value: unknown): string {
  return text(value) || makeId();
}

function readProfile(value: unknown): Profile {
  const source = isObject(value) ? value : {};
  const profile = emptyProfile();
  for (const key of Object.keys(profile) as (keyof Profile)[]) {
    profile[key] = text(source[key]);
  }
  // Only an embedded image is kept; a URL would be fetched when rendered.
  if (!profile.photo.startsWith('data:image/')) profile.photo = '';
  return profile;
}

function readRow(item: Json): HistoryRow {
  return { id: id(item.id), date: text(item.date), text: text(item.text) };
}

function readStack(value: unknown): Stack {
  const source = isObject(value) ? value : {};
  const stack = emptyStack();
  for (const key of Object.keys(stack) as (keyof Stack)[]) {
    stack[key] = text(source[key]);
  }
  return stack;
}

function readProject(item: Json): Project {
  const phases = Array.isArray(item.phases) ? item.phases : [];
  return {
    id: id(item.id),
    start: text(item.start),
    end: text(item.end),
    title: text(item.title),
    role: text(item.role),
    teamSize: text(item.teamSize),
    // Kept in the canonical order, whatever order the file lists them in.
    phases: PHASES.filter((phase: Phase) => phases.includes(phase)),
    stack: readStack(item.stack),
    description: text(item.description),
    achievements: text(item.achievements),
  };
}

function readCompany(item: Json): Company {
  return {
    id: id(item.id),
    name: text(item.name),
    start: text(item.start),
    end: text(item.end),
    business: text(item.business),
    employment: text(item.employment),
    projects: list(item.projects, readProject),
  };
}

function readSkill(item: Json): Skill {
  const category = SKILL_CATEGORIES.includes(item.category as SkillCategory)
    ? (item.category as SkillCategory)
    : 'その他';
  const level = typeof item.level === 'number' && Number.isInteger(item.level) ? item.level : 0;
  return {
    id: id(item.id),
    category,
    name: text(item.name),
    years: text(item.years),
    level: level >= 0 && level < LEVEL_LABELS.length ? level : 0,
  };
}

/** Builds a valid Resume from anything shaped roughly like one. */
export function normalizeResume(value: unknown, createdOn: string): Resume {
  if (!isObject(value)) throw new ImportError('not-object');
  return {
    version: SCHEMA_VERSION,
    createdOn: text(value.createdOn) || createdOn,
    era: value.era === 'japanese' ? 'japanese' : 'western',
    profile: readProfile(value.profile),
    education: list(value.education, readRow),
    work: list(value.work, readRow),
    licenses: list(value.licenses, readRow),
    motivation: text(value.motivation),
    request: text(value.request),
    summary: text(value.summary),
    companies: list(value.companies, readCompany),
    skills: list(value.skills, readSkill),
    pr: text(value.pr),
    links: text(value.links),
  };
}

export function parseResume(json: string, createdOn: string): Resume {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ImportError('not-json');
  }
  return normalizeResume(value, createdOn);
}

export function serializeResume(resume: Resume): string {
  return `${JSON.stringify(resume, null, 2)}\n`;
}
