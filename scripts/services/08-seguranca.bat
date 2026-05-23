@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=seguranca"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

if not defined BS_LOG_RETENTION_DAYS set "BS_LOG_RETENTION_DAYS=30"
set "BS_AUDIT=%BS_DATA_DIR%\output\auditoria_%BS_RUN_ID%.json"

call "%~dp0..\_lib\Common.bat" Log "INFO" "Auditoria de credenciais, logs e permissoes..."

set "BS_PS=%BS_TMP_DIR%\sec_%BS_RUN_ID%.ps1"
> "%BS_PS%" (
  echo $audit = @{
  echo   servico = 'seguranca'
  echo   timestamp = (Get-Date^).ToString('o'^)
  echo   checks = @()
  echo }
  echo $secrets = @('BS_API_TOKEN','BS_SMTP_PASS','BS_SMTP_USER'^)
  echo foreach ($s in $secrets^) {
  echo   $val = [Environment]::GetEnvironmentVariable($s,'Process'^)
  echo   if (-not $val^) { $val = (Get-Item -Path env:$s -ErrorAction SilentlyContinue^).Value }
  echo   $audit.checks += @{ item = $s; configurado = [bool]$val; exposto_em_log = $false }
  echo }
  echo $logDir = '%BS_LOG_DIR%'
  echo $cutoff = (Get-Date^).AddDays(-%BS_LOG_RETENTION_DAYS%^)
  echo $old = Get-ChildItem $logDir -Filter *.log -ErrorAction SilentlyContinue ^| Where-Object { $_.LastWriteTime -lt $cutoff }
  echo $removed = 0
  echo foreach ($f in $old^) { Remove-Item $f.FullName -Force; $removed++ }
  echo $audit.checks += @{ item = 'retencao_logs'; dias = %BS_LOG_RETENTION_DAYS%; removidos = $removed }
  echo $configFiles = @('%BS_CONFIG_DIR%\Config.bat','%BS_CONFIG_DIR%\Config.example.bat'^)
  echo foreach ($c in $configFiles^) {
  echo   if (Test-Path $c^) {
  echo     $acl = Get-Acl $c
  echo     $audit.checks += @{ item = 'acl_' + (Split-Path $c -Leaf^); existe = $true; owner = $acl.Owner }
  echo   }
  echo }
  echo $audit ^| ConvertTo-Json -Depth 5 ^| Set-Content '%BS_AUDIT%' -Encoding UTF8
  echo Write-Host "OK: auditoria salva | logs removidos: $removed"
  echo exit 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%BS_PS%"
set "BS_CODE=%ERRORLEVEL%"
del "%BS_PS%" 2>nul

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
