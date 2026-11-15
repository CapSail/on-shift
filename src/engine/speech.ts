// Text to speech + earbud buttons (ride mode, earbud mode, "read it to me").
// A silent looping audio element holds media focus so ⏮/⏭ keep working with the screen locked.

export const canSpeak = (): boolean => 'speechSynthesis' in window;

let voiceCache: SpeechSynthesisVoice | null | undefined;
function naturalVoice(): SpeechSynthesisVoice | null {
  if (voiceCache !== undefined) return voiceCache;
  const vs = speechSynthesis.getVoices();
  voiceCache = vs.find((v) => /en[-_]US/i.test(v.lang) && /natural|neural|google/i.test(v.name)) ?? vs.find((v) => /^en/i.test(v.lang)) ?? null;
  return voiceCache;
}

/**
 * Speak a line; resolves when it ends, errors, or after a length-based timeout (some browsers never fire `end`).
 * `natural` picks the best English voice on the device; `giveUp` is [base ms, ms per character, cap ms].
 */
export function speak(t: string, o: { rate?: number; natural?: boolean; giveUp?: [number, number, number] } = {}): Promise<void> {
  const [base, per, cap] = o.giveUp ?? [900, 80, 30000];
  return new Promise((res) => {
    try {
      if (!canSpeak()) return res();
      const u = new SpeechSynthesisUtterance(t);
      if (o.natural) { const v = naturalVoice(); if (v) u.voice = v; }
      u.rate = o.rate ?? 1.03;
      let settled = false;
      const done = () => { if (!settled) { settled = true; res(); } };
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
      setTimeout(done, Math.min(cap, base + t.length * per));
    } catch { res(); }
  });
}

export const hush = () => { try { speechSynthesis.cancel(); } catch { /* ignore */ } };

/** Two seconds of silence, looping. */
export function silentAudio(): HTMLAudioElement {
  const sr = 8000, n = sr * 2, b = new ArrayBuffer(44 + n), v = new DataView(b);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  const a = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' })));
  a.loop = true;
  return a;
}

/** Bind (or, with `meta` null, release) the earbud / steering-wheel ⏮ and ⏭ buttons. */
export function mediaButtons(meta: { title: string; artist: string } | null, prev?: () => void, next?: () => void): void {
  try {
    const ms = navigator.mediaSession;
    if (!ms) return;
    if (meta) {
      ms.metadata = new MediaMetadata(meta);
      ms.setActionHandler('previoustrack', () => prev?.());
      ms.setActionHandler('nexttrack', () => next?.());
      ms.setActionHandler('pause', () => {});
      ms.setActionHandler('play', () => {});
    } else {
      (['previoustrack', 'nexttrack', 'pause', 'play'] as MediaSessionAction[]).forEach((k) => { try { ms.setActionHandler(k, null); } catch { /* ignore */ } });
    }
  } catch { /* Media Session unavailable */ }
}
