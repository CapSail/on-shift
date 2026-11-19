# Answer-shape cues and story reactions: D4, D5, D6 (2026-11-19)

Measured with `scripts/check-cues-cissp.mjs` on the FIRST/BEST scenes (D4 27, D5 34, D6 23). Chance is 25%.
"Before" is the state at the start of this pass (git HEAD for d4/d5/d6.yaml).

## Cue table, before → after

| Cue | D4 | D5 | D6 |
|---|---|---|---|
| Longest | 23.5 → 20.4 | 20.6 → 16.2 | 23.2 → 18.8 |
| Shortest | 13.0 → 9.3 | 21.6 → 15.7 | 17.4 → 17.4 |
| Most words | 20.7 → 19.4 | 14.2 → 13.5 | 11.6 → 11.6 |
| Most hedge words | 33.3 → 20.4 | 44.9 → 22.8 | 30.4 → 21.7 |
| Most clauses | 39.5 → 13.9 | 34.3 → 16.9 | 29.3 → 18.5 |

Every cue is now at or below 25% in all three domains. Some keys were left as the longest option, or as the one with
the most hedge words (k5-03.4, k5-05.1, k5-07.7, k6-03.6, for example), so that "never pick the longest or most
procedural option" doesn't become a new tell.
No key changed (`a` unchanged), no options were reordered, and no traps moved.

## Scenes changed (options)

D = distractor, K = key. "Source" is the scene's `src`, which still confirms the key and still rules the distractor out.

### D4

| Scene | Change | Source |
|---|---|---|
| k4-01.6 | D0 shortened ("every single server") | RFC 7011; outline 4.1 |
| k4-02.3 | D1 shortened | NIST SP 800-46 Rev. 2 |
| k4-02.6 | D2 now "Connect now with MFA and logging, then add a security policy at contract renewal"; r[2] updated. Still connects before any agreement | NIST SP 800-47 Rev. 1 |
| k4-03.1 | D1 shortened to "NAT on the branch router" | NIST SP 800-215 |
| k4-03.2 | K now "Allow only TLS 1.2 and TLS 1.3 on the load balancer" (same meaning); D0 now keeps all versions and logs their use; r[0] updated | RFC 8996, RFC 7568 |
| k4-03.5 | D2 now a contract confidentiality clause plus a yearly audit: an administrative promise, not protection on the wire; r[2] updated | Outline 4.3; NIST SP 800-47 Rev. 1 |
| k4-03.6 | Trap D0 now a voice VLAN with QoS and ACLs. It still encrypts nothing and doesn't stop spoofing. r[0] updated | RFC 3711; RFC 3261 sec. 26 |
| k4-04.1 | D3 reworded (renaming targets is still obscurity) | RFC 7143 |
| k4-04.6 | D0 now "encryption and authentication ... from TCP" (TCP adds neither); K "evade filters" (was "slip past filters"); r[0] updated | Outline 4.1; OSG ch. 11 |
| k4-05.2 | Trap D0 is now a bigger perimeter with a stricter policy. K is now "Micro-segmentation enforced at each workload" (same meaning) | NIST SP 800-207 sec. 3.1.2 |
| k4-05.4 | D1 is now a network IDS at HQ that sends alerts to the SOC. It still only sees HQ traffic | Outline 4.2; SP 800-46 |
| k4-05.5 | K now "A content delivery network (CDN) for tracking" | Outline 4.1 (CDN) |
| k4-05.6 | D0 now "A stronger firewall policy plus a longer password policy" | Outline 4.1 |
| k4-06.1 | D3 now "same model, from another reseller, with the same setup" | Outline 4.3 |
| k4-06.2 | D3 now "from 9 to 5, on weekdays, and only from home" | NIST SP 800-46 Rev. 2 |
| k4-06.3 | D3 shortened to "Network slicing" | 3GPP TS 33.501 |
| k4-06.6 | D3 now an IPS policy for known exploits, per the vendor advisory. It still can't stop an ordinary outbound upload | NIST SP 800-41 Rev. 1 |

### D5

