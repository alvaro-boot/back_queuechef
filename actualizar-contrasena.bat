@echo off
echo ========================================
echo Actualizar Contraseña de Base de Datos
echo ========================================
echo.
echo Por favor, ingresa la contraseña completa de Render:
set /p PASSWORD="Contraseña: "
echo.

cd /d "%~dp0"

powershell -Command "(Get-Content .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=%PASSWORD%' | Set-Content .env -Encoding UTF8"
powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=postgresql://queuechef_postgres_user:[^@]+@', 'DATABASE_URL=postgresql://queuechef_postgres_user:%PASSWORD%@' | Set-Content .env -Encoding UTF8"

echo.
echo Contraseña actualizada en .env
echo.
echo Probando conexion...
node test-connection.js
pause
