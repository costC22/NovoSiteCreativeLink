param(
    [string]$Root,
    [string]$ReportTxt,
    [string]$ReportHtml,
    [string]$Company = 'ByteStorm Tech'
)

$ErrorActionPreference = 'Stop'

$services = Get-ChildItem (Join-Path $Root 'services') -Filter '*.bat'
$recommendations = @(
    @{ processo = 'Relatorios manuais diarios'; impacto = 'Alto'; solucao = '04-etl-dados.bat + 06-email-notificacoes.bat' }
    @{ processo = 'Copia de dados entre sistemas'; impacto = 'Alto'; solucao = '10-integracao-sistemas.bat' }
    @{ processo = 'Arquivos em pasta compartilhada'; impacto = 'Medio'; solucao = '05-rpa.bat' }
    @{ processo = 'Planilhas consolidadas'; impacto = 'Medio'; solucao = '07-planilhas.bat' }
)

$diag = @{
    empresa         = $Company
    data            = (Get-Date).ToString('dd/MM/yyyy HH:mm')
    scripts         = @($services | ForEach-Object { $_.Name })
    recomendacoes   = $recommendations
    proximos_passos = @(
        'POC em 1 processo',
        'Medir ROI em horas salvas',
        'Agendar rotina com 03-rotinas-agendadas.bat'
    )
}

$txt = @(
    'DIAGNOSTICO BYTESTORM TECH - AUTOMACAO',
    '========================================',
    "Data: $($diag.data)",
    '',
    'Scripts disponiveis:'
)
$diag.scripts | ForEach-Object { $txt += "  - $_" }
$txt += ''
$txt += 'Recomendacoes por impacto:'
$recommendations | ForEach-Object { $txt += "  [$($_.impacto)] $($_.processo) => $($_.solucao)" }
$txt += ''
$txt += 'Proximos passos:'
$diag.proximos_passos | ForEach-Object { $txt += "  * $_" }

$txt | Set-Content $ReportTxt -Encoding UTF8

$html = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Diagnostico ByteStorm</title></head>
<body style="font-family:Segoe UI;background:#1a1f33;color:#fff;padding:2rem">
<h1 style="color:#00c0a3">Diagnostico de Automacao</h1>
<p>$($diag.data) — $Company</p>
<h2>Recomendacoes</h2>
<ul>
"@
foreach ($rec in $recommendations) {
    $html += '<li><strong>' + $rec.impacto + '</strong> - ' + $rec.processo + ': <code>' + $rec.solucao + '</code></li>' + "`n"
}
$html += '</ul></body></html>'
$html | Set-Content $ReportHtml -Encoding UTF8

Write-Host "OK: $ReportTxt"
Write-Host "OK: $ReportHtml"
exit 0
