/**
 * The 履歴書 on two A4 pages, laid out after the MHLW 様式例 (2021): personal
 * details and 学歴・職歴 on the first page; the rest of 学歴・職歴, 免許・資格,
 * 志望動機 and 本人希望 on the second. Empty rows are drawn so it reads like
 * the paper form.
 */
import { ageOn, formatDate, monthParts } from '../dates';
import { Era, HistoryRow, Resume } from '../model';

/** Table rows that fit on page 1 under the personal details. */
const PAGE1_ROWS = 20;
/** Minimum rows of each table on page 2, so the form keeps its shape. */
const PAGE2_MIN_ROWS = 6;

interface Line {
  year: string;
  month: string;
  text: string;
  align?: 'center' | 'end';
}

function toLines(rows: HistoryRow[], era: Era): Line[] {
  return rows
    .filter((row) => row.date || row.text.trim())
    .map((row) => ({ ...monthParts(row.date, era), text: row.text.trim() }));
}

/** 学歴 and 職歴 as one list, with the centred headings and the closing 以上. */
export function historyLines(resume: Resume): Line[] {
  const education = toLines(resume.education, resume.era);
  const work = toLines(resume.work, resume.era);
  const lines: Line[] = [];
  if (education.length > 0) lines.push({ year: '', month: '', text: '学歴', align: 'center' }, ...education);
  if (work.length > 0) lines.push({ year: '', month: '', text: '職歴', align: 'center' }, ...work);
  if (lines.length > 0) lines.push({ year: '', month: '', text: '以上', align: 'end' });
  return lines;
}

function pad(lines: Line[], count: number): Line[] {
  const blank: Line = { year: '', month: '', text: '' };
  return [...lines, ...Array.from({ length: Math.max(0, count - lines.length) }, () => blank)];
}

function DatedTable({ heading, lines }: { heading: string; lines: Line[] }) {
  return (
    <table className="dated">
      <colgroup>
        <col className="year" />
        <col className="month" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th>年</th>
          <th>月</th>
          <th>{heading}</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <tr key={index}>
            <td className="num">{line.year}</td>
            <td className="num">{line.month}</td>
            <td className={line.align}>{line.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Rirekisho({ resume }: { resume: Resume }) {
  const { profile, era } = resume;
  const created = formatDate(resume.createdOn, era);
  const birthday = formatDate(profile.birthday, era);
  const age = ageOn(profile.birthday, resume.createdOn);

  const lines = historyLines(resume);
  const first = lines.slice(0, PAGE1_ROWS);
  const rest = lines.slice(PAGE1_ROWS);
  const licenses = toLines(resume.licenses, era);

  return (
    <>
      <article className="paper rirekisho">
        <div className="head">
          <div className="identity">
            <div className="title-row">
              <h1>履 歴 書</h1>
              <p>{created ? `${created}現在` : '年　　月　　日現在'}</p>
            </div>
            <table className="person">
              <tbody>
                <tr className="kana">
                  <th>ふりがな</th>
                  <td colSpan={3}>{profile.kana}</td>
                </tr>
                <tr className="name">
                  <th>{'氏　　名'}</th>
                  <td colSpan={3}>{profile.name}</td>
                </tr>
                <tr>
                  <th>生年月日</th>
                  <td>
                    {birthday ? `${birthday}生` : '年　　月　　日生'}
                    {'　'}（満 {age ?? '　'} 歳）
                  </td>
                  <th className="narrow">性別</th>
                  <td className="gender">{profile.gender}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="photo">
            {profile.photo ? (
              <img src={profile.photo} alt="証明写真" />
            ) : (
              <span>
                写真をはる位置
                <br />
                縦 36〜40mm
                <br />
                横 24〜30mm
              </span>
            )}
          </div>
        </div>

        <table className="address">
          <colgroup>
            <col className="label" />
            <col />
            <col className="contact" />
          </colgroup>
          <tbody>
            <tr className="kana">
              <th>ふりがな</th>
              <td>{profile.addressKana}</td>
              <td className="small">
                <span className="label">電話</span> {profile.phone}
              </td>
            </tr>
            <tr className="tall">
              <th>現住所</th>
              <td>
                〒{profile.postalCode}
                <br />
                {profile.address}
              </td>
              <td className="small">
                <span className="label">E-mail</span>
                <br />
                <span className="break">{profile.email}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <DatedTable heading="学歴・職歴（各別にまとめて書く）" lines={pad(first, PAGE1_ROWS)} />
      </article>

      <article className="paper rirekisho">
        <DatedTable heading="学歴・職歴（各別にまとめて書く）" lines={pad(rest, PAGE2_MIN_ROWS)} />
        <DatedTable heading="免許・資格" lines={pad(licenses, PAGE2_MIN_ROWS)} />
        <div className="box motivation">
          <h2>志望の動機、特技、好きな学科、アピールポイントなど</h2>
          <p>{resume.motivation}</p>
        </div>
        <div className="box request">
          <h2>本人希望記入欄（特に給料・職種・勤務時間・勤務地・その他についての希望などがあれば記入）</h2>
          <p>{resume.request}</p>
        </div>
      </article>
    </>
  );
}