| Scene | Change | Source |
|---|---|---|
| k5-01.1 | K now "...FIDO2 passkeys for the driver app login" (same) | WebAuthn L3; SP 800-63B-4 |
| k5-01.4 | K now "Verify the caller is really Sanne before enrolling anything" (same: identity verification before recovery); D2 adds "per the help desk process" | SP 800-63A-4 sec. 4; 800-63B-4 sec. 4 |
| k5-02.4 | D0 now says the partner's API "already accepts and checks" OAuth tokens. Still access tokens, not authentication | RFC 6749; OIDC Core |
| k5-02.5 | D0 is now "reset, then wait" | SP 800-63B-4 sec. 5 |
| k5-03.5 | D1 now "Buy an identity management tool, and automate the review process" | Outline 5.1; SP 800-53 AC-2(j) |
| k5-04.1 | D1 adds "and fix the process". Root cause comes after containment | SP 800-53 AC-2, PS-4 |
| k5-04.2 | D2 adds "per policy" | SP 800-53 PS-5 |
| k5-04.3 | D0 now "Delete it today per the account policy, since it has no owner". D3 now "Change its password, then email it to the routing team, and keep its rights". r[3] updated | Outline 5.5; SP 800-53 AC-6, IA-5 |
| k5-04.4 | K now "Identities themselves are assets to be managed and protected" (same) | Outline 5.1 |
| k5-05.3 | D2 adds "with a documented change request after the fact" | SP 800-53 AC-2(4) |
| k5-05.5 | K now "forge valid tickets for any user or service in the realm" (same: forged TGTs) | RFC 4120 |
| k5-06.2 | D3 now "Role-based access control, with a policy per role" (still static per role, no live risk) | NIST CSRC RAdAC |
| k5-06.3 | D0 now "The policy enforcement point, which applies the access policy per session, at the gateway" (the PEP still enforces, it doesn't decide) | SP 800-207 sec. 3 |
| k5-06.4 | Trap D1 now deletes the rule, resets the password and then checks the mailbox. The session is still not revoked | Outline 5.1/7.6; SP 800-61r3 |
| k5-07.1 | D2 shortened. D3 now "Its password is old, short, and weak" | OSG ch. 13; SP 800-53 IA-2 |
| k5-07.3 | D1 reworded (template sent and checked at the server: still false for FIDO) | FIDO passkeys; WebAuthn L3 |
| k5-07.5 | D2 adds "per the upgrade plan" (still a shared account) | Outline 5.2; SP 800-53 AC-2(2) |

### D6

| Scene | Change | Source |
|---|---|---|
| k6-01.1 | D0 now "...has approved the plan" (Dale still isn't the owner) | SP 800-115 App. B |
| k6-01.6 | D2 now "Note it in the final report, per the agreed plan, due in three weeks" | SP 800-115 App. B; SP 800-61r3 |
| k6-02.1 | D1 now "Block her account, ignore the email, and log it, since she wasn't authorized"; r[1] updated | ISO/IEC 29147; outline 6.4 |
| k6-04.4 | D3 now "own risk questionnaire, per policy" (still a self-assessment, not independent) | AICPA SOC 2; ISO/IEC 27001 |
| k6-05.1 | D1 adds "and credit her" (still publishes before the fix) | ISO/IEC 29147; CISA CVD |
| k6-05.5 | K now "Get Priya's sign-off, an agreed scope and a stop word" (same: management authorization, scope, a way to stop; Priya is the COO). D3 now "since risk policy never allows..." | Outline 6.2; SP 800-115 App. B |

## Story reactions added

- `rr` (rank/sort/spot): 22. D4: k4-01.1, 01.2, 01.4, 02.2, 02.4, 03.4, 04.3, 05.1, 06.4. D5: k5-01.2, 02.1, 02.3,
  03.1, 03.3, 04.5, 07.2. D6: k6-01.3, 02.2, 02.3, 03.1, 04.3, 04.6.
- `r` (calc): 2 scenes, 8 strings: k6-02.4 and k6-03.2. Each wrong number names its mistake.
- Total: 24 scenes, 52 strings. The validator shows 0 errors and 0 warnings for D4, D5 and D6.
