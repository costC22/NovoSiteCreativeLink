@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=automacao-scripts"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

call "%~dp0..\_lib\Common.bat" Log "INFO" "Pipeline completo: ETL + API + notificacao..."

set "BS_PIPELINE_LOG=%BS_DATA_DIR%\output\pipeline_%BS_RUN_ID%.txt"
echo [%DATE% %TIME%] Pipeline iniciado > "%BS_PIPELINE_LOG%"

call "%~dp0..\services\04-etl-dados.bat"
set "BS_E1=%ERRORLEVEL%"
echo ETL: codigo %BS_E1%>> "%BS_PIPELINE_LOG%"

call "%~dp0..\services\01-integracao-api.bat"
set "BS_E2=%ERRORLEVEL%"
echo API: codigo %BS_E2%>> "%BS_PIPELINE_LOG%"

if %BS_E1% neq 0 set "BS_CODE=%BS_E1%" & goto :pipeline_end
if %BS_E2% neq 0 set "BS_CODE=%BS_E2%" & goto :pipeline_end

call "%~dp0..\services\06-email-notificacoes.bat"
set "BS_CODE=%ERRORLEVEL%"
echo Email: codigo %BS_CODE%>> "%BS_PIPELINE_LOG%"

:pipeline_end
call "%~dp0..\_lib\Common.bat" Log "INFO" "Pipeline finalizado. Detalhes: %BS_PIPELINE_LOG%"

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
