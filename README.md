# FYP_TRIPMATE
FYP Group: FYP-25-S4-27

Frontend: React JS
Backend: Node + Express JS
Database: Supabase

Guidelines:
1. To work on our individual work from a branch, please create a sub branch
2. To merge our work > main branch, need to merge each branch sequentially by 1 person

After every pull:


Node modules are modules you or someone else installed to run libraries (npm install axios)
and are stored in package.json for both frontend and backend. We cannot push node_modules file in github as
it is too huge. So when u install node modules, it reads what modules to install from package.json and creates
your own node_modules


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

2. Make new file "keys.env" in /backend, copy and paste api keys from telegram into said file

3. Start Backend
    - cd backend
    - node index.js



4. Open landing page in browser (if already not opened)
    - http://localhost:3000

====================== How it works  ================= WORK IN PROGRESS

Frontend:

Consist of frontend components(sub-html pages) of all functions
- public --- contains real DOM & browser tab icon image, only change browser icon here if needed
- node_modules --- downloaded libraries that can be used in code, ignored files
- src --- where we create our individual 'pages', or helper componenets
    - /src/pages/.js files --- individual pages (itinerary page, feed page..)
    - /src/components/.js files --- special div components (map, special text box..), functions here are reusable like lego blocks can put here put there
    - /src/Routes.js --- only pages are connected here for routing, nav bar
    - /src/styles/.css --- all css files
    - /src/assets --- places to put images, videos..
    - /src/hooks --- function does not return JSX(web component like div...), usually no need touch
    - /src/index.js --- virtual dom, usually no need to touch


1. To add new pages, add new .js files in pages folder. 
    - If needed .js page is too long/segment function, u can segment them into helper components in /src/helper,
      then link it to your page
2. CSS link to pages only, components will inherit all css properties.
    - Create containers before u declare a component, so that when u can target css in that container.
2. Route new .js files pages to Routes.js(nav bar) in main
3. npm start

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

