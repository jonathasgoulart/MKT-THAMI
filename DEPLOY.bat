@echo off
echo ==========================================
echo    DEPLOY - THAMI Marketing Assistant
echo ==========================================
echo.

cd /d "C:\Users\jonat\Documents\Mkt musical"

echo Adicionando arquivos...
git add .

echo.
set /p msg="Descreva a mudanca (ex: Mudei cor do botao): "

echo.
echo Fazendo commit...
git commit -m "%msg%"

echo.
echo Enviando para o GitHub...
git push

echo.
echo ==========================================
echo    PRONTO! Site atualiza em ~1 minuto
echo ==========================================
echo.
pause
