# Leaderboard setup (Supabase, free tier, about 10 minutes)

The app already contains the leaderboard: the Friends screen, name setting, join-by-code, boards (Daily, Week XP, All-time, Streak, Dex, Accuracy, Boss), offline queue and a cached roster. It stays switched off until it has a backend, and the game works fine without one.

## What was decided (Phase 4 in `PROJECT_BRIEF.md`)

- **Friends-only, no accounts.** Everyone signs in anonymously (no e-mail, no password), then joins with a group code and picks a name. A lost phone is a new player (matches "lose the device = start over").
- **Everyone sees the full roster**, including friends with 0 XP ("hasn't clocked in").
- **No one writes to tables directly.** All writes go through functions in `supabase/schema.sql` that check membership and sanity-check numbers (score <= alerts, plausible XP, first daily result wins).
- **Offline-first.** The game never waits for the network. Your stats are a snapshot pushed whenever you finish something and are online; the last roster is cached.

## Steps

1. Create a free project at supabase.com (any name, any region near you). Wait for it to finish provisioning.
2. **Authentication -> Sign In / Providers -> enable "Allow anonymous sign-ins".**
3. **SQL Editor -> New query -> paste all of `supabase/schema.sql` -> Run.**
   Before running, change `CHANGE-ME-NIGHTSHIFT` to your group code. (Change it later with `update app_config set value = 'NEW' where key = 'invite_code';`.)
4. **Project Settings -> API:** copy the **Project URL** and the **anon public key** (both are safe to publish; the row-level-security rules are what protect the data).
5. Put them in `src/config.ts` (`SB_DEFAULT = { url, key }`), run `npm test`, then `npm run deploy`.
6. Open the app -> **FRIENDS** -> pick a name, enter the group code, join. Share the code with friends.

## Operating notes

- To remove someone: `delete from players where name = 'Name';` (their stats and daily results go with them).
- A friend who loses their phone joins again as a new player; if they want the same name, delete the old row first.
- Rotate the code any time; existing members stay in.
- The free tier pauses a project after a week of no traffic; opening the app once wakes it.
