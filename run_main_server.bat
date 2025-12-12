@echo off
chcp 65001 >nul
title Головний сервер - Лабораторні роботи
color 0A

echo ========================================
echo   Головний сервер лабораторних робіт
echo ========================================
echo.

cd /d "%~dp0"

if not exist main_server.exe (
    echo [✗] Помилка: main_server.exe не знайдено!
    echo Спочатку скомпілюйте проект
    echo.
    pause
    exit /b 1
)

echo [✓] Запуск головного сервера...
echo.
echo ════════════════════════════════════════
echo   Сервер працює на http://localhost:8080
echo ════════════════════════════════════════
echo.
echo Відкрийте браузер і перейдіть на:
echo   http://localhost:8080
echo.
echo Натисніть Enter для зупинки сервера...
echo.

main_server.exe

echo.
echo Сервер зупинено.
pause

