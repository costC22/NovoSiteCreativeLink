@echo off
REM ============================================================================
REM ByteStorm Tech - Biblioteca comum para scripts de automacao (.bat)
REM ============================================================================

if /i "%~1"=="Init" (
  call :BS_Init "%~2"
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="Log" (
  call :BS_Log "%~2" "%~3"
  exit /b 0
)
if /i "%~1"=="Finish" (
  call :BS_Finish "%~2" "%~3"
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="ReleaseLock" (
  call :BS_ReleaseLock
  exit /b 0
)
exit /b 0

REM ---------------------------------------------------------------------------
:BS_Init
set "BS_SERVICE_ID=%~1"
call :BS_ResolveServiceName "%BS_SERVICE_ID%"

for %%I in ("%~dp0..") do set "BS_ROOT=%%~fI"
set "BS_LOG_DIR=%BS_ROOT%\logs"
set "BS_DATA_DIR=%BS_ROOT%\data"
set "BS_CONFIG_DIR=%BS_ROOT%\config"
set "BS_LOCK_DIR=%BS_ROOT%\locks"
set "BS_TMP_DIR=%BS_ROOT%\tmp"
set "BS_LIB_DIR=%BS_ROOT%\_lib"

if not exist "%BS_LOG_DIR%" mkdir "%BS_LOG_DIR%" 2>nul
if not exist "%BS_DATA_DIR%" mkdir "%BS_DATA_DIR%" 2>nul
if not exist "%BS_LOCK_DIR%" mkdir "%BS_LOCK_DIR%" 2>nul
if not exist "%BS_TMP_DIR%" mkdir "%BS_TMP_DIR%" 2>nul
if not exist "%BS_DATA_DIR%\input" mkdir "%BS_DATA_DIR%\input" 2>nul
if not exist "%BS_DATA_DIR%\output" mkdir "%BS_DATA_DIR%\output" 2>nul

call :BS_MakeRunId
set "BS_LOG_FILE=%BS_LOG_DIR%\%BS_SERVICE_ID%_%BS_RUN_ID%.log"
set "BS_LOCK_FILE=%BS_LOCK_DIR%\%BS_SERVICE_ID%.lock"
set "BS_START_TIME=%TIME%"

chcp 65001 >nul 2>&1

if exist "%BS_CONFIG_DIR%\Config.bat" (
  call "%BS_CONFIG_DIR%\Config.bat"
) else if exist "%BS_CONFIG_DIR%\Config.example.bat" (
  call "%BS_CONFIG_DIR%\Config.example.bat"
)

call :BS_AcquireLock
if errorlevel 1 (
  call :BS_Log "ERROR" "Outra instancia de [%BS_SERVICE_ID%] em execucao."
  exit /b 2
)

call :BS_Log "INFO" "================================================================"
call :BS_Log "INFO" "ByteStorm Tech - %BS_SERVICE_NAME% [%BS_SERVICE_ID%]"
call :BS_Log "INFO" "Run: %BS_RUN_ID% - Log: %BS_LOG_FILE%"
call :BS_Log "INFO" "================================================================"
exit /b 0

REM ---------------------------------------------------------------------------
:BS_AcquireLock
if exist "%BS_LOCK_FILE%" (
  set "BS_LOCK_PID="
  for /f "usebackq delims=" %%P in ("%BS_LOCK_FILE%") do set "BS_LOCK_PID=%%P"
  if defined BS_LOCK_PID (
    tasklist /FI "PID eq %BS_LOCK_PID%" 2>nul | find /I "%BS_LOCK_PID%" >nul
    if not errorlevel 1 exit /b 1
  )
  del "%BS_LOCK_FILE%" 2>nul
)
echo %PID%>"%BS_LOCK_FILE%"
exit /b 0

REM ---------------------------------------------------------------------------
:BS_ReleaseLock
if exist "%BS_LOCK_FILE%" del "%BS_LOCK_FILE%" 2>nul
exit /b 0

REM ---------------------------------------------------------------------------
:BS_ResolveServiceName
set "BS_SERVICE_NAME=%~1"
if "%~1"=="integracao-api" set "BS_SERVICE_NAME=Integracoes de API"
if "%~1"=="scripts-sob-medida" set "BS_SERVICE_NAME=Scripts sob medida"
if "%~1"=="rotinas-agendadas" set "BS_SERVICE_NAME=Rotinas agendadas"
if "%~1"=="etl-dados" set "BS_SERVICE_NAME=ETL e dados"
if "%~1"=="rpa" set "BS_SERVICE_NAME=RPA"
if "%~1"=="email-notificacoes" set "BS_SERVICE_NAME=E-mail e notificacoes"
if "%~1"=="planilhas" set "BS_SERVICE_NAME=Planilhas e arquivos"
if "%~1"=="seguranca" set "BS_SERVICE_NAME=Seguranca e auditoria"
if "%~1"=="automacao-scripts" set "BS_SERVICE_NAME=Automacao com scripts"
if "%~1"=="integracao-sistemas" set "BS_SERVICE_NAME=Integracao de sistemas"
if "%~1"=="service-desk" set "BS_SERVICE_NAME=Service Desk"
if "%~1"=="consultoria-automacao" set "BS_SERVICE_NAME=Consultoria em automacao"
exit /b 0

REM ---------------------------------------------------------------------------
:BS_MakeRunId
set "BS_RUN_ID=%DATE:/=-%_%TIME::=-%"
set "BS_RUN_ID=%BS_RUN_ID: =%"
set "BS_RUN_ID=%BS_RUN_ID:,=%"
set "BS_RUN_ID=%BS_RUN_ID:.=%"
exit /b 0

REM ---------------------------------------------------------------------------
:BS_Log
set "BS_LVL=%~1"
set "BS_MSG=%~2"
set "BS_TS=%DATE% %TIME%"
echo [%BS_TS%] [%BS_LVL%] %BS_MSG%
if defined BS_LOG_FILE echo [%BS_TS%] [%BS_LVL%] %BS_MSG%>>"%BS_LOG_FILE%"
exit /b 0

REM ---------------------------------------------------------------------------
:BS_Finish
set "BS_STATUS=%~1"
set "BS_CODE=%~2"
if not defined BS_CODE set "BS_CODE=0"

if /i "%BS_STATUS%"=="OK" (
  call :BS_Log "INFO" "SUCESSO. Codigo de saida: %BS_CODE%"
) else (
  call :BS_Log "ERROR" "FALHA. Codigo de saida: %BS_CODE%"
)
call :BS_ReleaseLock
call :BS_Log "INFO" "Inicio: %BS_START_TIME% - Fim: %TIME%"
exit /b %BS_CODE%
