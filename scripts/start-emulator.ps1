param(
    [string]$Avd = "Pixel_4",
    [string]$Gpu = "host",
    [string]$Dns = "8.8.8.8,1.1.1.1",
    [string]$Scale = "0.5",
    [switch]$WipeData,
    [switch]$NoSnapshot = $true
)

$ErrorActionPreference = "Stop"

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$emu = "$sdk\emulator\emulator.exe"

if (-not (Test-Path $emu)) {
    Write-Error "emulator.exe no encontrado en $emu. Define ANDROID_HOME o instala el SDK en la ruta por defecto."
    exit 1
}

$emuArgs = @("-avd", $Avd, "-gpu", $Gpu, "-dns-server", $Dns)
if ($Scale)      { $emuArgs += @("-scale", $Scale) }
if ($NoSnapshot) { $emuArgs += "-no-snapshot" }
if ($WipeData)   { $emuArgs += "-wipe-data" }

Write-Host "Iniciando $Avd (gpu=$Gpu, dns=$Dns, scale=$Scale)..." -ForegroundColor Cyan
& $emu @emuArgs
