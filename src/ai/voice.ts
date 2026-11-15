// SHIFTY-1's voice: what to say and how to pronounce it. The speech engine itself is shared (engine/speech.ts).
import { S } from './state';
import { mediaButtons, speak } from '../engine/speech';

export { canSpeak, hush, silentAudio } from '../engine/speech';

/** Make written text sound right when spoken. */
export const speakable = (s: string) => String(s)
  .replace(/https?:\/\/\S+/g, 'a web address')
  .replace(/\bAWS\b/g, 'A W S').replace(/\bIAM\b/g, 'I am').replace(/\bRAG\b/g, 'rag').replace(/\bLLMs?\b/g, (m) => m.endsWith('s') ? 'L L Ms' : 'L L M')
  .replace(/\bFMs\b/g, 'foundation models').replace(/\bFM\b/g, 'foundation model').replace(/\bML\b/g, 'M L').replace(/\bAI\b/g, 'A I').replace(/\bGenAI\b/gi, 'gen A I')
  .replace(/\bvs\.?\b/g, 'versus').replace(/\be\.g\./g, 'for example').replace(/[`*_|^]/g, ' ').replace(/→/g, ' then ').replace(/\s+/g, ' ').trim();

/** Speak (if the voice setting is on). The give-up timer runs on the written length, as it always has. */
export function say(t: string, rate = 1.03): Promise<void> {
  if (!S.voice) return Promise.resolve();
  const spoken = speakable(t);
  return speak(spoken, { rate, natural: true, giveUp: [900 + (t.length - spoken.length) * 80, 80, 30000] });
}

export function setMedia(on: boolean, prev?: () => void, next?: () => void): void {
  mediaButtons(on ? { title: 'SHIFTY-1 · Earbud mode', artist: '⏮ hallucination · ⏭ legit' } : null, prev, next);
}
