import { describe, expect, it } from 'vitest';
import { emptyResume } from '../web/src/model';
import { historyLines } from '../web/src/preview/Rirekisho';
import { TODAY, sampleResume } from './fixtures';

describe('historyLines', () => {
  it('heads 学歴 and 職歴 and closes with 以上', () => {
    expect(historyLines(sampleResume()).map((line) => line.text)).toEqual([
      '学歴',
      '〇〇大学 工学部 入学',
      '職歴',
      '株式会社サンプル 入社',
      '以上',
    ]);
  });

  it('writes years in the chosen era', () => {
    const line = historyLines({ ...sampleResume(), era: 'japanese' })[1];
    expect(line).toMatchObject({ year: '平成26', month: '4' });
  });

  it('is empty when nothing is entered', () => {
    expect(historyLines(emptyResume(TODAY))).toEqual([]);
  });
});
