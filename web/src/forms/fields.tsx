/** Small form controls shared by both sheets' forms. */
import { ReactNode, useEffect, useState } from 'react';
import { normalizeMonth } from '../dates';
import { HistoryRow, emptyRow } from '../model';

export function updateItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function removeItem<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

/** Swaps an item with its neighbour; out-of-range moves are ignored. */
export function moveItem<T extends { id: string }>(items: T[], id: string, offset: -1 | 1): T[] {
  const from = items.findIndex((item) => item.id === id);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date' | 'url';
  placeholder?: string;
  wide?: boolean;
}

export function Field({ label, value, onChange, type = 'text', placeholder, wide }: FieldProps) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextField({ label, value, onChange, rows = 4, placeholder }: TextFieldProps) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <textarea rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface MonthInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

/**
 * A plain text box for 'YYYY-MM'. Safari has no month picker, and typing a
 * month is quicker than picking one, so '2024/4' and '2024年4月' are accepted
 * and tidied when the box loses focus.
 */
export function MonthInput({ value, onChange, label, placeholder = 'YYYY-MM' }: MonthInputProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="month-input"
      aria-label={label}
      inputMode="numeric"
      placeholder={placeholder}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = normalizeMonth(draft) ?? draft.trim();
        setDraft(next);
        if (next !== value) onChange(next);
      }}
    />
  );
}

interface RowsEditorProps {
  rows: HistoryRow[];
  onChange: (rows: HistoryRow[]) => void;
  placeholder: string;
  addLabel: string;
}

/** The dated lines of 学歴, 職歴 and 免許・資格. */
export function RowsEditor({ rows, onChange, placeholder, addLabel }: RowsEditorProps) {
  return (
    <>
      {rows.length > 0 && (
        <ul className="rows">
          {rows.map((row) => (
            <li key={row.id}>
              <MonthInput
                label="年月"
                value={row.date}
                onChange={(date) => onChange(updateItem(rows, row.id, { date }))}
              />
              <input
                className="grow"
                aria-label="内容"
                placeholder={placeholder}
                value={row.text}
                onChange={(event) => onChange(updateItem(rows, row.id, { text: event.target.value }))}
              />
              <RowControls
                onUp={() => onChange(moveItem(rows, row.id, -1))}
                onDown={() => onChange(moveItem(rows, row.id, 1))}
                onRemove={() => onChange(removeItem(rows, row.id))}
              />
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="add" onClick={() => onChange([...rows, emptyRow()])}>
        {addLabel}
      </button>
    </>
  );
}

interface RowControlsProps {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}

export function RowControls({ onUp, onDown, onRemove }: RowControlsProps) {
  return (
    <span className="row-controls">
      <button type="button" className="icon" aria-label="上へ" onClick={onUp}>
        ↑
      </button>
      <button type="button" className="icon" aria-label="下へ" onClick={onDown}>
        ↓
      </button>
      <button type="button" className="icon" aria-label="削除" onClick={onRemove}>
        ×
      </button>
    </span>
  );
}

export function Section({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section>
      <h2>{title}</h2>
      {note && <p className="muted note">{note}</p>}
      {children}
    </section>
  );
}
