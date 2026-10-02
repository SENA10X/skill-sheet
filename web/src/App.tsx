import { useEffect, useMemo, useRef, useState } from 'react';
import { track, trackPageView } from './analytics';
import { todayISO } from './dates';
import { download } from './files';
import { RirekishoForm } from './forms/RirekishoForm';
import { ShokumuForm } from './forms/ShokumuForm';
import { ImportError, parseResume, serializeResume } from './io';
import { toMarkdown } from './markdown';
import { DocKind, Era, Resume, emptyResume } from './model';
import { Rirekisho } from './preview/Rirekisho';
import { Shokumu } from './preview/Shokumu';
import { clearResume, loadResume, saveResume } from './storage';

const DOCS: { kind: DocKind; label: string }[] = [
  { kind: 'rirekisho', label: '履歴書' },
  { kind: 'shokumu', label: '職務経歴書' },
];

/** Width of an A4 sheet in CSS pixels (210 mm at 96 dpi). */
const PAPER_WIDTH = 794;

export function App() {
  const today = useMemo(() => todayISO(), []);
  const [resume, setResume] = useState<Resume>(() => loadResume(today) ?? emptyResume(today));
  const [doc, setDoc] = useState<DocKind>('rirekisho');
  const [notice, setNotice] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [scale, setScale] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLElement>(null);

  useEffect(() => {
    trackPageView();
  }, []);

  // Saved shortly after typing stops rather than on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSaveFailed(!saveResume(resume)), 300);
    return () => clearTimeout(timer);
  }, [resume]);

  // The sheet keeps its real A4 size and is zoomed to fit the column, so the
  // preview wraps lines exactly where the printout will.
  useEffect(() => {
    const element = preview.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setScale(Math.min(1, width / PAPER_WIDTH));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function update(patch: Partial<Resume>): void {
    setResume((current) => ({ ...current, ...patch }));
  }

  function switchDoc(next: DocKind): void {
    if (next === doc) return;
    setDoc(next);
    setNotice('');
    track('tool_run', { doc: next });
  }

  function printSheet(): void {
    const title = document.title;
    const label = DOCS.find((entry) => entry.kind === doc)!.label;
    const name = resume.profile.name.replace(/\s+/g, '');
    // Browsers name the saved PDF after the page title.
    document.title = name ? `${label}_${name}` : label;
    track('tool_download', { format: 'pdf', doc });
    window.print();
    document.title = title;
  }

  function exportJson(): void {
    download('skill-sheet.json', serializeResume(resume), 'application/json');
    track('tool_download', { format: 'json', doc });
  }

  function exportMarkdown(): void {
    download('shokumu-keirekisho.md', toMarkdown(resume, today), 'text/markdown');
    track('tool_download', { format: 'md', doc });
  }

  async function copyMarkdown(): Promise<void> {
    try {
      await navigator.clipboard.writeText(toMarkdown(resume, today));
      setNotice('Markdown をコピーしました。');
      track('tool_download', { format: 'md_copy', doc });
    } catch {
      setNotice('コピーできませんでした。');
    }
  }

  async function importJson(file: File | undefined): Promise<void> {
    if (!file) return;
    try {
      const next = parseResume(await file.text(), today);
      if (!window.confirm('今の内容を、読み込んだファイルの内容で置き換えます。')) return;
      setResume(next);
      setNotice('読み込みました。');
      track('tool_input', { source: 'json' });
    } catch (error) {
      setNotice('読み込めませんでした。skill-sheet で書き出した JSON を選んでください。');
      track('tool_error', { source: 'json', error_type: error instanceof ImportError ? error.code : 'unreadable' });
    }
  }

  function clearAll(): void {
    if (!window.confirm('入力した内容と写真をすべて消去します。元に戻せません。')) return;
    clearResume();
    setResume(emptyResume(today));
    setNotice('消去しました。');
  }

  return (
    <div className="layout">
      <main className="editor">
        <header>
          <h1>skill-sheet</h1>
          <p>エンジニア向けの履歴書と職務経歴書をつくる。</p>
          <p className="muted">入力内容はこのブラウザ内にだけ保存されます。アカウント不要。</p>
        </header>

        <nav className="docs" aria-label="書類">
          {DOCS.map((entry) => (
            <button key={entry.kind} type="button" aria-pressed={doc === entry.kind} onClick={() => switchDoc(entry.kind)}>
              {entry.label}
            </button>
          ))}
        </nav>

        <div className="settings">
          <label className="field">
            <span>作成日</span>
            <input type="date" value={resume.createdOn} onChange={(event) => update({ createdOn: event.target.value })} />
          </label>
          <fieldset className="field">
            <legend>年の表記</legend>
            <span className="checks">
              {(
                [
                  ['western', '西暦'],
                  ['japanese', '和暦'],
                ] as [Era, string][]
              ).map(([era, label]) => (
                <label key={era}>
                  <input type="radio" name="era" checked={resume.era === era} onChange={() => update({ era })} />
                  {label}
                </label>
              ))}
            </span>
          </fieldset>
        </div>

        <div className="toolbar">
          <button type="button" onClick={printSheet}>
            PDF保存・印刷
          </button>
          {doc === 'shokumu' && (
            <>
              <button type="button" onClick={exportMarkdown}>
                Markdown
              </button>
              <button type="button" onClick={() => void copyMarkdown()}>
                Markdownをコピー
              </button>
            </>
          )}
          <button type="button" onClick={exportJson}>
            JSON書き出し
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>
            JSON読み込み
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              void importJson(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </div>
        <p className="notice" aria-live="polite">
          {saveFailed ? 'ブラウザに保存できませんでした。JSON書き出しで保存してください。' : notice}
        </p>

        {doc === 'rirekisho' ? (
          <RirekishoForm resume={resume} onChange={update} />
        ) : (
          <ShokumuForm resume={resume} onChange={update} />
        )}

        <footer>
          <p className="links">
            <a href="https://github.com/SENA10X/skill-sheet" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={clearAll}>
              すべて消去
            </button>
          </p>
          <p>PDF は印刷ダイアログで「PDFとして保存」を選び、用紙 A4・余白「デフォルト」・倍率 100% で保存してください。</p>
        </footer>
      </main>

      <aside className="preview" ref={preview} aria-label="プレビュー">
        <div className="sheets" style={{ zoom: scale }}>
          {doc === 'rirekisho' ? <Rirekisho resume={resume} /> : <Shokumu resume={resume} today={today} />}
        </div>
      </aside>
    </div>
  );
}
