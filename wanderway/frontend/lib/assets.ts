// lib/assets.ts
// BUG-02 FIX: Logo was at '/src/assets/images/...' which is a source-code path,
// not a valid Next.js public URL. Files in /public are served from the root.
// Move the logo to public/images/ and reference it as '/images/wanderWay_logo.png'.

export const ASSETS = {
    logo: '/images/wanderWay_logo.png',
} as const;

export type AssetKey = keyof typeof ASSETS;