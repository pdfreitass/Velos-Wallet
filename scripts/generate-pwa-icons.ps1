<#
  Gera os ícones da PWA (spec 007, T1) a partir da arte da marca.

  A arte velos-escuro.png (1080x1080) tem fundo verde profundo de ponta a ponta e o símbolo centrado
  a no máximo 33,5% do centro, dentro do círculo seguro do maskable (40%). Por isso a mesma arte
  serve para "any" e "maskable", sem margem extra. Usa System.Drawing (já vem no Windows), sem
  dependência nova. Rodar da raiz do repositório:

    powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1
#>
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "web/public/brand/velos-escuro.png"
$outDir = Join-Path $root "web/public/icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$icons = @(
  @{ Name = "icon-192.png"; Size = 192 },
  @{ Name = "icon-512.png"; Size = 512 },
  @{ Name = "icon-maskable-512.png"; Size = 512 },
  # iOS pinta a transparência de preto: o fundo da arte já é opaco.
  @{ Name = "apple-touch-icon.png"; Size = 180 }
)

$image = [System.Drawing.Image]::FromFile($source)
try {
  foreach ($icon in $icons) {
    $size = $icon.Size
    $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      # Espelhar a borda (TileFlipXY) evita a faixa clara que o bicúbico puxa de fora da imagem.
      $attributes = New-Object System.Drawing.Imaging.ImageAttributes
      $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
      $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
      $graphics.DrawImage($image, $rect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)

      $path = Join-Path $outDir $icon.Name
      $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Output ("{0} {1}x{1}" -f $icon.Name, $size)
    }
    finally {
      if ($attributes) { $attributes.Dispose() }
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
}
finally {
  $image.Dispose()
}
