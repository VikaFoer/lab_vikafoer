@echo off
chcp 65001 >nul
echo ========================================
echo Компіляція лабораторної роботи 1
echo Задача про зустріч двох автомобілів
echo ========================================
echo.

cd /d "%~dp0"

REM Перевірка MSVC
where cl >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo [✓] Знайдено MSVC компілятор
    echo.
    echo Компіляція...
    cl /EHsc /std:c++17 main.cpp /link ws2_32.lib /OUT:lab1.exe 2>&1
    if %ERRORLEVEL% == 0 (
        echo.
        echo ========================================
        echo [✓] Компіляція успішна!
        echo ========================================
        echo.
        echo Запустіть сервер: run_server.bat
        echo.
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
    g++ -std=c++17 main.cpp -o lab1.exe -lws2_32 -static-libgcc -static-libstdc++ 2>&1
    if %ERRORLEVEL% == 0 (
        echo.
        echo ========================================
        echo [✓] Компіляція успішна!
        echo ========================================
        echo.
        echo Запустіть сервер: run_server.bat
        echo.
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

