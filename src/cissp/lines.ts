// The Ghost CISO's voice: Shifty (earnest, getting wiser) and Dale (Chief Synergy Officer, confused).
// The lines live in content/cissp/quips/*.json (checked by scripts/check-quips.ts on every build).
import { S, rankOf } from './state';
import { createDealer } from '../engine/deck';
import home from '../../content/cissp/quips/home.json';
import feedback from '../../content/cissp/quips/feedback.json';
import misc from '../../content/cissp/quips/misc.json';

/** 0 = standing 0-2 (new and nervous), 1 = 3-5 (finding his feet), 2 = 6-9 (the board asks him first). */
export const brain = (): 0 | 1 | 2 => { const r = rankOf(S.xp); return r <= 2 ? 0 : r <= 5 ? 1 : 2; };

const SH: Record<'home' | 'ok' | 'no', string[][]> = { home: home.home, ok: feedback.ok, no: feedback.no };
export const FLASH: string[] = misc.flash;
export const DALE: Record<'intro' | 'perfect' | 'good' | 'bad' | 'exam' | 'daily' | 'streak', string[]> = misc.dale;

/** Deal the next line (decks saved between visits, so every line is heard before any repeats). */
export const line = createDealer('cissp.decks');
export const sh = (k: keyof typeof SH): string => line(SH[k][brain()], `${k}${brain()}`);
export const flash = (): string => line(FLASH, 'flash');
export const dale = (k: keyof typeof DALE, n?: number): string => line(DALE[k], 'dale' + k).replace('{n}', String(n ?? ''));
