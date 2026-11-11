# ON SHIFT — Technical Accuracy Review

## Overall verdict

Strong content. The log fields, event IDs, access masks, encryption types,
Impacket/LOLBin fingerprints, Entra/CloudTrail/KQL sources, and tells are
overwhelmingly correct and the voice is on point. **Every `x:` value in all
four files exists and is live in this ATT&CK v20 dataset** — no revoked or
deprecated IDs were used, and the content correctly uses the post-revocation
tree (T1685.x for Impair Defenses/log clearing, T1684.001 for Impersonation).

Problems are concentrated in a handful of **ATT&CK mappings for email/BEC and
discovery alerts**, one **misleading technical teaching value (an LSASS access
mask)**, and a set of alerts whose **titles pre-classify the activity**,
blunting difficulty for an expert audience.

---

## Alerts with a problem (id · issue · severity · fix)

### c12 — External Teams chat → "accept Quick Assist"  **[WRONG]**
Mapped `x: T1566.004` (Spearphishing **Voice**), but the lure is a **Teams
chat message**, not a phone/voice call. The email-bomb-then-Teams-"IT" play
(Black Basta/3AM, called out correctly in the tell) is third-party-service
phishing.
- **Fix:** `x: T1566.003`  (Spearphishing via Service)

### inc_akira step 2 (`inc_akira_1`) — AdFind enumeration  **[WRONG/misleading]**
Mapped `x: T1087.002` (Account Discovery: Domain **Account**), but the two
commands shown enumerate **computers** (`objectcategory=computer`) and
**domain trusts** (`-sc trustdmp`) — not accounts. Akira's documented AdFind
usage is trust/system discovery.
- **Fix:** `x: T1482` (Domain Trust Discovery) — best single fit for the
  headline "computers + trusts"; alternatively `T1018` (Remote System
  Discovery). If you want to keep T1087.002, change the command to an account
  query, e.g. `AdFind.exe -f "(objectcategory=user)" > u.txt`.

### e09 — MsSense.exe opens LSASS, "read-only" mask 0x1410  **[MISLEADING — technical]**
The verdict (benign EDR) and lesson are fine, but `granted access: 0x1410` is
itself a **canonical Mimikatz `sekurlsa` LSASS mask** (PROCESS_VM_READ |
PROCESS_QUERY_(LIMITED_)INFORMATION). Calling 0x1410 "read-only / just the
sensor" teaches an expert the wrong discriminator — the real tell is the
signed path/image (MsSense.exe in the Defender ATP folder), not the mask.
- **Fix:** change the mask to one that is genuinely innocuous for the sensor,
  e.g. `granted access: 0x1000` (PROCESS_QUERY_LIMITED_INFORMATION) or
  `0x101000`, OR keep 0x1410 and rewrite the tell to say the differentiator is
  the **source image/signer**, explicitly noting 0x1410 is also what Mimikatz
  requests. Do **not** leave "read-only access mask 0x1410" as the taught cue.

### m03 — Vendor email, lookalike `realvend0r.com`, banking change  **[MISLEADING]**
Mapped `x: T1566.002` (Spearphishing **Link**), but no link is present — the
log describes a lookalike-sender BEC with a hijacked thread and "updated
banking details." This is sender impersonation / vendor email compromise.
- **Fix:** `x: T1684.001` (Impersonation). (Consistent with how the rest of
  the set treats BEC impersonation.)

### m07 — Reply-chain hijack, "see attached"  **[MISLEADING/weak]**
Mapped `x: T1566.001` (Spearphishing **Attachment**), but the log says the
lure is a **link** to a OneDrive-lookalike hosting a password ZIP.
- **Fix:** either `x: T1566.002` (Spearphishing Link) to match the artifact,
  or change the log line to a genuine attachment (e.g.
  `attachment: Invoice_scan.zip (password-protected)`) to keep T1566.001.

### inc_apt29 step 3 (`inc_apt29_2`) — App granted `full_access_as_app`  **[WEAK]**
Mapped `x: T1098.003` (Additional Cloud **Roles**). For an Exchange Online
application permission that yields mailbox access, APT29's documented behavior
is modeled as **T1098.002 (Additional Email Delegate Permissions)**, which is
more precise and is explicitly in G0016's technique set.
- **Fix (optional but recommended):** `x: T1098.002`

### inc_apt29 step 7 (`inc_apt29_6`) — New app registration "Microsoft Graph Sync Service"  **[WEAK]**
Mapped `x: T1136.003` (Create Account: Cloud **Account**). Registering a
malicious OAuth app / service principal is not creating a user account; the
backdoor value here is the added application credential/permission.
- **Fix (optional):** `x: T1098.001` (Additional Cloud Credentials), or keep
  T1136.003 only if you reframe the artifact as creating a user identity.

