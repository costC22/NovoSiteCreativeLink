@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=service-desk"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

if not defined BS_DISK_WARN_PERCENT set "BS_DISK_WARN_PERCENT=85"
set "BS_HEALTH=%BS_DATA_DIR%\output\health_%BS_RUN_ID%.json"

call "%~dp0..\_lib\Common.bat" Log "INFO" "Verificando saude do ambiente de automacao..."

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\_lib\ServiceDesk.ps1" ^
  -Root "%BS_ROOT%" ^
  -LogDir "%BS_LOG_DIR%" ^
  -HealthFile "%BS_HEALTH%" ^
  -DiskWarnPercent %BS_DISK_WARN_PERCENT%

set "BS_CODE=%ERRORLEVEL%"

if %BS_CODE% equ 0 (
  call "%~dp0..\_lib\Common.bat" Finish OK 0
) else if %BS_CODE% equ 2 (
  call "%~dp0..\_lib\Common.bat" Log "WARN" "Alertas detectados - ver %BS_HEALTH%"
  call "%~dp0..\_lib\Common.bat" Finish OK 2
) else (
  call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%
)
exit /b %BS_CODE%
