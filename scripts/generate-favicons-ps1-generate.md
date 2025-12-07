This script uses ImageMagick or Node to create a set of favicons from `public/logo_blue.png`.

Usage (PowerShell):

1. Install ImageMagick, or ensure Node.js is installed.
2. Run the script:
   ```powershell
   .\scripts\generate-favicon.ps1
   ```
3. The script will write `public/favicon.ico`, `public/favicon-32.png`, `public/favicon-16.png`, and `public/apple-touch-icon-180.png`.

If you're using Docker / CI, add a step to your pipeline to run `npm run gen:favicon` before the build step.
