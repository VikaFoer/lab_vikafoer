@echo off
chcp 65001 >nul
echo ========================================
echo Компіляція лабораторної роботи 2
echo ========================================
echo.

cd /d "%~dp0"

REM Перевірка MSVC
where cl >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [✓] Знайдено MSVC компілятор
    echo.
    echo Компіляція...
    cl /EHsc /std:c++17 /I.. main.cpp /link ws2_32.lib /OUT:lab2.exe 2>&1
    if %ERRORLEVEL% == 0 (
        echo.
        echo ========================================
        echo [✓] Компіляція успішна!
        echo ========================================
        echo.
        echo Запуск сервера...
        echo Відкрийте браузер: http://localhost:8080
        echo Натисніть Ctrl+C для зупинки
        echo.
        lab2.exe
    ) else (
        echo.
        echo [✗] Помилка компіляції!
        pause
    )
    goto :end
)

REM Перевірка MinGW/GCC
where g++ >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [✓] Знайдено GCC компілятор
    echo.
    echo Компіляція...
    g++ -std=c++17 -I.. main.cpp -o lab2.exe -lws2_32 2>&1
    if %ERRORLEVEL% == 0 (
        echo.
        echo ========================================
        echo [✓] Компіляція успішна!
        echo ========================================
        echo.
        echo Запуск сервера...
        echo Відкрийте браузер: http://localhost:8080
        echo Натисніть Ctrl+C для зупинки
        echo.
        lab2.exe
    ) else (
        echo.
        echo [✗] Помилка компіляції!
        pause
    )
    goto :end
)

echo [✗] Не знайдено компілятор C++!
echo.
echo Встановіть один з наступних:
echo   - Visual Studio (з C++ компонентами)
echo   - MinGW-w64
echo   - Clang
echo.
pause

:end

