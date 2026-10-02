import { describe, expect, it } from 'vitest';
import { toMarkdown } from '../web/src/markdown';
import { emptyResume } from '../web/src/model';
import { TODAY, sampleResume } from './fixtures';

describe('toMarkdown', () => {
  it('renders every filled section', () => {
    expect(toMarkdown(sampleResume(), TODAY)).toBe(
      [
        '# 職務経歴書',
        '',
        '2026年10月2日現在  ',
        '氏名: 山田 太郎',
        '',
        '## 職務要約',
        '',
        'Web サービスのバックエンド開発に従事。',
        '',
        '## 職務経歴',
        '',
        '### 株式会社サンプル 2018/04 〜 現在（8年7ヶ月）',
        '',
        '事業内容: SaaS の開発 / 雇用形態: 正社員',
        '',
        '#### 決済基盤の刷新 2023/04 〜 2024/06（1年3ヶ月）',
        '',
        '- 役割: リーダー',
        '- チーム規模: 5名',
        '- 担当工程: 基本設計 / 実装',
        '- 言語: TypeScript, Go',
        '- DB: PostgreSQL',
        '',
        '**業務内容**',
        '',
        'API の再設計。',
        '',
        '## テクニカルスキル',
        '',
        '| 分類 | スキル | 経験年数 | レベル |',
        '| --- | --- | --- | --- |',
        '| 言語 | TypeScript | 5年 | 4 指導・設計可 |',
        '| ツール | Git \\| GitHub |  |  |',
        '',
        '## 資格',
        '',
        '- 2017年10月 基本情報技術者試験 合格',
        '',
        '## リンク',
        '',
        '- https://github.com/example',
        '',
      ].join('\n'),
    );
  });

  it('leaves out empty sections', () => {
    expect(toMarkdown({ ...emptyResume(TODAY), createdOn: '' }, TODAY)).toBe('# 職務経歴書\n');
  });

  it('writes the date in the chosen era', () => {
    expect(toMarkdown({ ...emptyResume(TODAY), era: 'japanese' }, TODAY)).toContain('令和8年10月2日現在');
  });
});
