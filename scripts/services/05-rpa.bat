@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=rpa"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

if not defined BS_WATCH_FOLDER set "BS_WATCH_FOLDER=%BS_DATA_DIR%\input\inbox"
if not defined BS_ARCHIVE_FOLDER set "BS_ARCHIVE_FOLDER=%BS_DATA_DIR%\output\arquivados"
set "BS_RPA_LOG=%BS_DATA_DIR%\output\rpa_%BS_RUN_ID%.json"

call "%~dp0..\_lib\Common.bat" Log "INFO" "RPA: monitorando pasta %BS_WATCH_FOLDER%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\_lib\Rpa.ps1" ^
  -WatchFolder "%BS_WATCH_FOLDER%" ^
  -ArchiveFolder "%BS_ARCHIVE_FOLDER%" ^
  -LogFile "%BS_RPA_LOG%" ^
  -RunId "%BS_RUN_ID%"

set "BS_CODE=%ERRORLEVEL%"
if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
