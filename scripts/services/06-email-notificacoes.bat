@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=email-notificacoes"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

if not defined BS_ADMIN_EMAIL set "BS_ADMIN_EMAIL=contato@bytestormtech.com.br"
set "BS_MAIL_LOG=%BS_DATA_DIR%\output\email_%BS_RUN_ID%.eml"
set "BS_SUBJECT=[ByteStorm] Relatorio de automacao - %BS_RUN_ID%"

call "%~dp0..\_lib\Common.bat" Log "INFO" "Preparando notificacao para %BS_ADMIN_EMAIL%"

> "%BS_MAIL_LOG%" (
  echo From: %BS_COMPANY% ^<noreply@bytestorm.local^>
  echo To: %BS_ADMIN_EMAIL%
  echo Subject: %BS_SUBJECT%
  echo Date: %DATE% %TIME%
  echo Content-Type: text/plain; charset=utf-8
  echo.
  echo Relatorio automatico ByteStorm Tech
  echo ================================
  echo Servico: email-notificacoes
  echo Run ID: %BS_RUN_ID%
  echo Status: Pipeline executado com sucesso
  echo.
  echo Logs recentes em: %BS_LOG_DIR%
  echo.
  echo -- Enviado por automacao ByteStorm
)

set "BS_CODE=0"
if defined BS_SMTP_SERVER if defined BS_SMTP_USER (
  call "%~dp0..\_lib\Common.bat" Log "INFO" "Enviando via SMTP %BS_SMTP_SERVER%..."
  set "BS_PS=%BS_TMP_DIR%\mail_%BS_RUN_ID%.ps1"
  > "!BS_PS!" (
    echo $sec = ConvertTo-SecureString '%BS_SMTP_PASS%' -AsPlainText -Force
    echo $cred = New-Object PSCredential('%BS_SMTP_USER%', $sec^)
    echo Send-MailMessage -From '%BS_SMTP_USER%' -To '%BS_ADMIN_EMAIL%' -Subject '%BS_SUBJECT%' ^
      -Body (Get-Content '%BS_MAIL_LOG%' -Raw^) -SmtpServer '%BS_SMTP_SERVER%' -Port %BS_SMTP_PORT% -UseSsl -Credential $cred
  )
  powershell -NoProfile -ExecutionPolicy Bypass -File "!BS_PS!"
  set "BS_CODE=!ERRORLEVEL!"
  del "!BS_PS!" 2>nul
) else (
  call "%~dp0..\_lib\Common.bat" Log "WARN" "SMTP nao configurado - e-mail salvo em %BS_MAIL_LOG%"
  call "%~dp0..\_lib\Common.bat" Log "INFO" "Configure BS_SMTP_* em config\Config.bat para envio real."
)

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
