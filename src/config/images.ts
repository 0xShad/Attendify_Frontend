// Centralized list of allowed remote image domains for the frontend (Next.js Image & others).

export const ALLOWED_IMAGE_DOMAINS = [
  // Google Cloud Storage
  "storage.googleapis.com",
  // Add more domains here if your app loads images from additional providers (CDNs, S3, etc.)
];

export const ALLOWED_IMAGE_REMOTE_PATTERNS = [
  {
    protocol: "https",
    hostname: "storage.googleapis.com",
    pathname: "/**",
  },
];
