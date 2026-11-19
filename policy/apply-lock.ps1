<#
.SYNOPSIS
    Microsoft Edge için resmi ExtensionInstallForcelist zorunlu eklenti kilidini uygular.
    Yönetici (Administrator) yetkisi gerektirir.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, HelpMessage = "Edge Add-ons Store üzerindeki 32 karakterlik (a-p) Extension ID.")]
    [ValidatePattern('^[a-p]{32}$')]
    [string]$ExtensionId,

    [switch]$KeepInPrivate,

    [switch]$KeepGuestMode
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$Principal = New-Object Security.Principal.WindowsPrincipal($Identity)
if (-not $Principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "HATA: Bu script Yönetici (Administrator) olarak çalıştırılmalıdır." -ForegroundColor Red
    Write-Host "PowerShell'e sağ tıklayıp 'Yönetici olarak çalıştır' seçeneğini kullanın." -ForegroundColor Yellow
    exit 1
}

$EdgePolicyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
$ForceListPath = Join-Path $EdgePolicyPath "ExtensionInstallForcelist"
$UpdateUrl = "https://edge.microsoft.com/extensionwebstorebase/v1/crx"
$PolicyValue = "$ExtensionId;$UpdateUrl"

if (-not (Test-Path $EdgePolicyPath)) {
    New-Item -Path $EdgePolicyPath -Force | Out-Null
}
if (-not (Test-Path $ForceListPath)) {
    New-Item -Path $ForceListPath -Force | Out-Null
}

$ForceListKey = Get-Item -Path $ForceListPath
$ExistingNames = @($ForceListKey.GetValueNames())

$TargetIndexName = $null
$MaxNumericIndex = 0

foreach ($Name in $ExistingNames) {
    $ParsedInt = 0
    if ([int]::TryParse($Name, [ref]$ParsedInt) -and $ParsedInt -gt $MaxNumericIndex) {
        $MaxNumericIndex = $ParsedInt
    }
    $CurrentVal = [string]$ForceListKey.GetValue($Name, "")
    if ($CurrentVal -eq $ExtensionId -or $CurrentVal.StartsWith("$ExtensionId;")) {
        $TargetIndexName = $Name
    }
}

if (-not $TargetIndexName) {
    $TargetIndexName = [string]($MaxNumericIndex + 1)
}

New-ItemProperty -Path $ForceListPath -Name $TargetIndexName -Value $PolicyValue -PropertyType String -Force | Out-Null

if (-not $KeepInPrivate) {
    New-ItemProperty -Path $EdgePolicyPath -Name "InPrivateModeAvailability" -Value 1 -PropertyType DWord -Force | Out-Null
}

if (-not $KeepGuestMode) {
    New-ItemProperty -Path $EdgePolicyPath -Name "BrowserGuestModeEnabled" -Value 0 -PropertyType DWord -Force | Out-Null
}

Write-Host ""
Write-Host "Zorunlu Edge kilidi başarıyla uygulandı." -ForegroundColor Green
Write-Host "  Kayıt Yolu : $ForceListPath"
Write-Host "  Değer [$TargetIndexName] : $PolicyValue"

if (-not $KeepInPrivate) {
    Write-Host "  InPrivate  : Devre Dışı (InPrivateModeAvailability = 1)"
} else {
    Write-Host "  InPrivate  : Değiştirilmedi (-KeepInPrivate seçildi)"
}

if (-not $KeepGuestMode) {
    Write-Host "  Misafir    : Devre Dışı (BrowserGuestModeEnabled = 0)"
} else {
    Write-Host "  Misafir    : Değiştirilmedi (-KeepGuestMode seçildi)"
}

Write-Host ""
Write-Host "Doğrulama adımları:" -ForegroundColor Cyan
Write-Host "  1. Microsoft Edge'i tamamen kapatıp yeniden açın (gerekirse Görev Yöneticisinden msedge.exe'yi sonlandırın)."
Write-Host "  2. edge://policy adresine gidip 'İlkeleri yeniden yükle' (Reload policies) butonuna basın."
Write-Host "  3. edge://extensions sayfasında 'Relax YouTube' eklentisinin 'Kuruluşunuz tarafından yönetiliyor' olarak kilitlendiğini doğrulayın."
