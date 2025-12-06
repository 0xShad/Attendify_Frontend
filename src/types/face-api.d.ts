// Lightweight ambient module declaration for @vladmandic/face-api
// The project uses the @vladmandic fork at runtime. Provide a broad "any" module
// so TypeScript doesn't error on dynamic imports. This keeps types loose but
// avoids build-time failures while we progressively add stricter types if needed.
declare module '@vladmandic/face-api' {
  const content: any;
  export = content;
}

// Backwards-compat shim for any lingering imports that still reference
// the original package name. Prefer using '@vladmandic/face-api' in code.
declare module 'face-api.js' {
  const content: any;
  export = content;
}
