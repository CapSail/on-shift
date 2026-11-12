# After Hours deck (40 alerts)

A separate, optional deck of real-life scenarios for off-the-clock play: scam texts and calls, account takeovers, home network and device hygiene. Files: `content/alerts16.yaml` (ah01-ah20, scams and social engineering) and `content/alerts17.yaml` (ah21-ah40, accounts, devices, home network), with their concepts in `content/concepts_f1.yaml` and `content/concepts_f2.yaml`. 19 are true positives, 21 benign, with twins for the main concepts. Domain `home`, `deck: afterhours` (the validator requires both together).

## Status

- Validation, lints and all tests pass.
- **Reviewed by a human expert (confirmed by Jordan, 2026-11-12).** The writers kept real-world details generic where unsure. Points they flagged, kept here as the record of what was checked:
  - ATT&CK mappings are loose for home scenarios: T1111 (SIM swap), T1584.008 (router DNS), T1056 (stalkerware), T1657 (wallet drain), T1583.008. ah06/ah07 use T1598.004 because T1656 is deprecated in v20.1.
  - Generic wording for toll-text smishing, voice-clone family calls, cheque funds showing available before clearing, refund-overpay support calls, and permit/allowance expiry.
  - An extension that gains permissions makes the browser ask again (ah37).
  - Brand names (Discord, Steam) appear only as platform names; apps, malware and people are fictional.

## How it is kept separate

`ALERTS` and `POOL` exclude it, so work rounds, the daily, the boss and incidents never include it. It has its own rematches, gives no crew intel and does not move the work difficulty tier. Fixes keep the alert `id`.
