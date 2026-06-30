$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$outputPath = "d:\V1\assets\branded-splash.png"
$sourcePath = "d:\V1\assets\001.png"
$width = 1290
$height = 2796
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

try {
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $backgroundColor = ([System.Drawing.Bitmap]$sourceImage).GetPixel(0, 0)
  $graphics.Clear($backgroundColor)

  $centerFormat = New-Object System.Drawing.StringFormat
  $centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

  $iconX = ($width - $sourceImage.Width) / 2
  $iconY = 420
  $graphics.DrawImage($sourceImage, $iconX, $iconY, $sourceImage.Width, $sourceImage.Height)

  $titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 26, 93))
  $subtitleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 122, 136, 165))
  $titleFont = New-Object System.Drawing.Font "Segoe UI", 84, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font "Segoe UI", 40, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $titleRect = New-Object System.Drawing.RectangleF 0, ($iconY + $sourceImage.Height + 20), $width, 120
  $subtitleRect = New-Object System.Drawing.RectangleF 0, ($iconY + $sourceImage.Height + 120), $width, 80
  $graphics.DrawString("SCHOLAR", $titleFont, $titleBrush, $titleRect, $centerFormat)
  $graphics.DrawString("Smart Academic Advisor", $subtitleFont, $subtitleBrush, $subtitleRect, $centerFormat)

  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  if ($subtitleFont) { $subtitleFont.Dispose() }
  if ($titleFont) { $titleFont.Dispose() }
  if ($subtitleBrush) { $subtitleBrush.Dispose() }
  if ($titleBrush) { $titleBrush.Dispose() }
  if ($centerFormat) { $centerFormat.Dispose() }
  if ($sourceImage) { $sourceImage.Dispose() }
  if ($graphics) { $graphics.Dispose() }
  if ($bitmap) { $bitmap.Dispose() }
}

Write-Output "Created $outputPath"
