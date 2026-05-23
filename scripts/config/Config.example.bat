@echo off
REM Copie este arquivo para Config.bat e ajuste os valores.

set "BS_COMPANY=ByteStorm Tech"
set "BS_ADMIN_EMAIL=contato@bytestormtech.com.br"
set "BS_SMTP_SERVER=smtp.exemplo.com"
set "BS_SMTP_PORT=587"
set "BS_SMTP_USER="
set "BS_SMTP_PASS="

REM APIs (Integracao)
set "BS_API_SOURCE_URL=https://jsonplaceholder.typicode.com/users"
set "BS_API_TARGET_URL=https://jsonplaceholder.typicode.com/posts"
set "BS_API_TOKEN="
set "BS_API_TIMEOUT_SEC=30"

REM Planilhas / ETL
set "BS_INPUT_CSV=%BS_DATA_DIR%\input\dados.csv"
set "BS_OUTPUT_CSV=%BS_DATA_DIR%\output\dados_processados.csv"
set "BS_EXCEL_INPUT=%BS_DATA_DIR%\input\planilha.xlsx"
set "BS_EXCEL_OUTPUT=%BS_DATA_DIR%\output\relatorio.xlsx"

REM Rotinas agendadas (nome da tarefa no Agendador do Windows)
set "BS_TASK_NAME=ByteStorm_Automacao_Diaria"

REM RPA / pastas monitoradas
set "BS_WATCH_FOLDER=%BS_DATA_DIR%\input\inbox"
set "BS_ARCHIVE_FOLDER=%BS_DATA_DIR%\output\arquivados"

REM Service Desk - limites de alerta
set "BS_DISK_WARN_PERCENT=85"
set "BS_LOG_RETENTION_DAYS=30"
