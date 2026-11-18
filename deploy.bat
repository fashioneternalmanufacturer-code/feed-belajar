@echo off
cd /d "%~dp0"
echo.
set /p MSG="Pesan commit (contoh: Tambah 5 cerita baru): "
python deploy.py "%MSG%"
echo.
pause
