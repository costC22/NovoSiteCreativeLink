@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=integracao-sistemas"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

call "%~dp0..\_lib\Common.bat" Log "INFO" "Sincronizacao bidirecional CRM-ERP (simulacao)..."

set "BS_CRM_CACHE=%BS_DATA_DIR%\output\crm_cache_%BS_RUN_ID%.json"
set "BS_ERP_CACHE=%BS_DATA_DIR%\output\erp_cache_%BS_RUN_ID%.json"
set "BS_SYNC_LOG=%BS_DATA_DIR%\output\sync_%BS_RUN_ID%.json"

set "BS_PS=%BS_TMP_DIR%\sync_%BS_RUN_ID%.ps1"
> "%BS_PS%" (
  echo $ErrorActionPreference = 'Stop'
  echo function Get-Data($url^) { Invoke-RestMethod -Uri $url -TimeoutSec 30 }
  echo $crmUrl = if ($env:BS_API_SOURCE_URL^) { $env:BS_API_SOURCE_URL } else { 'https://jsonplaceholder.typicode.com/users' }
  echo $erpUrl = if ($env:BS_API_TARGET_URL^) { $env:BS_API_TARGET_URL } else { 'https://jsonplaceholder.typicode.com/posts' }
  echo $crm = Get-Data $crmUrl
  echo $erp = Get-Data $erpUrl
  echo $crm ^| ConvertTo-Json -Depth 5 ^| Set-Content '%BS_CRM_CACHE%' -Encoding UTF8
  echo $erp ^| ConvertTo-Json -Depth 5 ^| Set-Content '%BS_ERP_CACHE%' -Encoding UTF8
  echo $crmCount = @($crm^).Count
  echo $erpCount = @($erp^).Count
  echo $conflicts = @()
  echo if ($crmCount -ne $erpCount^) {
  echo   $conflicts += @{ tipo = 'contagem'; crm = $crmCount; erp = $erpCount; resolucao = 'flag_revisao' }
  echo }
  echo $result = @{
  echo   servico = 'integracao-sistemas'
  echo   direcao = 'bidirecional'
  echo   crm_registros = $crmCount
  echo   erp_registros = $erpCount
  echo   conflitos = $conflicts
  echo   status = if ($conflicts.Count -eq 0^) { 'sincronizado' } else { 'revisao_necessaria' }
  echo   timestamp = (Get-Date^).ToString('o'^)
  echo }
  echo $result ^| ConvertTo-Json -Depth 5 ^| Set-Content '%BS_SYNC_LOG%' -Encoding UTF8
  echo Write-Host "OK: status=$($result.status^) CRM=$crmCount ERP=$erpCount"
  echo exit 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%BS_PS%"
set "BS_CODE=%ERRORLEVEL%"
del "%BS_PS%" 2>nul

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
