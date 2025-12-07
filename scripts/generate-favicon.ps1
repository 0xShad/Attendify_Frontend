# PowerShell wrapper: Generate favicon.ico using Node script or ImageMagick
param(
  [string]$LogoPath = "public/logo_blue.png",
  [string]$OutPath = "public/favicon.ico"
)

if (Get-Command magick -ErrorAction SilentlyContinue) {
  Write-Host "ImageMagick found. Generating ICO using magick..."
  magick $LogoPath -define icon:auto-resize=64,48,32,16 $OutPath
  Exit $LASTEXITCODE
}

if (Get-Command node -ErrorAction SilentlyContinue) {
  Write-Host "Falling back to Node script to generate ICO..."
  node .\scripts\generate-favicon.js
  Exit $LASTEXITCODE
}

Write-Error "Neither ImageMagick nor Node is available. Install ImageMagick or Node to run this script.";
Exit 1
