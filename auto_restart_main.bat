@echo off
chcp 65001 >nul
title Автоматичний перезапуск головного сервера

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0auto_restart_server.ps1" -ServerType "main"

pause

