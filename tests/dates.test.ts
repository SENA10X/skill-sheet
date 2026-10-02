import { describe, expect, it } from 'vitest';
import {
  ageOn,
  formatDate,
  formatDuration,
  formatMonth,
  formatPeriod,
  formatPeriodWithLength,
  monthParts,
  monthsBetween,
  normalizeMonth,
  todayISO,
} from '../web/src/dates';

describe('ageOn', () => {
  it('turns a year older on the birthday itself', () => {
    expect(ageOn('1995-10-03', '2026-10-02')).toBe(30);
    expect(ageOn('1995-10-03', '2026-10-03')).toBe(31);
  });

  it('handles a 29 February birthday', () => {
    expect(ageOn('2000-02-29', '2026-02-28')).toBe(25);
    expect(ageOn('2000-02-29', '2026-03-01')).toBe(26);
  });

  it('is null for missing or future birthdays', () => {
    expect(ageOn('', '2026-10-02')).toBeNull();
    expect(ageOn('2030-01-01', '2026-10-02')).toBeNull();
  });
});

describe('Japanese era', () => {
  it('switches from 平成 to 令和 on 2019-05-01', () => {
    expect(formatDate('2019-04-30', 'japanese')).toBe('平成31年4月30日');
    expect(formatDate('2019-05-01', 'japanese')).toBe('令和元年5月1日');
    expect(formatDate('2026-10-02', 'japanese')).toBe('令和8年10月2日');
  });

  it('switches from 昭和 to 平成 on 1989-01-08', () => {
    expect(formatDate('1989-01-07', 'japanese')).toBe('昭和64年1月7日');
    expect(formatDate('1989-01-08', 'japanese')).toBe('平成元年1月8日');
  });

  it('places a month in the era of its first day', () => {
    expect(monthParts('2019-04', 'japanese')).toEqual({ year: '平成31', month: '4' });
    expect(monthParts('2019-05', 'japanese')).toEqual({ year: '令和元', month: '5' });
    expect(formatMonth('2024-04', 'western')).toBe('2024年4月');
  });

  it('leaves unset dates empty', () => {
    expect(formatDate('', 'japanese')).toBe('');
    expect(monthParts('', 'western')).toEqual({ year: '', month: '' });
  });
});

describe('normalizeMonth', () => {
  it('reads the usual ways of typing a month', () => {
    for (const input of ['2024-04', '2024-4', '2024/4', '2024.04', '202404', '2024年4月', '２０２４/４']) {
      expect(normalizeMonth(input), input).toBe('2024-04');
    }
  });

  it('rejects anything else', () => {
    for (const input of ['', '2024', '2024-13', '24/4', 'April']) {
      expect(normalizeMonth(input), input).toBeNull();
    }
  });
});

describe('periods', () => {
  it('counts both the first and the last month', () => {
    expect(monthsBetween('2023-04', '2023-06', '2026-10-02')).toBe(3);
    expect(monthsBetween('2023-04', '2024-06', '2026-10-02')).toBe(15);
  });

  it('runs to today when there is no end', () => {
    expect(monthsBetween('2026-01', '', '2026-10-02')).toBe(10);
  });

  it('is null for a missing start or an end before the start', () => {
    expect(monthsBetween('', '2024-01', '2026-10-02')).toBeNull();
    expect(monthsBetween('2024-05', '2024-01', '2026-10-02')).toBeNull();
  });

  it('writes durations in years and months', () => {
    expect(formatDuration(8)).toBe('8ヶ月');
    expect(formatDuration(12)).toBe('1年');
    expect(formatDuration(15)).toBe('1年3ヶ月');
  });

  it('formats a period with its length', () => {
    expect(formatPeriod('2023-04', '')).toBe('2023/04 〜 現在');
    expect(formatPeriodWithLength('2023-04', '2024-06', '2026-10-02')).toBe('2023/04 〜 2024/06（1年3ヶ月）');
    expect(formatPeriodWithLength('', '2024-06', '2026-10-02')).toBe('');
  });
});

describe('todayISO', () => {
  it('uses the local calendar date', () => {
    expect(todayISO(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02');
  });
});
