<#
.SYNOPSIS
    Packages the Relax YouTube extension folder into dist/relax-youtube-store.zip
    with forward-slash zip entries and manifest.json at the zip root.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ExtensionDir = Join-Path $RepoRoot "extension"
$DistDir = Join-Path $RepoRoot "dist"
$ZipPath = Join-Path $DistDir "relax-youtube-store.zip"

if (-not (Test-Path (Join-Path $ExtensionDir "manifest.json"))) {
    throw "manifest.json bulunamadı: $ExtensionDir"
}

if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

if (Test-Path $ZipPath) {
    Remove-Item -Path $ZipPath -Force
}

$Archive = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $Files = Get-ChildItem -Path $ExtensionDir -Recurse -File | Sort-Object FullName
    $BaseUri = [System.Uri](($ExtensionDir.TrimEnd('\', '/') + '\'))

    foreach ($File in $Files) {
        $FileUri = [System.Uri]$File.FullName
        $RelativePath = [System.Uri]::UnescapeDataString($BaseUri.MakeRelativeUri($FileUri).ToString())
        # Ensure forward slashes for cross-platform & Edge Partner Center compatibility
        $EntryName = $RelativePath -replace '\\', '/'

        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $Archive,
            $File.FullName,
            $EntryName,
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
}
finally {
    $Archive.Dispose()
}

$VerifyArchive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
    Write-Host "Paket oluşturuldu: $ZipPath" -ForegroundColor Green
    $ZipInfo = Get-Item $ZipPath
    Write-Host ("Toplam boyut: {0:N0} byte" -f $ZipInfo.Length)
    Write-Host "Zip içeriği:"
    foreach ($Entry in $VerifyArchive.Entries) {
        Write-Host ("  - {0} ({1} bytes)" -f $Entry.FullName, $Entry.Length)
    }
}
finally {
    $VerifyArchive.Dispose()
}
