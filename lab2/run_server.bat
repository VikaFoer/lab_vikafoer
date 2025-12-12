@echo off
chcp 65001 >nul
title Лабораторна робота 2 - C++ Server
color 0A

echo ========================================
echo   Лабораторна робота 2 - C++ Server
echo ========================================
echo.
echo Сервер запускається...
echo.

cd /d "%~dp0"

if not exist lab2.exe (
    echo [✗] Помилка: lab2.exe не знайдено!
    echo Спочатку скомпілюйте проект: compile.bat
    echo.
    pause
    exit /b 1
)

echo [✓] Запуск сервера...
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

lab2.exe

echo.
echo Сервер зупинено.
pause

