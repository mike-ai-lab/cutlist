@echo off
echo 🧪 AutoNestCut Workflow Testing Suite
echo =====================================

echo.
echo 1. Installing test dependencies...
npm install node-fetch

echo.
echo 2. Running automated workflow tests...
node test_workflow.js

echo.
echo 3. Opening UI test interface...
start test_ui_workflow.html

echo.
echo ✅ Test suite complete!
echo 📋 Check the HTML interface for interactive testing
pause