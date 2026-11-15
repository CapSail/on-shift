// Day arithmetic. Everything (streaks, daily seed, callbacks, weekly boss) keys off `today()`.
//
// Every "day" is a calendar day in ONE fixed zone (America/Chicago), not the device's, so friends in any time zone
// get the same daily shift, the same boss week, and the same leaderboard day.

export const DAY = 864e5;
export const REF_ZONE = 'America/Chicago';
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: REF_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export const today = (): number => {
  const [y, m, d] = fmt.format(new Date()).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY);
};

/** Week id; the weekly boss (SOC) and the red-team fight (SHIFTY-1) rotate when it changes (Monday). */
export const week = (): number => Math.floor((today() + 3) / 7);
