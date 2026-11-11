// Day arithmetic. Everything (streaks, daily seed, callbacks, weekly boss) keys off `today()`.
//
// TODO(Phase 1.6): today() uses the device's LOCAL date, so friends in other time zones get a different
// daily shift and boss week. Switch to a fixed reference zone (UTC or America/Chicago) here, in one place.

export const DAY = 864e5;
export const today = (): number => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / DAY);

/** Sequential number shown as "DAILY SHIFT #n". */
export const dailyNumber = (): number => today() - 20400;

/** Week id; the weekly boss rotates when it changes (Monday). */
export const week = (): number => Math.floor((today() + 3) / 7);
