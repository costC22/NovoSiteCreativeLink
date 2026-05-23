@echo off
chcp 65001 >nul 2>&1
title ByteStorm Tech - Menu de Automacoes
color 0A
cd /d "%~dp0"

:menu
cls
echo.
echo  ============================================================
echo   BYTESTORM TECH - Scripts de Automacao
echo  ============================================================
echo.
echo   CORE (site - O que automatizamos)
echo   [1]  Integracoes de API
echo   [2]  Scripts sob medida
echo   [3]  Rotinas agendadas
echo   [4]  ETL e dados
echo.
echo   WORKFLOW / CARDS
echo   [5]  RPA
echo   [6]  E-mail e notificacoes
echo   [7]  Planilhas e arquivos
echo   [8]  Seguranca e auditoria
echo.
echo   SOLUCOES ESPECIALIZADAS
echo   [9]  Automacao com scripts (pipeline completo)
echo   [10] Integracao de sistemas (CRM/ERP)
echo   [11] Service Desk - monitoramento
echo   [12] Consultoria - diagnostico
echo.
echo   [A]  Executar TODOS os servicos
echo   [C]  Copiar Config.example.bat para Config.bat
echo   [L]  Abrir pasta de logs
echo   [0]  Sair
echo.
set /p "OPCAO=  Escolha uma opcao: "

if "%OPCAO%"=="1"  call "%~dp0services\01-integracao-api.bat" & goto :menu
if "%OPCAO%"=="2"  call "%~dp0services\02-scripts-sob-medida.bat" & goto :menu
if "%OPCAO%"=="3"  call "%~dp0services\03-rotinas-agendadas.bat" & goto :menu
if "%OPCAO%"=="4"  call "%~dp0services\04-etl-dados.bat" & goto :menu
if "%OPCAO%"=="5"  call "%~dp0services\05-rpa.bat" & goto :menu
if "%OPCAO%"=="6"  call "%~dp0services\06-email-notificacoes.bat" & goto :menu
if "%OPCAO%"=="7"  call "%~dp0services\07-planilhas.bat" & goto :menu
if "%OPCAO%"=="8"  call "%~dp0services\08-seguranca.bat" & goto :menu
if "%OPCAO%"=="9"  call "%~dp0services\09-automacao-scripts.bat" & goto :menu
if "%OPCAO%"=="10" call "%~dp0services\10-integracao-sistemas.bat" & goto :menu
if "%OPCAO%"=="11" call "%~dp0services\11-service-desk.bat" & goto :menu
if "%OPCAO%"=="12" call "%~dp0services\12-consultoria-automacao.bat" & goto :menu

if /i "%OPCAO%"=="A" goto :run_all
if /i "%OPCAO%"=="C" goto :copy_config
if /i "%OPCAO%"=="L" start "" "%~dp0logs" & goto :menu
if "%OPCAO%"=="0" exit /b 0

echo   Opcao invalida.
timeout /t 2 >nul
goto :menu

:copy_config
if not exist "%~dp0config\Config.bat" (
  copy /Y "%~dp0config\Config.example.bat" "%~dp0config\Config.bat" >nul
  echo   Config.bat criado. Edite em config\Config.bat
) else (
  echo   Config.bat ja existe.
)
pause
goto :menu

:run_all
echo.
echo   Executando todos os servicos...
for %%S in (
  01-integracao-api
  02-scripts-sob-medida
  04-etl-dados
  05-rpa
  06-email-notificacoes
  07-planilhas
  08-seguranca
  10-integracao-sistemas
  11-service-desk
  12-consultoria-automacao
) do (
  echo   --- %%S ---
  call "%~dp0services\%%S.bat"
)
echo.
echo   Concluido. Verifique scripts\logs\
pause
goto :menu
