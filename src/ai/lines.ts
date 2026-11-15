// The voice. Shifty is an earnest, slightly dim AI model in training; he gets sharper as his tier rises.
// Dale used to run the night-shift SOC. He now "leads the AI initiative" (nobody asked him to).
// The lines live in content/ai/quips/*.json (checked by scripts/check-quips.ts on every build).
import { S, rankOf } from './state';
import { createDealer } from '../engine/deck';
import home from '../../content/ai/quips/home.json';
import feedback from '../../content/ai/quips/feedback.json';
import misc from '../../content/ai/quips/misc.json';

/** 0 = tiers 0-2 (babbling), 1 = tiers 3-5 (getting it), 2 = tiers 6-9 (smug). */
export const brain = (): 0 | 1 | 2 => { const r = rankOf(S.xp); return r <= 2 ? 0 : r <= 5 ? 1 : 2; };

type Tiered = string[][];
const SH: Record<'home' | 'ok' | 'no' | 'epoch' | 'pre', Tiered> = {
  home: home.home, ok: feedback.ok, no: feedback.no, epoch: misc.epoch, pre: misc.pre,
};

export const DALE: Record<'intro' | 'perfect' | 'good' | 'bad' | 'streak' | 'bench' | 'boss' | 'bossWin' | 'bossLose', string[]> = misc.dale;

/** Red team "attacks": Dale's prompt-injection taunts above each card in the boss fight. */
export const ATTACKS: string[] = misc.attacks;

/** Deal the next line from a pool. Decks are saved between visits (same key as the standalone app), so every line is heard before any repeats. */
export const line = createDealer('shifty1.decks');
export const sh = (k: keyof typeof SH): string => line(SH[k][brain()], `${k}${brain()}`);
export const dale = (k: keyof typeof DALE, n?: number): string => line(DALE[k], 'dale' + k).replace('{n}', String(n ?? ''));
