@echo off
echo ===================================================
echo AuroraX Unified Desktop and Web Deployment Pipeline
echo ===================================================
echo.
echo [1/3] Checking Vercel CLI Authentication...
npx vercel whoami
if %errorlevel% neq 0 (
    echo [ERROR] Vercel CLI is not authenticated. Please run 'npx vercel login' first.
    exit /b %errorlevel%
)
echo.
echo [2/3] Linking local 'aurorax-web' to Vercel project...
npx vercel link --yes --project aurorax-browser-aurorax-done-team-a --cwd aurorax-web
if %errorlevel% neq 0 (
    echo [ERROR] Failed to link project.
    exit /b %errorlevel%
)
echo.
echo [3/3] Deploying 'aurorax-web' to Vercel Production Hub...
npx vercel --cwd aurorax-web --prod --yes
if %errorlevel% neq 0 (
    echo [ERROR] Web deployment failed.
    exit /b %errorlevel%
)
echo.
echo [SUCCESS] Web deployment pipeline linked and executed successfully!
echo.
