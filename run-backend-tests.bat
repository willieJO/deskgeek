@echo off
setlocal

where dotnet >nul 2>&1
if errorlevel 1 (
  echo dotnet nao encontrado no PATH.
  exit /b 1
)

echo Restaurando dependencias...
dotnet restore desksaveanime.sln
if errorlevel 1 exit /b 1

echo Executando testes do backend...
dotnet test tests\deskgeek.Backend.Tests\deskgeek.Backend.Tests.csproj --configuration Release --logger "console;verbosity=minimal"
if errorlevel 1 exit /b 1

echo.
echo Testes de backend executados com sucesso.
exit /b 0
