@echo off
rem ===========================================================================
rem  Orchelio - lanceur Windows / Windows launcher
rem
rem  Double-cliquez sur ce fichier. Il installe ce qu'il faut, cree la base,
rem  charge les donnees fictives et ouvre http://localhost:3000.
rem
rem  Double-click this file. It installs what is needed, creates the database,
rem  loads the fictional data and opens http://localhost:3000.
rem
rem  Toute la logique est dans scripts\setup-local.mjs : ce fichier ne fait que
rem  verifier Node.js, se placer dans le bon dossier et l'appeler.
rem ===========================================================================

setlocal
cd /d "%~dp0"

echo.
echo   Orchelio - installation et demarrage
echo   ------------------------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js n'est pas installe sur cette machine.
  echo   Node.js is not installed on this machine.
  echo.
  echo   Telechargez la version LTS sur https://nodejs.org, installez-la,
  echo   fermez cette fenetre, puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)

node "scripts\setup-local.mjs" %*
set EXITCODE=%errorlevel%

echo.
if not "%EXITCODE%"=="0" (
  echo   Quelque chose a echoue. Le message ci-dessus dit quoi faire.
  echo   Si vous etes bloque, copiez tout ce texte et montrez-le.
)
echo   Cette fenetre reste ouverte. Fermez-la quand vous avez fini.
echo.
pause
exit /b %EXITCODE%
