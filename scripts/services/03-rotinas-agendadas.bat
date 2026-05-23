@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=rotinas-agendadas"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

if not defined BS_TASK_NAME set "BS_TASK_NAME=ByteStorm_Automacao_Diaria"
set "BS_RUNNER=%BS_ROOT%\services\09-automacao-scripts.bat"

call "%~dp0..\_lib\Common.bat" Log "INFO" "Gerenciando tarefa agendada: %BS_TASK_NAME%"

schtasks /Query /TN "%BS_TASK_NAME%" >nul 2>&1
if errorlevel 1 (
  call "%~dp0..\_lib\Common.bat" Log "INFO" "Criando tarefa diaria as 08:00..."
  schtasks /Create /TN "%BS_TASK_NAME%" /TR "cmd /c call \"%BS_RUNNER%\"" /SC DAILY /ST 08:00 /F /RL LIMITED
  set "BS_CODE=%ERRORLEVEL%"
) else (
  call "%~dp0..\_lib\Common.bat" Log "INFO" "Tarefa existente - executando rotina agora..."
  schtasks /Run /TN "%BS_TASK_NAME%" >nul 2>&1
  set "BS_CODE=0"
  if errorlevel 1 (
    call "%~dp0..\_lib\Common.bat" Log "WARN" "Run via schtasks falhou - execucao direta..."
    call "%BS_RUNNER%"
    set "BS_CODE=!ERRORLEVEL!"
  )
)

set "BS_REPORT=%BS_DATA_DIR%\output\agendamento_%BS_RUN_ID%.txt"
echo Tarefa: %BS_TASK_NAME%> "%BS_REPORT%"
echo Proxima execucao:>> "%BS_REPORT%"
schtasks /Query /TN "%BS_TASK_NAME%" /FO LIST /V 2>nul | findstr /I "Proxima Proximo Next" >> "%BS_REPORT%"

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
