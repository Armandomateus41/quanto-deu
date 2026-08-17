Add-Type -AssemblyName System.Drawing

function New-AppIcon {
  param(
    [int]$Size,
    [string]$Path,
    [double]$LetterScale = 0.55
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 11, 14, 20))

  $fontSize = [Math]::Max(8, [int]($Size * $LetterScale))
  $font = New-Object System.Drawing.Font "Segoe UI", $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 168, 232))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
  $graphics.DrawString("Q", $font, $brush, $rect, $format)

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
  $font.Dispose()
  $brush.Dispose()
  $format.Dispose()

  Write-Output $Path
}

$public = Join-Path (Split-Path $PSScriptRoot -Parent) "public"
New-AppIcon -Size 192 -Path (Join-Path $public "pwa-192x192.png")
New-AppIcon -Size 512 -Path (Join-Path $public "pwa-512x512.png")
New-AppIcon -Size 512 -Path (Join-Path $public "pwa-512x512-maskable.png") -LetterScale 0.42
New-AppIcon -Size 180 -Path (Join-Path $public "apple-touch-icon.png")