### i15 — Legacy-auth IMAP sign-ins, one IP → 30 users  **[WEAK]**
Mapped `x: T1078.004` (Cloud Accounts). The described behavior (one IP, 140
sign-ins across 30 users) is a **spray over legacy auth**.
- **Fix (optional):** `x: T1110.003` (Password Spraying) is a stronger fit for
  the observed pattern; T1078.004 is defensible if you emphasize the MFA
  bypass rather than the spray.

### i18 — Okta admin impersonation grant after phone reset  **[WEAK]**
`x: T1078.004` is thin for an `user.session.impersonation.grant`. The root
cause is help-desk social engineering.
- **Fix (optional):** `x: T1684.001` (Impersonation), matching i05 / inc_spider.

### i05 — MFA phone method added then SSPR reset  **[WEAK/minor]**
`x: T1098.005` (Device Registration) is acceptable; adding a **phone** security
method is arguably `T1556.006` (Multi-Factor Authentication). Minor — either is
defensible. No change required.

---

## Mappings reviewed and confirmed correct (highlights)
e01 T1003.001 (comsvcs MiniDump of lsass PID — syntax correct) · e05/e06 base64
decodes correctly to IEX / $errorAction · e08 0x1fffff = PROCESS_ALL_ACCESS ·
e17 BTOBTO + `\\127.0.0.1\C$\__output` = smbexec · e29 `\\127.0.0.1\ADMIN$\__<ts>`
= wmiexec · e26 1102 → T1685.005 · e27 ntdsutil IFM → T1003.003 · e30 OneDrive
sideload → T1574.001 · i10 4769 enc 0x17 (RC4) → T1558.003 · i11 NTLM key
length 0 → T1550.002 · i13/i14 DS-Replication-Get-Changes-All → T1003.006 ·
c04 Graph MailItemsAccessed → T1114.002 · c07 runCommand → T1651 · c09
StopLogging → T1685.002 · l06 kdevtmpfsi/supportxmr → T1496 · l08 T1685.006 ·
l09 privileged pod → T1611 · n11 aspnet_client webshell → T1505.003. Incident
TTPs match public reporting for **Scattered Spider** (help-desk reset+MFA wipe,
SharePoint runbook search, ScreenConnect/ngrok, federated domain, ESXi SSH),
**APT29** (low-and-slow spray via residential proxies, OAuth app abuse, EWS
mail reading), **Volt Typhoon** (FortiOS/KV-botnet entry, firewall LDAP service
account, wevtutil log enum, vssadmin+copy ntds.dit, netsh portproxy, IT→OT RDP),
and **Akira** (no-MFA Cisco VPN, ntdsutil IFM, rclone→MEGA, shadow-copy deletion
via PsExec). x03 BYOVD→T1687 is a reasonable v20 fit (could add T1685 for the
Sense-service stop).

---

## Too easy for an expert (title/giveaway reveals the answer)

| id | giveaway | suggestion |
|----|----------|------------|
| e01 | title "Suspicious rundll32 MiniDump" **and** `note: PID 724 = lsass.exe` spell out the kill | Drop the "PID 724 = lsass.exe" note; retitle neutrally ("rundll32 comsvcs.dll execution"). Make the analyst recognize comsvcs MiniDump + an LSASS-range PID. |
| e03 | title "Office app spawned LOLBin" + certutil in clear | Retitle to the raw source ("Sysmon process create: certutil"); let Word-parent + `.txt`→`.exe` carry it. |
| e20 | title "Regsvr32 network activity", single Squiblydoo line, no benign pair | Retitle to "regsvr32 execution"; consider adding a benign regsvr32 FP pair (legit COM DLL registration) so it becomes a discrimination call. |
| l01 | title literally "Reverse shell" | Retitle "auditd: php-fpm child exec"; keep `/dev/tcp` as the tell the player must spot. |
| e21 | `.akira` extension names the ransomware family in the artifact | Use a generic/random extension (e.g. `.docx → .docx.6h1k9`) + readme; keep the "new ext on every file + readme per folder" as the real tell. |

**Pattern to watch generally:** many titles pre-classify the activity
("Kerberoasting tool pattern", "DNS tunneling", "AMSI bypass attempt",
"Webshell access pattern", "Credential theft script block", "Shadow copy
deletion"). These play fair **only** because most are paired with a benign
counterpart (e.g. e34/e35, c05/c06, i03/i04), making the real task TP-vs-FP
discrimination rather than "name the technique." The weakest are the ones above
that combine a technique-naming title **with no benign pair and a giveaway in
the log**. Recommend neutralizing titles to the log source for ~20-30% of
single (unpaired) cards so expert players must read the evidence, not the
headline.
