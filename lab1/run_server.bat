@echo off
chcp 65001 >nul
title Лабораторна робота 1 - Зустріч автомобілів
color 0A

echo ========================================
echo   Лабораторна робота 1
echo   Задача про зустріч двох автомобілів
echo ========================================
echo.

cd /d "%~dp0"

if not exist lab1.exe (
    echo [✗] Помилка: lab1.exe не знайдено!
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

lab1.exe

echo.
echo Сервер зупинено.
pause

