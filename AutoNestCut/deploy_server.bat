@echo off
echo Deploying AutoNestCut Server...

cd "c:\Users\Administrator\Desktop\AUTOMATION\cutlist\AutoNestCut\AutoNestCut_Clean_Workspace\Served"

echo Creating RBZ package...
cd ..\..\
ruby create_rbz_package.rb

echo Deploying to Vercel...
cd "AutoNestCut_Clean_Workspace\Served"
vercel --prod

echo ✅ Deployment complete!
pause