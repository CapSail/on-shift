// Deployment settings that are not game logic.

/** GitHub repo that receives "Report this answer" issues. */
export const REPO = 'CapSail/on-shift';

/**
 * Optional e-mail fallback for people without a GitHub account. Leave empty to hide it; when set, the address is
 * shown as text and as a mailto link on every report. It is public, so use an address you are happy to publish.
 */
export const REPORT_EMAIL = 'jrsjordans@gmail.com';

/** "0.1.0+abc1234": package version plus the commit it was built from ("dev" locally). Injected by Vite. */
export const APP_VERSION: string = __APP_VERSION__;
