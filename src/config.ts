// Deployment settings that are not game logic.

/** "0.1.0+abc1234": package version plus the commit it was built from ("dev" locally). Injected by Vite. */
export const APP_VERSION: string = __APP_VERSION__;

// Leaderboard backend (Supabase). Leave both empty to keep the leaderboard switched off.
// Both values are PUBLIC by design (the anon key only works through the row-level-security rules in supabase/schema.sql).
const SB_DEFAULT = { url: '', key: '' };
const sbOverride = ((): { url?: string; key?: string } | null => { try { return JSON.parse(localStorage.getItem('onshift.sb') ?? 'null'); } catch { return null; } })();
export const SUPABASE_URL: string = (sbOverride?.url ?? SB_DEFAULT.url).replace(/\/$/, '');
export const SUPABASE_KEY: string = sbOverride?.key ?? SB_DEFAULT.key;
