@echo off
echo Creating project structure...

REM Root folders
mkdir public
mkdir src

REM Source folders
mkdir src\app
mkdir src\components
mkdir src\context
mkdir src\hooks
mkdir src\lib
mkdir src\services
mkdir src\types
mkdir src\ai

REM App Router specific folders (adjust as needed)
mkdir src\app\(auth)
mkdir src\app\(auth)\login
mkdir src\app\(auth)\signup

REM Component subfolders
mkdir src\components\dashboard
mkdir src\components\ui

REM AI subfolders
mkdir src\ai\flows

REM Create basic config files (empty)
type NUL > .env
type NUL > next.config.ts
type NUL > tsconfig.json
type NUL > tailwind.config.ts
type NUL > postcss.config.cjs
type NUL > components.json
type NUL > README.md
type NUL > .gitignore

REM Create initial files (empty) - Add more as needed
type NUL > src\app\layout.tsx
type NUL > src\app\page.tsx
type NUL > src\app\globals.css
type NUL > src\lib\utils.ts
type NUL > src\lib\constants.ts
type NUL > src\context\AuthContext.tsx
type NUL > src\ai\ai-instance.ts
type NUL > src\ai\dev.ts

echo Project structure created.
echo Remember to install dependencies using 'npm install' or 'install_deps.bat'.
pause
