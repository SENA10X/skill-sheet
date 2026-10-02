/**
 * Google Analytics 4 wrapper.
 *
 * Same shape as the other SENA GitHub Pages tools: one property, one tool
 * identity, a fixed event set.
 *
 * A resume is personal data, so nothing a user typed ever reaches this module.
 * Callers pass fixed enum strings only, and ALLOWED_PARAMS drops anything
 * else, so a future caller cannot leak a name, a URL or a GitHub username by
 * mistake.
 */
const TOOL_NAME = 'skill-sheet';
const TOOL_VERSION = '1.0.0';

/** The only event names this tool reports. */
export type ToolEvent = 'page_view' | 'tool_input' | 'tool_run' | 'tool_download' | 'tool_error';

/** Params are fixed enum strings only — never user-supplied text. */
export type EventParams = Record<string, string | number | boolean>;

/** The only param names allowed on each event. Everything else is dropped. */
const ALLOWED_PARAMS: Record<ToolEvent, readonly string[]> = {
  page_view: [],
  // source: 'json' | 'github' | 'photo'
  tool_input: ['source'],
  // doc: 'rirekisho' | 'shokumu' — the sheet switched to
  tool_run: ['doc'],
  // format: 'pdf' | 'json' | 'md' | 'md_copy'
  tool_download: ['format', 'doc'],
  // error_type: a fixed code such as 'not-json' or 'rate-limited'
  tool_error: ['source', 'error_type'],
};

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

/** Local development must not pollute production metrics. */
function isDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/** Keeps only the params declared for the event. */
export function safeParams(event: ToolEvent, params: EventParams): EventParams {
  const allowed = ALLOWED_PARAMS[event];
  const result: EventParams = {};
  for (const key of allowed) {
    if (key in params) result[key] = params[key];
  }
  return result;
}

/**
 * Sends one event, with the tool identity attached.
 *
 * Analytics is best-effort: a missing gtag, a blocked script or a throwing
 * transport must never surface to the caller.
 */
export function track(event: ToolEvent, params: EventParams = {}): void {
  try {
    if (typeof window === 'undefined') return;
    if (isDevHost(window.location.hostname)) return;
    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', event, {
      ...safeParams(event, params),
      tool_name: TOOL_NAME,
      tool_version: TOOL_VERSION,
    });
  } catch {
    // Never let measurement break the tool.
  }
}

let pageViewSent = false;

/**
 * The gtag snippet is configured with `send_page_view: false`, so the page
 * view is sent from here — once, even though StrictMode mounts twice.
 */
export function trackPageView(): void {
  if (pageViewSent) return;
  pageViewSent = true;
  track('page_view');
}
