/**
 * Date helpers for Japanese resumes.
 *
 * Everything works on the plain strings the inputs hold ('YYYY-MM-DD' and
 * 'YYYY-MM') and never goes through Date parsing, so no time zone can shift a
 * birthday or a month by one.
 */
import type { Era } from './model';

interface YMD {
  y: number;
  m: number;
  d: number;
}

/** Start date of each era, newest first. */
const ERAS: { name: string; start: YMD }[] = [
  { name: '令和', start: { y: 2019, m: 5, d: 1 } },
  { name: '平成', start: { y: 1989, m: 1, d: 8 } },
  { name: '昭和', start: { y: 1926, m: 12, d: 25 } },
  { name: '大正', start: { y: 1912, m: 7, d: 30 } },
];

function compare(a: YMD, b: YMD): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

export function parseDate(value: string): YMD | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/** Accepts 'YYYY-MM' and, for convenience, a full 'YYYY-MM-DD'. */
export function parseMonth(value: string): { y: number; m: number } | null {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value);
  if (!match) return null;
  const [y, m] = [Number(match[1]), Number(match[2])];
  if (m < 1 || m > 12) return null;
  return { y, m };
}

/**
 * Reads the ways people type a month — '2024/4', '2024.04', '202404',
 * '2024年4月' — as 'YYYY-MM'. Returns null when it is not a month.
 */
export function normalizeMonth(input: string): string | null {
  const text = input.trim().replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  const match = /^(\d{4})\s*(?:[-/.年]\s*(\d{1,2})\s*月?|(\d{2}))$/.exec(text);
  if (!match) return null;
  const month = Number(match[2] ?? match[3]);
  if (month < 1 || month > 12) return null;
  return `${match[1]}-${String(month).padStart(2, '0')}`;
}

/** Local calendar date as 'YYYY-MM-DD'. */
export function todayISO(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 満年齢 on a given day; the birthday itself counts as the new age. */
export function ageOn(birthday: string, on: string): number | null {
  const birth = parseDate(birthday);
  const day = parseDate(on);
  if (!birth || !day || compare(day, birth) < 0) return null;
  const hadBirthday = day.m > birth.m || (day.m === birth.m && day.d >= birth.d);
  return day.y - birth.y - (hadBirthday ? 0 : 1);
}

/** '2024' or '令和6'. The first year of an era is written 元. */
export function formatYear(date: YMD, era: Era): string {
  if (era === 'western') return String(date.y);
  const current = ERAS.find((entry) => compare(date, entry.start) >= 0);
  if (!current) return String(date.y);
  const year = date.y - current.start.y + 1;
  return `${current.name}${year === 1 ? '元' : year}`;
}

/** '2026年10月2日' or '令和8年10月2日'; '' when unset. */
export function formatDate(value: string, era: Era): string {
  const date = parseDate(value);
  if (!date) return '';
  return `${formatYear(date, era)}年${date.m}月${date.d}日`;
}

/**
 * The 年 and 月 cells of a 学歴・職歴 row. A month is placed in its era by
 * its first day, so 2019-04 is 平成31 and 2019-05 is 令和元.
 */
export function monthParts(value: string, era: Era): { year: string; month: string } {
  const month = parseMonth(value);
  if (!month) return { year: '', month: '' };
  return { year: formatYear({ ...month, d: 1 }, era), month: String(month.m) };
}

/** '2024年4月' or '令和6年4月'; '' when unset. */
export function formatMonth(value: string, era: Era): string {
  const { year, month } = monthParts(value, era);
  return year ? `${year}年${month}月` : '';
}

/**
 * Length of a period in months, counting both ends: 2023-04 to 2023-06 is
 * three months. An empty end means it is still running as of `today`.
 */
export function monthsBetween(start: string, end: string, today: string): number | null {
  const from = parseMonth(start);
  const to = parseMonth(end || today);
  if (!from || !to) return null;
  const months = (to.y - from.y) * 12 + (to.m - from.m) + 1;
  return months > 0 ? months : null;
}

/** '1年3ヶ月', '8ヶ月', '2年'. */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest}ヶ月`;
  return rest === 0 ? `${years}年` : `${years}年${rest}ヶ月`;
}

function slashMonth(value: string): string {
  const month = parseMonth(value);
  return month ? `${month.y}/${String(month.m).padStart(2, '0')}` : '';
}

/**
 * A period split for display: from '2023/04', to '2024/06' or '現在', and its
 * length such as '1年3ヶ月' ('' when the end is before the start). Null
 * without a start.
 */
export function periodParts(start: string, end: string, today: string): { from: string; to: string; length: string } | null {
  const from = slashMonth(start);
  if (!from) return null;
  const months = monthsBetween(start, end, today);
  return { from, to: slashMonth(end) || '現在', length: months ? formatDuration(months) : '' };
}

/** '2023/04 〜 2024/06', or '2023/04 〜 現在' while running; '' without a start. */
export function formatPeriod(start: string, end: string): string {
  const from = slashMonth(start);
  if (!from) return '';
  return `${from} 〜 ${slashMonth(end) || '現在'}`;
}

/** Period plus its length, as written in a 職務経歴書 heading. */
export function formatPeriodWithLength(start: string, end: string, today: string): string {
  const parts = periodParts(start, end, today);
  if (!parts) return '';
  const period = `${parts.from} 〜 ${parts.to}`;
  return parts.length ? `${period}（${parts.length}）` : period;
}
