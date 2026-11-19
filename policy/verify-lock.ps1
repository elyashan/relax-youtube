<#
.SYNOPSIS
    Microsoft Edge zorunlu kilit politikalarının mevcut durumunu salt-okunur olarak kontrol eder.
    Yönetici yetkisi gerektirmez.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$EdgePolicyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
$ForceListPath = Join-Path $EdgePolicyPath "ExtensionInstallForcelist"

Write-Host "=== Microsoft Edge Zorunlu Kilit Durumu ===" -ForegroundColor Cyan

if (-not (Test-Path $EdgePolicyPath)) {
    Write-Host "Edge Politika Anahtarı : Bulunamadı ($EdgePolicyPath)" -ForegroundColor Yellow
    Write-Host "Zorunlu Eklenti Kilidi : PASİF" -ForegroundColor Yellow
    Write-Host "InPrivate Engeli       : PASİF (Varsayılan)" -ForegroundColor Yellow
    Write-Host "Misafir Modu Engeli    : PASİF (Varsayılan)" -ForegroundColor Yellow
    exit 0
}

$EdgeKey = Get-Item -Path $EdgePolicyPath

# 1. ExtensionInstallForcelist kontrolü
if (Test-Path $ForceListPath) {
    $ForceKey = Get-Item -Path $ForceListPath
    $ValueNames = @($ForceKey.GetValueNames() | Sort-Object)
    if ($ValueNames.Count -gt 0) {
        Write-Host "Zorunlu Eklenti Kilidi : AKTİF ($($ValueNames.Count) kayıt)" -ForegroundColor Green
        foreach ($Name in $ValueNames) {
            $Val = [string]$ForceKey.GetValue($Name, "")
            Write-Host "  [$Name] $Val"
        }
    } else {
        Write-Host "Zorunlu Eklenti Kilidi : PASİF (ExtensionInstallForcelist boş)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Zorunlu Eklenti Kilidi : PASİF (ExtensionInstallForcelist anahtarı yok)" -ForegroundColor Yellow
}

# 2. InPrivateModeAvailability kontrolü
$InPrivateVal = $EdgeKey.GetValue("InPrivateModeAvailability", $null)
if ($InPrivateVal -eq 1) {
    Write-Host "InPrivate Engeli       : AKTİF (InPrivateModeAvailability = 1)" -ForegroundColor Green
} elseif ($null -eq $InPrivateVal) {
    Write-Host "InPrivate Engeli       : PASİF (Tanımlı değil)" -ForegroundColor Yellow
} else {
    Write-Host "InPrivate Engeli       : ÖZEL DEĞER (InPrivateModeAvailability = $InPrivateVal)" -ForegroundColor Yellow
}

# 3. BrowserGuestModeEnabled kontrolü
$GuestVal = $EdgeKey.GetValue("BrowserGuestModeEnabled", $null)
if ($GuestVal -eq 0) {
    Write-Host "Misafir Modu Engeli    : AKTİF (BrowserGuestModeEnabled = 0)" -ForegroundColor Green
} elseif ($null -eq $GuestVal) {
    Write-Host "Misafir Modu Engeli    : PASİF (Tanımlı değil)" -ForegroundColor Yellow
} else {
    Write-Host "Misafir Modu Engeli    : ÖZEL DEĞER (BrowserGuestModeEnabled = $GuestVal)" -ForegroundColor Yellow
}
