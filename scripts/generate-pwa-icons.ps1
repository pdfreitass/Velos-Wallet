<#
  Gera os ícones da PWA (spec 007, T1) e o favicon.ico a partir da arte da marca.

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
$publicDir = Join-Path $root "web/public"
$outDir = Join-Path $publicDir "icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$icons = @(
  @{ Name = "icon-192.png"; Size = 192 },
  @{ Name = "icon-512.png"; Size = 512 },
  @{ Name = "icon-maskable-512.png"; Size = 512 },
  # iOS pinta a transparência de preto: o fundo da arte já é opaco.
  @{ Name = "apple-touch-icon.png"; Size = 180 }
)
# Tamanhos dentro do favicon.ico (aba do navegador, atalhos do Windows).
$faviconSizes = @(16, 32, 48)

# Redimensiona a arte para um quadrado de $size px e devolve os bytes do PNG.
function ConvertTo-PngBytes([System.Drawing.Image]$image, [int]$size) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $attributes = New-Object System.Drawing.Imaging.ImageAttributes
  $stream = New-Object System.IO.MemoryStream
  try {
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    # Espelhar a borda (TileFlipXY) evita a faixa clara que o bicúbico puxa de fora da imagem.
    $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $graphics.DrawImage($image, $rect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    return , $stream.ToArray()
  }
  finally {
    $stream.Dispose()
    $attributes.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

# Monta um .ico com frames PNG (formato aceito por todos os navegadores atuais).
function Write-Ico([string]$path, [int[]]$sizes, [byte[][]]$frames) {
  $file = [System.IO.File]::Create($path)
  $writer = New-Object System.IO.BinaryWriter($file)
  try {
    $writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$sizes.Count)
    $offset = 6 + 16 * $sizes.Count
    for ($i = 0; $i -lt $sizes.Count; $i++) {
      $side = if ($sizes[$i] -ge 256) { 0 } else { $sizes[$i] }
      $writer.Write([byte]$side); $writer.Write([byte]$side)
      $writer.Write([byte]0); $writer.Write([byte]0)
      $writer.Write([UInt16]1); $writer.Write([UInt16]32)
      $writer.Write([UInt32]$frames[$i].Length); $writer.Write([UInt32]$offset)
      $offset += $frames[$i].Length
    }
    foreach ($frame in $frames) { $writer.Write($frame) }
  }
  finally {
    $writer.Dispose()
    $file.Dispose()
  }
}

$image = [System.Drawing.Image]::FromFile($source)
try {
  foreach ($icon in $icons) {
    $bytes = ConvertTo-PngBytes $image $icon.Size
    [System.IO.File]::WriteAllBytes((Join-Path $outDir $icon.Name), $bytes)
    Write-Output ("{0} {1}x{1}" -f $icon.Name, $icon.Size)
  }

  $frames = [byte[][]]($faviconSizes | ForEach-Object { , (ConvertTo-PngBytes $image $_) })
  Write-Ico (Join-Path $publicDir "favicon.ico") $faviconSizes $frames
  Write-Output ("favicon.ico {0}" -f ($faviconSizes -join ", "))
}
finally {
  $image.Dispose()
}
