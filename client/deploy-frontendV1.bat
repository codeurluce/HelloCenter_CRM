@echo off
echo ==================================================
echo 🚀 Déploiement automatique du frontend CRM
echo ==================================================

cd /d D:\Github\CRM\client

echo 🔍 Vérification du dossier...
if not exist "package.json" (
    echo ❌ Erreur : package.json introuvable. Es-tu dans le bon dossier ?
    pause
    exit /b 1
)

echo 🧹 Suppression de l'ancien build...
if exist build rmdir /s /q build

echo 🏗️  Construction de la version production...
call npm run build

if errorlevel 1 (
    echo ❌ Échec du build. Vérifie les erreurs ci-dessus.
    pause
    exit /b 1
)

echo 📤 Envoi vers le serveur DigitalOcean...
scp -r build\* root@159.65.121.14:/var/www/crm

if errorlevel 1 (
    echo ❌ Échec de l'envoi. Vérifie ta connexion SSH.
    pause
    exit /b 1
)

echo ==================================================
echo ✅ Déploiement frontend termine avec succes !
echo ✅ Rendez-vous sur http://159.65.121.14
echo ==================================================
pause