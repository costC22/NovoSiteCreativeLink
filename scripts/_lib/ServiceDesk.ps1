param(
    [string]$Root,
    [string]$LogDir,
    [string]$HealthFile,
    [int]$DiskWarnPercent = 85
)

$ErrorActionPreference = 'Stop'

$health = @{
    servico   = 'service-desk'
    timestamp = (Get-Date).ToString('o')
    alertas   = @()
    ok        = @()
}

$disk = Get-PSDrive -Name C -ErrorAction SilentlyContinue
if ($disk) {
    $used = [math]::Round((1 - ($disk.Free / ($disk.Used + $disk.Free))) * 100, 1)
    if ($used -ge $DiskWarnPercent) {
        $health.alertas += "Disco C: ${used}% usado"
    } else {
        $health.ok += "Disco C: ${used}%"
    }
}

$svcScripts = Join-Path $Root 'services'
$scripts = Get-ChildItem $svcScripts -Filter '*.bat' -ErrorAction SilentlyContinue
$health.ok += ('Scripts disponiveis: ' + @($scripts).Count)

$errCount = 0
Get-ChildItem $LogDir -Filter '*.log' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 20 |
    ForEach-Object {
        $errCount += @(Select-String -Path $_.FullName -Pattern '\[ERROR\]' -SimpleMatch -ErrorAction SilentlyContinue).Count
    }

if ($errCount -gt 0) {
    $health.alertas += "Erros recentes em logs: $errCount"
} else {
    $health.ok += 'Sem erros recentes nos logs'
}

$health.status = if ($health.alertas.Count -eq 0) { 'operacional' } else { 'atencao' }
$health | ConvertTo-Json -Depth 4 | Set-Content $HealthFile -Encoding UTF8

Write-Host ('Status: ' + $health.status)
if ($health.alertas.Count -gt 0) { exit 2 }
exit 0
