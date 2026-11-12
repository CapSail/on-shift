// The voice: irreverent, meme-y, accurate. Dale the night-shift SOC manager stays.
import type { Alert } from './types';
import { hostOf, userOf } from './content';
import { shuffle } from './util';

export const ROAST = {
  tp: ["Escalated. {host}'s C2 just went real quiet.", 'Caught it. The threat actor is rage-quitting as we speak.', 'W. The leak site stays empty tonight.', 'Clean catch. IR owes you a coffee.', 'Escalated. Their initial access broker wants a refund.', "You just ruined a ransomware affiliate's whole quarter.", '{user} is getting a password reset and a stern email.', "Escalated. That's a 'lessons learned' slide with YOUR name on it.", "Caught. Somewhere a Telegram channel just went 'bro what'.", 'Escalated. MTTD: you.', 'The pager is proud of you.', 'Detection coverage: confirmed. Ego: inflated.', 'Escalated. Shifty is doing the dead-guy happy wiggle.'],
  fp: ['Closed. You just saved IR from a 3am page. Hero behavior.', 'Correctly ignored. Alert fatigue fears you.', 'Benign. Your MTTR thanks you.', 'Closed. Not every PowerShell is a crime.', 'The on-call engineer gets to keep sleeping. Because of you.', "Closed. You know what normal looks like, and that's rare.", 'Closed it. {user} will never know how close they came to an awkward call.', 'Benign. Tuning ticket incoming, chief.', "Closed. That's a suppression rule waiting to happen.", 'Correct. Ignoring noise is half the job and nobody claps for it. *claps*', 'Closed. Shifty did a tiny ghost dance.'],
  miss: ['You CLOSED that? The ransom note is printing on every printer right now.', 'Bro closed a true positive. The threat actor sent you a thank-you card.', 'Closed. Somewhere a leak site just got a new post.', 'Missed. This one comes back, and it remembers.', 'You closed it. The attacker high-fived their whole Telegram channel.', "That's a true positive, chief. Legal is drafting the breach notice.", '{host} is now somebody else\'s computer.', 'Closed. The CISO will be finding out about this from a journalist.', "You let {user} get owned. They'll never know it was you.", 'Missed. The DFIR firm thanks you for their next invoice.', 'Missed. Shifty fainted. He was already dead, so it was a lot.', 'You closed it. Shifty has seen enough, he is going to haunt the SIEM.'],
  fesc: ['Escalated a benign. IR just muted your channel.', 'You woke up the on-call for THAT? They know where you live.', 'False positive. Tier 3 is screenshotting this for the group chat.', 'The SOC manager just added a slide about you.', 'That was benign. You owe IR a pizza.', 'False alarm. The pager has filed a restraining order.', 'You isolated {host} for that? {user} is calling the help desk crying.', 'Escalated. IR spent 40 minutes proving it was nothing.', 'Benign. Alert fatigue claims another victim: everyone else.', 'Bro escalated IT doing IT things.', 'Shifty is also confused, and he has no pulse to blame.'],
};
export type RoastKind = keyof typeof ROAST;

export const DALE = {
  combo5: ["Five in a row. Don't let it go to your head.", "Okay, you're on a heater. I'm watching.", 'Combo x5. Somebody get this analyst a second monitor.'],
  combo8: ['Eight straight. Are you reading the logs or are you the logs?', 'This is unreasonable. Keep going.'],
  perfect: ["Perfect shift. I'm putting you in for... nothing, budget's frozen. But mentally? A raise.", "Ten for ten. I didn't know we hired detection engineers on the night shift."],
  bad: ["Rough night. Read the tells, come back tomorrow, we've all been there.", 'Look, everyone closes a true positive once. Maybe not four times.'],
  first: ['Welcome to the night shift. Rule one: check the parent process. Rule two: there are no other rules. Kidding. There are like 60.'],
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
