@echo off
REM Запуск вручную двойным щелчком: рабочий каталог не зависит от папки терминала.
cd /d "%~dp0"
call npm run setup
pause
