import { formatPeriod } from '../dates';
import {
  Company,
  LEVEL_LABELS,
  PHASES,
  Project,
  Resume,
  SKILL_CATEGORIES,
  STACK_LABELS,
  SkillCategory,
  Stack,
  emptyCompany,
  emptyProject,
  emptySkill,
} from '../model';
import { Field, MonthInput, RowControls, RowsEditor, Section, TextField, moveItem, removeItem, updateItem } from './fields';
import { GithubImport } from './GithubImport';

interface Props {
  resume: Resume;
  onChange: (patch: Partial<Resume>) => void;
}

export function ShokumuForm({ resume, onChange }: Props) {
  const { companies, skills } = resume;

  function setCompanies(next: Company[]): void {
    onChange({ companies: next });
  }

  return (
    <>
      <Section title="氏名" note="履歴書と共通です。">
        <Field
          label="氏名"
          wide
          value={resume.profile.name}
          onChange={(name) => onChange({ profile: { ...resume.profile, name } })}
        />
      </Section>

      <Section title="職務要約">
        <TextField
          label="本文"
          rows={5}
          value={resume.summary}
          onChange={(summary) => onChange({ summary })}
          placeholder="Web系企業でバックエンドエンジニアとして5年間…"
        />
      </Section>

      <Section title="職務経歴" note="会社ごとにプロジェクトを追加します。個人開発は会社名を「個人開発」にしてください。">
        {companies.map((company) => (
          <CompanyEditor
            key={company.id}
            company={company}
            onChange={(patch) => setCompanies(updateItem(companies, company.id, patch))}
            onUp={() => setCompanies(moveItem(companies, company.id, -1))}
            onDown={() => setCompanies(moveItem(companies, company.id, 1))}
            onRemove={() => setCompanies(removeItem(companies, company.id))}
          />
        ))}
        <button type="button" className="add" onClick={() => setCompanies([...companies, emptyCompany()])}>
          + 会社を追加
        </button>
      </Section>

      <Section title="テクニカルスキル" note="レベル: 1 学習中 / 2 指導の下で対応可 / 3 一人で対応可 / 4 指導・設計可 / 5 専門">
        {skills.length > 0 && (
          <ul className="rows skills">
            {skills.map((skill) => (
              <li key={skill.id}>
                <select
                  aria-label="分類"
                  value={skill.category}
                  onChange={(event) =>
                    onChange({ skills: updateItem(skills, skill.id, { category: event.target.value as SkillCategory }) })
                  }
                >
                  {SKILL_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
                <input
                  className="grow"
                  aria-label="スキル名"
                  placeholder="TypeScript"
                  value={skill.name}
                  onChange={(event) => onChange({ skills: updateItem(skills, skill.id, { name: event.target.value }) })}
                />
                <span className="years-field">
                  <input
                    aria-label="経験年数"
                    inputMode="decimal"
                    placeholder="0"
                    value={skill.years}
                    onChange={(event) => onChange({ skills: updateItem(skills, skill.id, { years: event.target.value }) })}
                  />
                  <span className="muted">年</span>
                </span>
                <select
                  aria-label="レベル"
                  value={skill.level}
                  onChange={(event) =>
                    onChange({ skills: updateItem(skills, skill.id, { level: Number(event.target.value) }) })
                  }
                >
                  {LEVEL_LABELS.map((label, level) => (
                    <option key={level} value={level} title={label}>
                      {level === 0 ? 'Lv -' : `Lv ${level}`}
                    </option>
                  ))}
                </select>
                <RowControls
                  onUp={() => onChange({ skills: moveItem(skills, skill.id, -1) })}
                  onDown={() => onChange({ skills: moveItem(skills, skill.id, 1) })}
                  onRemove={() => onChange({ skills: removeItem(skills, skill.id) })}
                />
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="add" onClick={() => onChange({ skills: [...skills, emptySkill()] })}>
          + スキルを追加
        </button>
        <GithubImport resume={resume} onChange={onChange} />
      </Section>

      <Section title="資格" note="履歴書の「免許・資格」と共通です。">
        <RowsEditor
          rows={resume.licenses}
          onChange={(licenses) => onChange({ licenses })}
          placeholder="AWS Certified Solutions Architect – Associate"
          addLabel="+ 資格を追加"
        />
      </Section>

      <Section title="自己PR">
        <TextField label="本文" rows={6} value={resume.pr} onChange={(pr) => onChange({ pr })} />
      </Section>

      <Section title="リンク">
        <TextField
          label="1行に1つ"
          rows={3}
          value={resume.links}
          onChange={(links) => onChange({ links })}
          placeholder={'GitHub: https://github.com/username\nポートフォリオ: https://example.com'}
        />
      </Section>
    </>
  );
}

interface CompanyEditorProps {
  company: Company;
  onChange: (patch: Partial<Company>) => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}

function CompanyEditor({ company, onChange, onUp, onDown, onRemove }: CompanyEditorProps) {
  const { projects } = company;
  const period = formatPeriod(company.start, company.end);

  function setProjects(next: Project[]): void {
    onChange({ projects: next });
  }

  return (
    <details className="company" open>
      <summary>
        <span>{company.name || '（会社名未入力）'}</span>
        {period && <span className="muted"> {period}</span>}
      </summary>
      <div className="grid">
        <Field label="会社名" wide value={company.name} onChange={(name) => onChange({ name })} />
        <label className="field">
          <span>在籍期間（終了は空欄で現在）</span>
          <span className="range">
            <MonthInput label="開始" value={company.start} onChange={(start) => onChange({ start })} />
            <span className="muted">〜</span>
            <MonthInput label="終了" placeholder="現在" value={company.end} onChange={(end) => onChange({ end })} />
          </span>
        </label>
        <Field
          label="雇用形態"
          value={company.employment}
          onChange={(employment) => onChange({ employment })}
          placeholder="正社員"
        />
        <Field
          label="事業内容"
          wide
          value={company.business}
          onChange={(business) => onChange({ business })}
          placeholder="SaaS の開発・運営"
        />
      </div>
      {projects.map((project) => (
        <ProjectEditor
          key={project.id}
          project={project}
          onChange={(patch) => setProjects(updateItem(projects, project.id, patch))}
          onUp={() => setProjects(moveItem(projects, project.id, -1))}
          onDown={() => setProjects(moveItem(projects, project.id, 1))}
          onRemove={() => setProjects(removeItem(projects, project.id))}
        />
      ))}
      <div className="actions">
        <button type="button" className="add" onClick={() => setProjects([...projects, emptyProject()])}>
          + プロジェクトを追加
        </button>
        <RowControls onUp={onUp} onDown={onDown} onRemove={onRemove} />
      </div>
    </details>
  );
}

interface ProjectEditorProps {
  project: Project;
  onChange: (patch: Partial<Project>) => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}

function ProjectEditor({ project, onChange, onUp, onDown, onRemove }: ProjectEditorProps) {
  const period = formatPeriod(project.start, project.end);

  function setStack(patch: Partial<Stack>): void {
    onChange({ stack: { ...project.stack, ...patch } });
  }

  return (
    <details className="project" open>
      <summary>
        <span>{project.title || '（案件名未入力）'}</span>
        {period && <span className="muted"> {period}</span>}
      </summary>
      <div className="grid">
        <Field label="案件名" wide value={project.title} onChange={(title) => onChange({ title })} />
        <label className="field">
          <span>期間（終了は空欄で現在）</span>
          <span className="range">
            <MonthInput label="開始" value={project.start} onChange={(start) => onChange({ start })} />
            <span className="muted">〜</span>
            <MonthInput label="終了" placeholder="現在" value={project.end} onChange={(end) => onChange({ end })} />
          </span>
        </label>
        <Field label="役割" value={project.role} onChange={(role) => onChange({ role })} placeholder="リーダー / メンバー" />
        <Field label="チーム規模" value={project.teamSize} onChange={(teamSize) => onChange({ teamSize })} placeholder="5名" />
        <fieldset className="field wide">
          <legend>担当工程</legend>
          <span className="checks">
            {PHASES.map((phase) => (
              <label key={phase}>
                <input
                  type="checkbox"
                  checked={project.phases.includes(phase)}
                  onChange={(event) =>
                    onChange({
                      phases: PHASES.filter((p) => (p === phase ? event.target.checked : project.phases.includes(p))),
                    })
                  }
                />
                {phase}
              </label>
            ))}
          </span>
        </fieldset>
        {(Object.keys(STACK_LABELS) as (keyof Stack)[]).map((key) => (
          <Field
            key={key}
            label={STACK_LABELS[key]}
            value={project.stack[key]}
            onChange={(value) => setStack({ [key]: value })}
          />
        ))}
        <TextField
          label="業務内容"
          value={project.description}
          onChange={(description) => onChange({ description })}
        />
        <TextField
          label="成果・工夫"
          value={project.achievements}
          onChange={(achievements) => onChange({ achievements })}
        />
      </div>
      <div className="actions end">
        <RowControls onUp={onUp} onDown={onDown} onRemove={onRemove} />
      </div>
    </details>
  );
}
