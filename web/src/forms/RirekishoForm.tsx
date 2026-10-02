import { useRef, useState } from 'react';
import { track } from '../analytics';
import { ageOn } from '../dates';
import { readPhoto } from '../files';
import { Profile, Resume } from '../model';
import { Field, RowsEditor, Section, TextField } from './fields';

interface Props {
  resume: Resume;
  onChange: (patch: Partial<Resume>) => void;
}

export function RirekishoForm({ resume, onChange }: Props) {
  const { profile } = resume;
  const photoInput = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState(false);

  function setProfile(patch: Partial<Profile>): void {
    onChange({ profile: { ...profile, ...patch } });
  }

  async function choosePhoto(file: File | undefined): Promise<void> {
    if (!file) return;
    try {
      setProfile({ photo: await readPhoto(file) });
      setPhotoError(false);
      track('tool_input', { source: 'photo' });
    } catch {
      setPhotoError(true);
      track('tool_error', { source: 'photo', error_type: 'unreadable' });
    }
  }

  const age = ageOn(profile.birthday, resume.createdOn);

  return (
    <>
      <Section title="基本情報">
        <div className="grid">
          <Field label="氏名" value={profile.name} onChange={(name) => setProfile({ name })} placeholder="山田 太郎" />
          <Field label="ふりがな" value={profile.kana} onChange={(kana) => setProfile({ kana })} placeholder="やまだ たろう" />
          <label className="field">
            <span>生年月日{age !== null && <span className="muted">（満 {age} 歳）</span>}</span>
            <input type="date" value={profile.birthday} onChange={(event) => setProfile({ birthday: event.target.value })} />
          </label>
          <Field label="性別（任意）" value={profile.gender} onChange={(gender) => setProfile({ gender })} />
          <Field label="郵便番号" value={profile.postalCode} onChange={(postalCode) => setProfile({ postalCode })} placeholder="100-0001" />
          <Field label="電話" type="tel" value={profile.phone} onChange={(phone) => setProfile({ phone })} />
          <Field label="現住所" wide value={profile.address} onChange={(address) => setProfile({ address })} />
          <Field label="現住所（ふりがな）" wide value={profile.addressKana} onChange={(addressKana) => setProfile({ addressKana })} />
          <Field label="メール" type="email" wide value={profile.email} onChange={(email) => setProfile({ email })} />
        </div>
        <div className="photo-row">
          <span className="muted">写真</span>
          <button type="button" onClick={() => photoInput.current?.click()}>
            {profile.photo ? '写真を変更' : '写真を選択'}
          </button>
          {profile.photo && (
            <button type="button" className="ghost" onClick={() => setProfile({ photo: '' })}>
              写真を外す
            </button>
          )}
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              void choosePhoto(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </div>
        {photoError && <p className="note">画像を読み込めませんでした。</p>}
      </Section>

      <Section title="学歴" note="例: 〇〇高等学校 卒業 / 〇〇大学 工学部 情報工学科 入学">
        <RowsEditor
          rows={resume.education}
          onChange={(education) => onChange({ education })}
          placeholder="〇〇大学 工学部 情報工学科 卒業"
          addLabel="+ 学歴を追加"
        />
      </Section>

      <Section title="職歴" note="「以上」は自動で入ります。">
        <RowsEditor
          rows={resume.work}
          onChange={(work) => onChange({ work })}
          placeholder="株式会社〇〇 入社"
          addLabel="+ 職歴を追加"
        />
      </Section>

      <Section title="免許・資格" note="職務経歴書と共通です。">
        <RowsEditor
          rows={resume.licenses}
          onChange={(licenses) => onChange({ licenses })}
          placeholder="基本情報技術者試験 合格"
          addLabel="+ 資格を追加"
        />
      </Section>

      <Section title="志望の動機・特技・アピールポイントなど">
        <TextField label="本文" rows={6} value={resume.motivation} onChange={(motivation) => onChange({ motivation })} />
      </Section>

      <Section title="本人希望記入欄">
        <TextField
          label="本文"
          rows={3}
          value={resume.request}
          onChange={(request) => onChange({ request })}
          placeholder="貴社の規定に従います。"
        />
      </Section>
    </>
  );
}
