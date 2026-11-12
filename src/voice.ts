// The voice: irreverent, meme-y, accurate. Dale the night-shift SOC manager stays.
import type { Alert } from './types';
import { hostOf, userOf } from './content';
import { shuffle } from './util';

export const ROAST = {
  tp: ["Escalated. {host}'s C2 just went real quiet.", 'Caught it. The threat actor is rage-quitting as we speak.', 'W. The leak site stays empty tonight.', 'Clean catch. IR owes you a coffee.', 'Escalated. Their initial access broker wants a refund.', "You just ruined a ransomware affiliate's whole quarter.", '{user} is getting a password reset and a stern email.', "Escalated. That's a 'lessons learned' slide with YOUR name on it.", "Caught. Somewhere a Telegram channel just went 'bro what'.", 'Escalated. MTTD: you.', 'The pager is proud of you.', 'Detection coverage: confirmed. Ego: inflated.', 'Escalated. Shifty is doing the dead-guy happy wiggle.'],
  fp: ['Closed. You just saved IR from a 3am page. Hero behavior.', 'Correctly ignored. Alert fatigue fears you.', 'Benign. Your MTTR thanks you.', 'Closed. Not every PowerShell is a crime.', 'The on-call engineer gets to keep sleeping. Because of you.', "Closed. You know what normal looks like, and that's rare.", 'Closed it. {user} will never know how close they came to an awkward call.', 'Benign. Tuning ticket incoming, chief.', "Closed. That's a suppression rule waiting to happen.", 'Correct. Ignoring noise is half the job and nobody claps for it. *claps*', 'Closed. Shifty did a tiny ghost dance.'],
  miss: ["That one was real. Don't worry, it's coming back, and you'll get it.", 'Missed it. The attacker is smug for now. Tonight you learn the tell.', "Closed, but it was a live one. That's how the tell sticks.", 'This one slipped through. Shifty phased through it too, honestly.', "Whoops. That's a true positive. Look at the log line and you'll never miss it again.", '{host} would like a word. Next time you will have one ready.', 'Missed. Even Banshees whiff on the first pass. It comes back.', "Real attack, closed. Good news: this is exactly how you learn it.", "Close, but it was malicious. Read the tell below and it's yours.", 'Shifty winced for you. Gently.'],
  fesc: ['That one was benign. Better loud than sorry, honestly.', 'Escalated a false alarm. Everyone does. Check the tell below.', 'Benign, but your instincts are pointing the right way.', "Over-cautious beats asleep. Now you know what normal looks like here.", "That was just {host} being {host}. Next time you'll spot it.", 'False alarm. Shifty gave you a sympathetic pat on the sheet.', 'Benign. The log line below is the tell. Save it for later.', 'A little jumpy there. {user} appreciates the effort though.', 'Escalated a normal one. You are learning what quiet looks like.', 'Not this time. The tell is one line. Read it, own it.'],
};
export type RoastKind = keyof typeof ROAST;

export const DALE = {
  combo5: ["Five in a row. Don't let it go to your head.", "Okay, you're on a heater. I'm watching.", 'Combo x5. Somebody get this analyst a second monitor.'],
  combo8: ['Eight straight. Are you reading the logs or are you the logs?', 'This is unreasonable. Keep going.'],
  perfect: ["Perfect round. I'm putting you in for... nothing, budget's frozen. But mentally? A raise.", "Ten for ten. I didn't know we hired detection engineers in the afterlife."],
  bad: ["Rough round. Read the tells, come back tomorrow, we've all been there.", 'Everyone closes a true positive once. The rematches will fix it.'],
  first: ['Welcome, new ghost. Rule one: check the parent process. Rule two: there are no other rules. Kidding. There are like 60.'],
  streak: ["{n} days straight. You're more consistent than our SIEM ingestion."],
};

export const TAUNT = {
  hit: ['Lucky guess.', 'That tickled.', 'You read one report and think you know me?', 'Okay that one hurt.', 'Fine. You saw that one.'],
  miss: ["Ha. You don't even know my TTPs.", 'Your detection coverage is a vibe, not a strategy.', "I've been in your network since 2023.", 'Imagine not knowing my playbook.', 'Your SIEM retention is 30 days. Mine is forever.'],
};

// Lines are dealt from a shuffled deck so you don't see repeats until the deck is used up.
const decks: Record<string, string[]> = {};

/** Pick the next line from a roast kind, or from any custom pool. Fills {host} and {user} from the alert. */
export function line(kind: RoastKind | string[], a?: Alert): string {
  const pool = typeof kind === 'string' ? ROAST[kind] : kind;
  const k = typeof kind === 'string' ? kind : pool[0];
  if (!decks[k] || !decks[k].length) decks[k] = shuffle(pool);
  let s = decks[k].pop()!;
  if (a) s = s.replace(/{host}/g, hostOf(a)).replace(/{user}/g, userOf(a));
  return s;
}
