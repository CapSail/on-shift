// Content (built from YAML by scripts/build-content.ts) plus the indexes the game needs.
import raw from './generated/content.json';
import type { Alert, Content, Crew } from './types';

export const D = raw as unknown as Content;

export const ALERTS: Alert[] = D.alerts;
export const byId: Record<string, Alert> = {};
ALERTS.forEach((a) => (byId[a.id] = a));

export const INC_ALERTS: Alert[] = D.inc.flatMap((i) => i.a);
export const CON = D.concepts ?? {};

export const crewById: Record<string, Crew> = {};
D.crews.forEach((c) => (crewById[c.id] = c));

/** technique id (and its parent) -> crews that use it */
export const byTech: Record<string, Crew[]> = {};
D.crews.forEach((c) =>
  c.t.forEach((t) => {
    (byTech[t] = byTech[t] || []).push(c);
    const p = t.split('.')[0];
    if (p !== t) (byTech[p] = byTech[p] || []).push(c);
  }),
);

/** concept id -> alerts that teach it (the pool for callbacks and twins) */
export const conceptAlerts: Record<string, Alert[]> = {};
ALERTS.forEach((a) => {
  const c = a.c || a.id;
  (conceptAlerts[c] = conceptAlerts[c] || []).push(a);
});

export const ruleOf = (a: Alert) => CON[a.c]?.rule || '';
export const hostOf = (a: Alert) => String(a.h).split(' · ')[0];
export const userOf = (a: Alert) => {
  const p = String(a.h).split(' · ');
  return p[1] || p[0];
};

export const tUrl = (t: string) => 'https://attack.mitre.org/techniques/' + t.replace('.', '/') + '/';
