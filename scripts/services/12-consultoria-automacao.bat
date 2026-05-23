@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=consultoria-automacao"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

set "BS_REPORT_HTML=%BS_DATA_DIR%\output\diagnostico_%BS_RUN_ID%.html"
set "BS_REPORT_TXT=%BS_DATA_DIR%\output\diagnostico_%BS_RUN_ID%.txt"

call "%~dp0..\_lib\Common.bat" Log "INFO" "Gerando diagnostico de processos automatizaveis..."

if not defined BS_COMPANY set "BS_COMPANY=ByteStorm Tech"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\_lib\Consultoria.ps1" ^
  -Root "%BS_ROOT%" ^
  -ReportTxt "%BS_REPORT_TXT%" ^
  -ReportHtml "%BS_REPORT_HTML%" ^
  -Company "%BS_COMPANY%"

set "BS_CODE=%ERRORLEVEL%"

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
