@echo off
chcp 65001 >nul
title Автоматичний перезапуск сервера

echo ========================================
echo   Автоматичний перезапуск сервера
echo ========================================
echo.
echo Виберіть тип сервера:
echo   1. Головний сервер (main_server)
echo   2. Лабораторна робота 1
echo   3. Лабораторна робота 2
echo   4. Інша лабораторна (введіть номер)
echo.
set /p choice="Ваш вибір (1-4): "

if "%choice%"=="1" (
    powershell -ExecutionPolicy Bypass -File "%~dp0auto_restart_server.ps1" -ServerType "main"
) else if "%choice%"=="2" (
    powershell -ExecutionPolicy Bypass -File "%~dp0auto_restart_server.ps1" -ServerType "lab1"
) else if "%choice%"=="3" (
    powershell -ExecutionPolicy Bypass -File "%~dp0auto_restart_server.ps1" -ServerType "lab2"
) else if "%choice%"=="4" (
    set /p labnum="Введіть номер лабораторної (1-11): "
    powershell -ExecutionPolicy Bypass -File "%~dp0auto_restart_server.ps1" -ServerType "lab%labnum%"
) else (
    echo Невірний вибір!
    pause
    exit /b 1
)

pause

