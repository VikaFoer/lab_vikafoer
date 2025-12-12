@echo off
cd /d "%~dp0"
git add -A
git commit -m "Initial commit: Laboratory works with C++ and web interface"
git branch -M main
git push -u origin main

