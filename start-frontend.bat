@echo off
set PATH=%~dp0node-v22.13.1-win-x64;%PATH%
cd /d "%~dp0frontend"
npm run dev
