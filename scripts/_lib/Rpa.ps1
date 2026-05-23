param(
    [string]$WatchFolder,
    [string]$ArchiveFolder,
    [string]$LogFile,
    [string]$RunId
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $WatchFolder, $ArchiveFolder | Out-Null

$actions = @()
Get-ChildItem $WatchFolder -File -ErrorAction SilentlyContinue | ForEach-Object {
    $dest = Join-Path $ArchiveFolder ($_.BaseName + '_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + $_.Extension)
    Move-Item $_.FullName $dest -Force
    $actions += @{ arquivo = $_.Name; destino = $dest; status = 'arquivado' }
}

if (-not $actions.Count) {
    $demo = Join-Path $WatchFolder "rpa_demo_$RunId.txt"
    'Processado por ByteStorm RPA' | Set-Content $demo -Encoding UTF8
    $dest = Join-Path $ArchiveFolder (Split-Path $demo -Leaf)
    Move-Item $demo $dest -Force
    $actions += @{ arquivo = (Split-Path $demo -Leaf); destino = $dest; status = 'demo_criado' }
}

@{
    servico     = 'rpa'
    processados = $actions.Count
    itens       = $actions
} | ConvertTo-Json -Depth 4 | Set-Content $LogFile -Encoding UTF8

Write-Host ('OK: ' + $actions.Count + ' arquivo(s) processado(s)')
exit 0
