@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=integracao-api"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

call "%~dp0..\_lib\Common.bat" Log "INFO" "Iniciando sincronizacao REST origem para destino..."

set "BS_PS=%BS_TMP_DIR%\%BS_SVC%_%BS_RUN_ID%.ps1"
if not defined BS_API_SOURCE_URL set "BS_API_SOURCE_URL=https://jsonplaceholder.typicode.com/users"
if not defined BS_API_TARGET_URL set "BS_API_TARGET_URL=https://jsonplaceholder.typicode.com/posts"
if not defined BS_API_TIMEOUT_SEC set "BS_API_TIMEOUT_SEC=30"

> "%BS_PS%" (
  echo $ErrorActionPreference = 'Stop'
  echo $src = '%BS_API_SOURCE_URL%'
  echo $dst = '%BS_API_TARGET_URL%'
  echo $timeout = %BS_API_TIMEOUT_SEC%
  echo try {
  echo   $data = Invoke-RestMethod -Uri $src -Method Get -TimeoutSec $timeout
  echo   $count = @($data^).Count
  echo   $payload = @{ title = 'ByteStorm Sync'; body = "Registros origem: $count"; userId = 1 } ^| ConvertTo-Json
  echo   $outFile = '%BS_DATA_DIR%\output\api_sync_%BS_RUN_ID%.json'
  echo   $data ^| ConvertTo-Json -Depth 5 ^| Set-Content -Path $outFile -Encoding UTF8
  echo   Write-Host "OK: $count registros exportados para $outFile"
  echo   # POST de demonstracao (opcional - API publica de teste^)
  echo   try { Invoke-RestMethod -Uri $dst -Method Post -Body $payload -ContentType 'application/json' -TimeoutSec $timeout ^| Out-Null; Write-Host 'OK: POST de teste enviado' } catch { Write-Host "AVISO: POST ignorado - $($_.Exception.Message)" }
  echo   exit 0
  echo } catch { Write-Host "ERRO: $($_.Exception.Message)"; exit 1 }
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%BS_PS%"
set "BS_CODE=%ERRORLEVEL%"
del "%BS_PS%" 2>nul

if %BS_CODE% equ 0 (
  call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%
) else (
  call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%
)
exit /b %BS_CODE%
