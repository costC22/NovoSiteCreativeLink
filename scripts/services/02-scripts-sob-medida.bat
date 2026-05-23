@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=scripts-sob-medida"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

call "%~dp0..\_lib\Common.bat" Log "INFO" "Orquestrando scripts Python / PowerShell / Node..."

set "BS_MANIFEST=%BS_DATA_DIR%\output\manifest_%BS_RUN_ID%.txt"
set "BS_PY=%BS_TMP_DIR%\bytestorm_helper.py"

> "%BS_PY%" (
  echo import json, os, datetime
  echo out = r'%BS_DATA_DIR%\output'
  echo os.makedirs(out, exist_ok=True^)
  echo report = {'service': 'scripts-sob-medida', 'timestamp': datetime.datetime.now(^).isoformat(^), 'steps': []}
  echo for name in ['validate_env', 'process_data', 'emit_report']:
  echo     report['steps'].append({'step': name, 'status': 'ok'}^)
  echo path = os.path.join(out, 'script_run_%BS_RUN_ID%.json'^)
  echo with open(path, 'w', encoding='utf-8'^) as f: json.dump(report, f, indent=2^)
  echo print('OK:', path^)
)

set "BS_CODE=0"
where python >nul 2>&1
if not errorlevel 1 (
  call "%~dp0..\_lib\Common.bat" Log "INFO" "Executando modulo Python..."
  python "%BS_PY%"
  set "BS_CODE=!ERRORLEVEL!"
) else (
  call "%~dp0..\_lib\Common.bat" Log "WARN" "Python ausente - executando fallback PowerShell..."
  powershell -NoProfile -Command ^
    "$r=@{service='scripts-sob-medida';ts=(Get-Date).ToString('o');engine='powershell'};" ^
    "$p='%BS_DATA_DIR%\output\script_run_%BS_RUN_ID%.json';" ^
    "$r|ConvertTo-Json|Set-Content $p -Encoding UTF8; Write-Host OK $p"
  set "BS_CODE=!ERRORLEVEL!"
)
del "%BS_PY%" 2>nul

echo Servico: scripts-sob-medida > "%BS_MANIFEST%"
echo Run ID: %BS_RUN_ID%>> "%BS_MANIFEST%"
echo Codigo: %BS_CODE%>> "%BS_MANIFEST%"

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
