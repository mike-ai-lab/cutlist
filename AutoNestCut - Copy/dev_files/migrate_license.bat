@echo off
setlocal enabledelayedexpansion

REM -------------------------
REM LICENSE MIGRATION BATCH
REM -------------------------

if "%1"=="" (
    echo Usage: migrate_license.bat "path\to\source\licensed_extension"
    echo Example: migrate_license.bat "F:\BACKUP_LAYOUTS\V121_LAYOUT_DISTRIBUTION\Backup_copies\backedup_8-11\PARAMETRIX_EXTENSION"
    pause
    exit /b 1
)

set SOURCE=%~1
set TARGET=%CD%

echo ================================================================
echo PARAMETRIX LICENSE FILES MIGRATION
echo Source: %SOURCE%
echo Target: %TARGET%
echo ================================================================

REM Step 1: Create folders
mkdir "%TARGET%\lib\LicenseManager" 2>nul
mkdir "%TARGET%\vendor" 2>nul
mkdir "%TARGET%\supabase" 2>nul
mkdir "%TARGET%\node_scripts" 2>nul

REM Step 2: Copy Ruby files
xcopy "%SOURCE%\lib\PARAMETRIX\license_manager.rb" "%TARGET%\lib\LicenseManager\" /Y
xcopy "%SOURCE%\lib\PARAMETRIX\trial_manager.rb" "%TARGET%\lib\LicenseManager\" /Y
xcopy "%SOURCE%\lib\PARAMETRIX\license_dialog.rb" "%TARGET%\lib\LicenseManager\" /Y

REM Step 3: Copy JWT library
xcopy "%SOURCE%\lib\vendor" "%TARGET%\vendor\" /E /Y /Q

REM Step 4: Copy RSA keys
xcopy "%SOURCE%\private_key.pem" "%TARGET%\" /Y
xcopy "%SOURCE%\public_key.pem" "%TARGET%\" /Y

REM Step 5: Copy server components
xcopy "%SOURCE%\supabase" "%TARGET%\supabase\" /E /Y /Q
xcopy "%SOURCE%\node_scripts" "%TARGET%\node_scripts\" /E /Y /Q

REM Step 6: Copy database schema
xcopy "%SOURCE%\database_schema.sql" "%TARGET%\" /Y

echo ================================================================
echo MIGRATION COMPLETE! Check files in %TARGET%
echo ================================================================
pause
