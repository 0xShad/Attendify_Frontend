# Frontend Image Domain Policy

This document describes the central list of allowed remote image domains for the frontend, how it is used, and the expectations when adding new domains.

## Purpose
- Provide a single source of truth for allowed remote image domains for Next.js `<Image>` and other image components.
- Make it easy to add new domains and keep the `next.config.ts` image config in sync.

## Where it lives
- `src/config/images.ts` — exports `ALLOWED_IMAGE_DOMAINS` and `ALLOWED_IMAGE_REMOTE_PATTERNS`.
- `next.config.ts` imports `ALLOWED_IMAGE_DOMAINS` and `ALLOWED_IMAGE_REMOTE_PATTERNS` so that Next.js can use this config during the build.

## Current Allowed Domains
- `storage.googleapis.com` — Google Cloud Storage public objects & signed URLs.

## Adding new domains
1. Add the domain or pattern to `src/config/images.ts`:
   - Add a domain to `ALLOWED_IMAGE_DOMAINS`.
   - Or add a remotePattern object to `ALLOWED_IMAGE_REMOTE_PATTERNS` (recommended for precise control).

2. Ensure you also add documentation to this file or an architectural doc explaining why the domain is allowed and whether the objects are public or privately signed.

3. If your domain uses signed URLs or authentication, prefer using a server-side proxy endpoint so the frontend does not require direct access.

4. If you want the domain to be allowed by Next.js `Image` component, confirm that `next.config.ts` is using the `ALLOWED_IMAGE_DOMAINS` and/or `ALLOWED_IMAGE_REMOTE_PATTERNS` as shown.

## Security note
- Be mindful of allowing arbitrary domains. If the application is allowed to load images from arbitrary user-supplied domains, consider whitelisting only well-known providers to avoid CSRF/CSP/Content Security issues.

## Troubleshooting
- If an image fails to load but the domain is whitelisted, check CSP rules, CDN config, signed URL expiry, and whether the object is public or private.

## Example
The repo currently contains the following config:

`src/config/images.ts`:
```ts
export const ALLOWED_IMAGE_DOMAINS = [
  'storage.googleapis.com',
];

export const ALLOWED_IMAGE_REMOTE_PATTERNS = [
  { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/**' },
];
```

---

If you have questions or need a new domain added, please add a PR with the rationale and deployers can review the request.
