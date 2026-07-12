$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$designDir = Join-Path $root "design"
$outputRoot = Join-Path $root "assets\extracted"

if (-not (Test-Path -LiteralPath $designDir)) {
    throw "Design directory not found: $designDir"
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$pattern = 'data:image/(?<type>[a-zA-Z0-9.+-]+);base64,(?<data>[A-Za-z0-9+/=]+)'
$total = 0

Get-ChildItem -LiteralPath $designDir -Filter *.svg | Sort-Object Name | ForEach-Object {
    $svg = $_
    $safeName = [IO.Path]::GetFileNameWithoutExtension($svg.Name).ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $screenDir = Join-Path $outputRoot $safeName
    New-Item -ItemType Directory -Force -Path $screenDir | Out-Null

    $content = Get-Content -LiteralPath $svg.FullName -Raw
    $matches = [regex]::Matches($content, $pattern)
    $index = 1

    foreach ($match in $matches) {
        $type = $match.Groups["type"].Value.ToLowerInvariant()
        $extension = switch ($type) {
            "jpeg" { "jpg" }
            "svg+xml" { "svg" }
            default { $type }
        }

        $fileName = "image-{0:D2}.{1}" -f $index, $extension
        $outputPath = Join-Path $screenDir $fileName
        [IO.File]::WriteAllBytes($outputPath, [Convert]::FromBase64String($match.Groups["data"].Value))
        $index++
        $total++
    }
}

Write-Host "Extracted $total embedded image asset(s) into $outputRoot"
