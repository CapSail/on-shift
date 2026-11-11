// "Report this answer": a prefilled GitHub issue (and an optional mailto fallback) for any alert.
import type { Alert } from './types';
import { APP_VERSION, REPORT_EMAIL, REPO } from './config';
import { D } from './content';
import { esc } from './util';

export interface ReportCtx {
  alert: Alert;
  call: boolean;   // true = the player escalated
  sure: boolean;
  ok: boolean;
  mode: string;
}

function reportBody(c: ReportCtx): string {
  const a = c.alert;
  return [
    `Alert: ${a.id} - ${a.t}`,
    `Official verdict: ${a.v ? 'true positive (escalate)' : 'benign (close)'}`,
    `My call: ${c.call ? 'escalate' : 'close'} (${c.sure ? 'sure' : 'lean'}), ${c.ok ? 'scored right' : 'scored wrong'}`,
    `Mode: ${c.mode} | concept: ${a.c} | ATT&CK: ${a.x}`,
    `App ${APP_VERSION} | content v${D.meta.contentVersion} | ATT&CK ${D.meta.attack}`,
    '',
    'What is wrong with this answer?',
    '',
  ].join('\n');
}

export const issueUrl = (c: ReportCtx): string =>
  `https://github.com/${REPO}/issues/new?template=report.md&title=${encodeURIComponent('[report] ' + c.alert.id)}&body=${encodeURIComponent(reportBody(c))}`;

export const mailUrl = (c: ReportCtx): string =>
  `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent('[ON SHIFT report] ' + c.alert.id)}&body=${encodeURIComponent(reportBody(c))}`;

/** The small line shown under every feedback panel. */
export function reportHtml(c: ReportCtx): string {
  const mail = REPORT_EMAIL
    ? ` · <a href="${esc(mailUrl(c))}">e-mail it</a> <span class="mono">${esc(REPORT_EMAIL)}</span>`
    : '';
  return `<div class="rep"><a class="rlink" href="${esc(issueUrl(c))}" target="_blank" rel="noopener">🚩 Report this answer</a>${mail}</div>`;
}
