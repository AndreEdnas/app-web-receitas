@echo off
cd /d C:\Users\USER\.cloudflared

echo ================================
echo A iniciar TUNEL RECEITAS...
echo ================================

"C:\cloudflare\cloudflared.exe" tunnel --config "C:\Users\USER\.cloudflared\config-receitas.yml" run 19f04ef5-3945-45db-ba16-6e504fed3047

pause
