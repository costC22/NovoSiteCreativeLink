@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "BS_SVC=planilhas"
call "%~dp0..\_lib\Common.bat" Init "%BS_SVC%"
if errorlevel 1 exit /b %ERRORLEVEL%

if not defined BS_INPUT_CSV set "BS_INPUT_CSV=%BS_DATA_DIR%\input\dados.csv"
set "BS_REPORT=%BS_DATA_DIR%\output\relatorio_planilha_%BS_RUN_ID%.csv"
set "BS_SUMMARY=%BS_DATA_DIR%\output\resumo_planilha_%BS_RUN_ID%.txt"

call "%~dp0..\_lib\Common.bat" Log "INFO" "Processando planilha/CSV: %BS_INPUT_CSV%"

if not exist "%BS_INPUT_CSV%" (
  call "%~dp0..\_lib\Common.bat" Log "ERROR" "Entrada nao encontrada."
  call "%~dp0..\_lib\Common.bat" Finish ERRO 1
  exit /b 1
)

set "BS_PS=%BS_TMP_DIR%\planilhas_%BS_RUN_ID%.ps1"
> "%BS_PS%" (
  echo $ErrorActionPreference = 'Stop'
  echo $in = '%BS_INPUT_CSV%'
  echo $out = '%BS_REPORT%'
  echo $sum = '%BS_SUMMARY%'
  echo $data = Import-Csv $in
  echo $byRegion = $data ^| Group-Object regiao ^| ForEach-Object {
  echo   $total = ($_.Group ^| ForEach-Object { [double]$_.valor } ^| Measure-Object -Sum^).Sum
  echo   [PSCustomObject]@{ regiao = $_.Name; registros = $_.Count; total_valor = [math]::Round($total,2^) }
  echo }
  echo $byRegion ^| Export-Csv $out -NoTypeInformation -Encoding UTF8
  echo "Regioes: $($byRegion.Count^)" ^| Set-Content $sum -Encoding UTF8
  echo $byRegion ^| Format-Table -AutoSize ^| Out-String ^| Add-Content $sum
  echo Write-Host 'OK: relatorio gerado'
  echo exit 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%BS_PS%"
set "BS_CODE=%ERRORLEVEL%"
del "%BS_PS%" 2>nul

REM Processamento de documentos: organizar PDF/TXT da inbox
if not defined BS_WATCH_FOLDER set "BS_WATCH_FOLDER=%BS_DATA_DIR%\input\inbox"
if exist "%BS_WATCH_FOLDER%" (
  for %%F in ("%BS_WATCH_FOLDER%\*.pdf" "%BS_WATCH_FOLDER%\*.txt") do (
    if exist "%%F" (
      call "%~dp0..\_lib\Common.bat" Log "INFO" "Documento encontrado: %%~nxF"
    )
  )
)

if %BS_CODE% equ 0 (call "%~dp0..\_lib\Common.bat" Finish OK %BS_CODE%) else (call "%~dp0..\_lib\Common.bat" Finish ERRO %BS_CODE%)
exit /b %BS_CODE%
