#!/usr/bin/env bash
set -euo pipefail

if ! command -v dotnet >/dev/null 2>&1; then
  echo "dotnet nao encontrado no PATH."
  exit 1
fi

dotnet restore desksaveanime.sln
dotnet test tests/deskgeek.Backend.Tests/deskgeek.Backend.Tests.csproj --configuration Release --logger "console;verbosity=minimal"

echo "Testes de backend executados com sucesso."
