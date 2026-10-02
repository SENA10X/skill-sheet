import { describe, expect, it } from 'vitest';
import { ImportError, normalizeResume, parseResume, serializeResume } from '../web/src/io';
import { emptyResume } from '../web/src/model';
import { TODAY, sampleResume } from './fixtures';

describe('parseResume', () => {
  it('round-trips an exported document unchanged', () => {
    const resume = sampleResume();
    expect(parseResume(serializeResume(resume), TODAY)).toEqual(resume);
  });

  it('fills in everything missing from an empty object', () => {
    expect(parseResume('{}', TODAY)).toEqual(emptyResume(TODAY));
  });

  it('rejects text that is not JSON', () => {
    expect(() => parseResume('{not json', TODAY)).toThrow(ImportError);
    try {
      parseResume('{not json', TODAY);
    } catch (error) {
      expect((error as ImportError).code).toBe('not-json');
    }
  });

  it('rejects JSON that is not an object', () => {
    for (const json of ['[]', 'null', '"text"', '3']) {
      expect(() => parseResume(json, TODAY), json).toThrow(ImportError);
    }
  });
});

describe('normalizeResume', () => {
  it('replaces fields of the wrong type with empty values', () => {
    const resume = normalizeResume(
      {
        era: 'mars',
        profile: { name: 42, kana: 'かな' },
        education: 'none',
        work: [null, 'row', { date: '2020-04', text: '入社' }],
        skills: [{ name: 'Go', category: 'Unknown', level: 9 }],
      },
      TODAY,
    );
    expect(resume.era).toBe('western');
    expect(resume.profile.name).toBe('');
    expect(resume.profile.kana).toBe('かな');
    expect(resume.education).toEqual([]);
    expect(resume.work).toHaveLength(1);
    expect(resume.work[0]).toMatchObject({ date: '2020-04', text: '入社' });
    expect(resume.work[0].id).toBeTruthy();
    expect(resume.skills[0]).toMatchObject({ name: 'Go', category: 'その他', level: 0 });
  });

  it('keeps only known phases, in their usual order', () => {
    const resume = normalizeResume({ companies: [{ projects: [{ phases: ['テスト', 'hack', '実装'] }] }] }, TODAY);
    expect(resume.companies[0].projects[0].phases).toEqual(['実装', 'テスト']);
  });

  it('drops a photo that is not an embedded image', () => {
    expect(normalizeResume({ profile: { photo: 'https://example.com/me.jpg' } }, TODAY).profile.photo).toBe('');
    expect(normalizeResume({ profile: { photo: 'data:image/jpeg;base64,AAAA' } }, TODAY).profile.photo).toBe(
      'data:image/jpeg;base64,AAAA',
    );
  });
});
