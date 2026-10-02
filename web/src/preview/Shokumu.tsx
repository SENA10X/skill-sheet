/**
 * The 職務経歴書 / skill sheet. Unlike the 履歴書 it is a flowing document:
 * the preview is one long sheet and the browser breaks it into A4 pages when
 * printing, keeping each project in one piece where it can.
 */
import { formatDate, formatMonth, formatPeriodWithLength, periodParts } from '../dates';
import { LEVEL_LABELS, Project, Resume, STACK_LABELS, Stack } from '../model';

function Paragraphs({ text }: { text: string }) {
  return <p className="text">{text.trim()}</p>;
}

function ProjectRow({ project, today }: { project: Project; today: string }) {
  const period = periodParts(project.start, project.end, today);
  const stack = (Object.keys(STACK_LABELS) as (keyof Stack)[]).filter((key) => project.stack[key].trim());
  return (
    <tr>
      <td className="period">
        {period && (
          <>
            {period.from}
            <br />〜 {period.to}
            {period.length && (
              <>
                <br />（{period.length}）
              </>
            )}
          </>
        )}
      </td>
      <td>
        <p className="project-title">{project.title}</p>
        {project.description.trim() && <Paragraphs text={project.description} />}
        {project.achievements.trim() && (
          <>
            <p className="label">【成果・工夫】</p>
            <Paragraphs text={project.achievements} />
          </>
        )}
      </td>
      <td className="env">
        {stack.map((key) => (
          <p key={key}>
            <span className="label">{STACK_LABELS[key]}</span>
            <br />
            {project.stack[key].trim()}
          </p>
        ))}
      </td>
      <td className="role">
        {project.role.trim() && <p>{project.role.trim()}</p>}
        {project.teamSize.trim() && <p>{project.teamSize.trim()}</p>}
        {project.phases.length > 0 && (
          <p className="phases">
            {project.phases.map((phase) => (
              <span key={phase}>{phase}</span>
            ))}
          </p>
        )}
      </td>
    </tr>
  );
}

export function Shokumu({ resume, today }: { resume: Resume; today: string }) {
  const created = formatDate(resume.createdOn, resume.era);
  const skills = resume.skills.filter((skill) => skill.name.trim());
  const licenses = resume.licenses.filter((row) => row.text.trim());
  const links = resume.links
    .split('\n')
    .map((link) => link.trim())
    .filter(Boolean);

  return (
    <article className="paper shokumu">
      <h1>職務経歴書</h1>
      <div className="meta">
        <p>{created ? `${created}現在` : '年　月　日現在'}</p>
        <p>{`氏名\u3000${resume.profile.name}`}</p>
      </div>

      {resume.summary.trim() && (
        <section>
          <h2>職務要約</h2>
          <Paragraphs text={resume.summary} />
        </section>
      )}

      {resume.companies.length > 0 && (
        <section>
          <h2>職務経歴</h2>
          {resume.companies.map((company) => (
            <div className="company" key={company.id}>
              <div className="company-head">
                <p className="company-name">{company.name}</p>
                <p>{formatPeriodWithLength(company.start, company.end, today)}</p>
              </div>
              {(company.business.trim() || company.employment.trim()) && (
                <p className="company-meta">
                  {[
                    company.business.trim() && `事業内容：${company.business.trim()}`,
                    company.employment.trim() && `雇用形態：${company.employment.trim()}`,
                  ]
                    .filter(Boolean)
                    .join('　／　')}
                </p>
              )}
              {company.projects.length > 0 && (
                <table className="projects">
                  <colgroup>
                    <col className="period" />
                    <col />
                    <col className="env" />
                    <col className="role" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>期間</th>
                      <th>プロジェクト・業務内容</th>
                      <th>開発環境</th>
                      <th>役割・規模・工程</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.projects.map((project) => (
                      <ProjectRow key={project.id} project={project} today={today} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2>テクニカルスキル</h2>
          <table className="skills">
            <colgroup>
              <col className="category" />
              <col />
              <col className="years" />
              <col className="level" />
            </colgroup>
            <thead>
              <tr>
                <th>分類</th>
                <th>スキル</th>
                <th>経験年数</th>
                <th>レベル</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td>{skill.category}</td>
                  <td>{skill.name.trim()}</td>
                  <td className="num">{skill.years.trim() && `${skill.years.trim()}年`}</td>
                  <td>
                    {skill.level > 0 && (
                      <>
                        <span className="dots" aria-label={`レベル${skill.level}`}>
                          {'●'.repeat(skill.level)}
                          {'○'.repeat(LEVEL_LABELS.length - 1 - skill.level)}
                        </span>{' '}
                        {LEVEL_LABELS[skill.level]}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {licenses.length > 0 && (
        <section>
          <h2>資格</h2>
          <table className="plain">
            <tbody>
              {licenses.map((row) => (
                <tr key={row.id}>
                  <td className="when">{formatMonth(row.date, resume.era)}</td>
                  <td>{row.text.trim()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {resume.pr.trim() && (
        <section>
          <h2>自己PR</h2>
          <Paragraphs text={resume.pr} />
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h2>リンク</h2>
          {links.map((link, index) => (
            <p key={index} className="break">
              {link}
            </p>
          ))}
        </section>
      )}

      <p className="end">以上</p>
    </article>
  );
}
