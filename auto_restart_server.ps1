# Скрипт автоматичного перезапуску сервера при змінах
param(
    [string]$ServerType = "main"  # "main" або "lab1", "lab2", etc.
)

$ErrorActionPreference = "Stop"

# Кольори для виводу
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }
function Write-Warning { Write-ColorOutput Yellow $args }

Write-Info "════════════════════════════════════════"
Write-Info "  Автоматичний перезапуск сервера"
Write-Info "════════════════════════════════════════"
Write-Output ""

$compiler = $null
$gccPath = "C:\mingw64\bin\g++.exe"

# Перевірка компілятора
if (Test-Path $gccPath) {
    $compiler = "g++"
    $env:Path = "C:\mingw64\bin;" + $env:Path
    Write-Success "[✓] Використовується GCC компілятор"
} elseif (Get-Command cl -ErrorAction SilentlyContinue) {
    $compiler = "msvc"
    Write-Success "[✓] Використовується MSVC компілятор"
} else {
    Write-Error "[✗] Не знайдено компілятор C++!"
    Write-Output "Встановіть MinGW або Visual Studio"
    exit 1
}

# Визначення параметрів залежно від типу сервера
if ($ServerType -eq "main") {
    $sourceFile = "main_server.cpp"
    $exeFile = "main_server.exe"
    $runScript = "run_main_server.bat"
    $watchFiles = @("main_server.cpp", "index.html", "static\*.css", "static\*.js")
} else {
    $labNum = $ServerType
    $sourceFile = "lab$labNum\main.cpp"
    $exeFile = "lab$labNum\lab$labNum.exe"
    $runScript = "lab$labNum\run_server.bat"
    $watchFiles = @("lab$labNum\main.cpp", "lab$labNum\web\*.html", "lab$labNum\web\*.css", "lab$labNum\web\*.js")
}

Write-Info "Спостерігаю за файлами:"
foreach ($file in $watchFiles) {
    Write-Output "  - $file"
}
Write-Output ""

# Функція компіляції
function Compile-Server {
    Write-Info "[→] Компіляція..."
    
    if ($compiler -eq "g++") {
        if ($ServerType -eq "main") {
            $result = & g++ -std=c++17 main_server.cpp -o main_server.exe -lws2_32 -static-libgcc -static-libstdc++ 2>&1
        } else {
            $labNum = $ServerType
            $result = & g++ -std=c++17 "lab$labNum\main.cpp" -o "lab$labNum\lab$labNum.exe" -lws2_32 -static-libgcc -static-libstdc++ 2>&1
        }
    } else {
        if ($ServerType -eq "main") {
            $result = & cl /EHsc /std:c++17 main_server.cpp /link ws2_32.lib /OUT:main_server.exe 2>&1
        } else {
            $labNum = $ServerType
            $result = & cl /EHsc /std:c++17 "lab$labNum\main.cpp" /link ws2_32.lib /OUT:"lab$labNum\lab$labNum.exe" 2>&1
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "[✓] Компіляція успішна!"
        return $true
    } else {
        Write-Error "[✗] Помилка компіляції:"
        Write-Output $result
        return $false
    }
}

# Функція запуску сервера
function Start-Server {
    param([int]$Port = 8080)
    
    # Зупиняємо попередній процес якщо він існує
    Stop-Server
    
    Start-Sleep -Milliseconds 500
    
    Write-Info "[→] Запуск сервера на порту $Port..."
    
    if ($ServerType -eq "main") {
        $process = Start-Process -FilePath ".\main_server.exe" -NoNewWindow -PassThru
    } else {
        $labNum = $ServerType
        $process = Start-Process -FilePath ".\lab$labNum\lab$labNum.exe" -NoNewWindow -PassThru
    }
    
    Start-Sleep -Seconds 2
    
    if (-not $process.HasExited) {
        Write-Success "[✓] Сервер запущено! (PID: $($process.Id))"
        Write-Info "    URL: http://localhost:$Port"
        return $process
    } else {
        Write-Error "[✗] Сервер не запустився!"
        return $null
    }
}

# Функція зупинки сервера
function Stop-Server {
    $processes = @()
    
    if ($ServerType -eq "main") {
        $processes = Get-Process -Name "main_server" -ErrorAction SilentlyContinue
    } else {
        $labNum = $ServerType
        $processes = Get-Process -Name "lab$labNum" -ErrorAction SilentlyContinue
    }
    
    foreach ($proc in $processes) {
        Write-Warning "[→] Зупинка процесу (PID: $($proc.Id))..."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Milliseconds 300
}

# Функція перевірки змін файлів
function Get-FileHash {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $file = Get-Item $FilePath
        return "$($file.LastWriteTime.Ticks)-$($file.Length)"
    }
    return $null
}

# Початкова компіляція та запуск
Write-Info "Початкова компіляція..."
if (Compile-Server) {
    $serverProcess = Start-Server
    if (-not $serverProcess) {
        Write-Error "Не вдалося запустити сервер!"
        exit 1
    }
} else {
    Write-Error "Не вдалося скомпілювати сервер!"
    exit 1
}

Write-Output ""
Write-Success "════════════════════════════════════════"
Write-Success "  Сервер працює! Спостерігаю за змінами..."
Write-Success "════════════════════════════════════════"
Write-Output ""
Write-Info "Натисніть Ctrl+C для зупинки"
Write-Output ""

# Зберігаємо хеші файлів
$fileHashes = @{}
foreach ($pattern in $watchFiles) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $fileHashes[$file.FullName] = Get-FileHash $file.FullName
    }
}

# Основний цикл спостереження
try {
    while ($true) {
        $changed = $false
        
        # Перевірка змін у файлах
        foreach ($pattern in $watchFiles) {
            $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
            foreach ($file in $files) {
                $currentHash = Get-FileHash $file.FullName
                if ($fileHashes[$file.FullName] -ne $currentHash) {
                    Write-Output ""
                    Write-Warning "[!] Виявлено зміни у файлі: $($file.Name)"
                    $fileHashes[$file.FullName] = $currentHash
                    $changed = $true
                }
            }
        }
        
        # Якщо були зміни - перекомпілюємо та перезапускаємо
        if ($changed) {
            Write-Output ""
            Write-Info "════════════════════════════════════════"
            Write-Info "  Перезапуск сервера..."
            Write-Info "════════════════════════════════════════"
            
            if (Compile-Server) {
                $serverProcess = Start-Server
                if (-not $serverProcess) {
                    Write-Error "Не вдалося перезапустити сервер!"
                } else {
                    Write-Output ""
                    Write-Success "Сервер перезапущено успішно!"
                    Write-Output ""
                }
            }
        }
        
        # Перевірка чи процес ще працює
        if ($serverProcess -and $serverProcess.HasExited) {
            Write-Warning "[!] Сервер несподівано зупинився!"
            Write-Info "[→] Спробую перезапустити..."
            $serverProcess = Start-Server
        }
        
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Output ""
    Write-Error "Помилка: $_"
} finally {
    Write-Output ""
    Write-Info "[→] Зупинка сервера..."
    Stop-Server
    Write-Success "[✓] Сервер зупинено"
}

