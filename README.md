# FYP_TRIPMATE
FYP Group: FYP-25-S4-27

Frontend: React JS
Backend: Node + Express JS
Database: Supabase

Guidelines:
1. To work on our individual work from a branch, please create a sub branch
2. To merge our work > main branch, need to merge each branch sequentially by 1 person

After every pull:

Install all node_modules:
- cd frontend
- npm install
- cd ..
- cd backend
- npm install

Run Application
1. Start Frontend
    - cd frontend
    - npm start

2. Start Backend
    - cd backend
    - node index.js

3. Make new file "keys.env", copy and paste api keys from telegram into said file

3. Open landing page in browser
    - http://localhost:3000

====================== How it works  ================= WORK IN PROGRESS

Frontend:

Consist of frontend components(sub-html pages) of all functions
- 
- /src/pages/.js files --- individual pages
- /src/Routes.js --- all components are connected here for routing
- /styles/.css --- all css files

1. To add new pages, add new .js files in components. 
2. Route new .js files components/pages to Routes.js in main
s
Backend:


====================== Errors and fix  ================= 

=== FrontEnd
1. Filename casing error 
    Looks like: Error TS1149: File name 'C:/Project/frontend/scripts/State.ts' differs from already included file name '../frontend/scripts/State.ts' only in casing.
    - Fix: Ctrl/cmd + shift + p > Typescript: Restart > Restart VSCode

2. Error 404
    Caused due to wrong linking from frontend to backend
    - Fix: Insert correct backend path into axios correctly


        
=== Backend

=== General

