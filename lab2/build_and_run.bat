@echo off
echo Компіляція лабораторної роботи 2...
echo.

REM Спробувати знайти компілятор
where cl >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Використовується MSVC...
    cl /EHsc /std:c++17 /I.. main.cpp /link ws2_32.lib /OUT:lab2.exe
    if %ERRORLEVEL% == 0 (
        echo.
        echo Компіляція успішна! Запуск сервера...
        echo.
        lab2.exe
    ) else (
        echo Помилка компіляції!
        pause
    )
) else (
    where g++ >nul 2>&1
    if %ERRORLEVEL% == 0 (
        echo Використовується GCC...
        g++ -std=c++17 -I.. main.cpp -o lab2.exe -lws2_32
        if %ERRORLEVEL% == 0 (
            echo.
            echo Компіляція успішна! Запуск сервера...
            echo.
            lab2.exe
        ) else (
            echo Помилка компіляції!
            pause
        )
    ) else (
        echo Помилка: Не знайдено компілятор C++!
        echo Встановіть Visual Studio або MinGW
        pause
    )
)

