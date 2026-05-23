@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=etl-dados"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

if not defined BS_INPUT_CSV set "BS_INPUT_CSV=%BS_DATA_DIR%\input\dados.csv"
if not defined BS_OUTPUT_CSV set "BS_OUTPUT_CSV=%BS_DATA_DIR%\output\dados_processados_%BS_RUN_ID%.csv"

call "%~dp0..\_lib\Common.bat" Log "INFO" "ETL de %BS_INPUT_CSV% para %BS_OUTPUT_CSV%"

if not exist "%BS_INPUT_CSV%" (
  call "%~dp0..\_lib\Common.bat" Log "ERROR" "Arquivo de entrada nao encontrado: %BS_INPUT_CSV%"
  call "%~dp0..\_lib\Common.bat" Finish ERRO 1
  exit /b 1
)

set "BS_PS=%BS_TMP_DIR%\etl_%BS_RUN_ID%.ps1"
> "%BS_PS%" (
  echo $ErrorActionPreference = 'Stop'
  echo $in = '%BS_INPUT_CSV%'
  echo $out = '%BS_OUTPUT_CSV%'
  echo $rows = Import-Csv $in
  echo if (-not $rows^) { throw 'CSV vazio ou invalido' }
  echo $processed = foreach ($row in $rows^) {
  echo   $v = 0; [void][double]::TryParse($row.valor, [ref]$v^)
  echo   [PSCustomObject]@{
  echo     id = $row.id; nome = $row.nome; valor = $v
  echo     valor_com_imposto = [math]::Round($v * 1.1, 2^)
  echo     regiao = $row.regiao; processado_em = (Get-Date^).ToString('yyyy-MM-dd HH:mm:ss'^)
  echo   }
  echo }
  echo $processed ^| Export-Csv $out -NoTypeInformation -Encoding UTF8
  echo $sum = ($processed ^| Measure-Object -Property valor -Sum^).Sum
  echo Write-Host ('OK - linhas: ' + @($processed^).Count + ' total: ' + $sum^)
  echo exit 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%BS_PS%"
set "BS_CODE=%ERRORLEVEL%"
del "%BS_PS%" 2>nul

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
