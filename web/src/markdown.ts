/**
 * The 職務経歴書 as Markdown, for GitHub, Qiita or a recruiter's form.
 *
 * Sections without content are left out entirely rather than printed as an
 * empty heading.
 */
import { formatDate, formatMonth, formatPeriodWithLength } from './dates';
import { LEVEL_LABELS, Project, Resume, STACK_LABELS, Stack } from './model';

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();
}

function block(value: string): string {
  return value.trim().replace(/\n{3,}/g, '\n\n');
}

function projectLines(project: Project, today: string): string[] {
  const heading = [project.title.trim() || '（案件名未入力）'];
  const period = formatPeriodWithLength(project.start, project.end, today);
  if (period) heading.push(period);

  const lines = [`#### ${heading.join(' ')}`, ''];
  const facts: string[] = [];
  if (project.role.trim()) facts.push(`- 役割: ${project.role.trim()}`);
  if (project.teamSize.trim()) facts.push(`- チーム規模: ${project.teamSize.trim()}`);
  if (project.phases.length > 0) facts.push(`- 担当工程: ${project.phases.join(' / ')}`);
  for (const key of Object.keys(STACK_LABELS) as (keyof Stack)[]) {
    if (project.stack[key].trim()) facts.push(`- ${STACK_LABELS[key]}: ${project.stack[key].trim()}`);
  }
  if (facts.length > 0) lines.push(...facts, '');
  if (project.description.trim()) lines.push('**業務内容**', '', block(project.description), '');
  if (project.achievements.trim()) lines.push('**成果・工夫**', '', block(project.achievements), '');
  return lines;
}

export function toMarkdown(resume: Resume, today: string): string {
  const lines: string[] = ['# 職務経歴書', ''];

  const meta: string[] = [];
  const date = formatDate(resume.createdOn, resume.era);
  if (date) meta.push(`${date}現在`);
  if (resume.profile.name.trim()) meta.push(`氏名: ${resume.profile.name.trim()}`);
  if (meta.length > 0) lines.push(meta.join('  \n'), '');

  if (resume.summary.trim()) lines.push('## 職務要約', '', block(resume.summary), '');

  if (resume.companies.length > 0) {
    lines.push('## 職務経歴', '');
    for (const company of resume.companies) {
      const heading = [company.name.trim() || '（会社名未入力）'];
      const period = formatPeriodWithLength(company.start, company.end, today);
      if (period) heading.push(period);
      lines.push(`### ${heading.join(' ')}`, '');
      const facts: string[] = [];
      if (company.business.trim()) facts.push(`事業内容: ${company.business.trim()}`);
      if (company.employment.trim()) facts.push(`雇用形態: ${company.employment.trim()}`);
      if (facts.length > 0) lines.push(facts.join(' / '), '');
      for (const project of company.projects) lines.push(...projectLines(project, today));
    }
  }

  const skills = resume.skills.filter((skill) => skill.name.trim());
  if (skills.length > 0) {
    lines.push('## テクニカルスキル', '', '| 分類 | スキル | 経験年数 | レベル |', '| --- | --- | --- | --- |');
    for (const skill of skills) {
      const years = skill.years.trim() ? `${cell(skill.years)}年` : '';
      const level = skill.level > 0 ? `${skill.level} ${LEVEL_LABELS[skill.level]}` : '';
      lines.push(`| ${skill.category} | ${cell(skill.name)} | ${years} | ${level} |`);
    }
    lines.push('');
  }

  const licenses = resume.licenses.filter((row) => row.text.trim());
  if (licenses.length > 0) {
    lines.push('## 資格', '');
    for (const row of licenses) {
      const when = formatMonth(row.date, resume.era);
      lines.push(`- ${when ? `${when} ` : ''}${row.text.trim()}`);
    }
    lines.push('');
  }

  if (resume.pr.trim()) lines.push('## 自己PR', '', block(resume.pr), '');

  const links = resume.links
    .split('\n')
    .map((link) => link.trim())
    .filter(Boolean);
  if (links.length > 0) lines.push('## リンク', '', ...links.map((link) => `- ${link}`), '');

  return `${lines.join('\n').trimEnd()}\n`;
}
