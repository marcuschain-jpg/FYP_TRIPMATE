Last update: 31/12/2025

# FYP_TRIPMATE
FYP Group: FYP-25-S4-27

Frontend: React JS
Backend: Node + Express JS
Database: PostgreSQL

Guidelines:
1. To work on our individual work from a branch, please create a sub branch
2. To merge our work > main branch, need to merge each branch sequentially by 1 person

============================= After every pull/clone from main: =======================================================


Node modules are modules you or someone else installed to run libraries (npm install axios)
and are stored in package.json for both frontend and backend. We cannot push node_modules file in github as
it is too huge. So when u install node modules, it reads what modules to install from package.json and creates
your own node_modules

1. Marcus will update all dbs:
    Create dump(for marcus only):
    1. pg_dump -h fyp-tripmate.c9i48eq6wffg.ap-southeast-2.rds.amazonaws.com -U postgres -Fc fyp_tripmate >db.dump
    2. pg_restore -h fyp-tripmate.c9i48eq6wffg.ap-southeast-2.rds.amazonaws.com -U postgres -d fyp_tripmate_chris --no-owner --no-privileges db.dump

2. Reinstall all node_modules:
    - left click and delete node_modules on frontend & backend
    - cd frontend
    - npm install
    - cd ..
    - cd backend
    - npm install

3. Download/update keys.env folder from telegram and put in /backend so that API keys can be accessed

=== Run Application ===

1. Start Backend
    - cd backend
    - node index.js

2. Start Frontend
    - cd frontend
    - npm start

3. Open landing page in browser (if already not opened)
    - http://localhost:3000

====================== File Structure  =================

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

Inner workings of events(btn click, page render..)
- helper (db.js, realtime..) --- components that helps with functions and are not necessarily accessed through routing
- routes --- main logic & routes of different components of prototypes
- index.js --- main file of backend, initialize & help with real time updates with socket.io
- keys.env --- all api keys/passwords needed to access external services
    - only attainable through telegram

1. To add new prototype functions
    - Head to any relevant files or create another one (use file as a broad function).
    - Add routes and insert code & logic
2. Add helper files (optional)
    - Maybe inside a routes file, components too large, u can break it up and slam it here
3. Link route files to index.js
4. Take latest keys.env file from telegram if not done so
5. node index.js

====================== Coding Standard =================
- FE files + main function + BE files + Primary Routes> CapitalizeEveryWord (to reduce typescript error)
- Frontend internal functions + Secondary Routes > Use camelCasing
    - example: const activitySelect = ['a','b','c']..
- Frontend > Backend AXIOS http calls:
    Use withCredentials to authenticate first > then call backend function
    - axios.get("http://..", {params:{id:Act_id..}, withCredentials:true})
    - axios.post("http://..", {id:Act_id, id2:id..}, {withCredentials:true})
    - axios.delete("http://..", {data:{id:Act_id..}, withCredentials:true})
    - axios.patch("http://..", {id:Act_id..}, {withCredentials:true})

- Backend build function:
    - router.get/post/patch/delete("/NameOfFunction", RequireAuth(["Insert roles", "premium"]), async(req,res)=>{
        { id } = req.query["Act_id"] < get
        { id } = req.body < post, patch, delete
    })

- Error action & types:
    - Valid action:
        - optional - 200: Send this when something is successful if not send below one
        - or can return res.send(<something>)
    - Redirect user back to login page with error msg:
        - 401: Not logged in
        - 403: Wrong user type access webpage (user page access admin page)
    - Must not happen after production:
        - 404: AxiosError
        - 500: DB error

====================== Errors and fix  ================= 

=== FrontEnd
1. Filename casing error 
    Looks like: Error TS1149: File name 'C:/Project/frontend/scripts/State.ts' differs from already included file name '../frontend/scripts/State.ts' only in casing.
    - Fix: Ctrl/cmd + shift + p > Typescript: Restart > Restart VSCode

2. Error 404
    Caused due to wrong linking from frontend to backend
    - Fix: Insert correct backend path into axios correctly

3. Open localhost:3000, output is blank
    - Fix: Open console in browser (mac: ctrl+option+c, windows:crtl+shift+j > click on console)
      see error there

4. Cannot connect to localhost(3000 or 8080)
    - Fix check what protocol or ip is being used for those 2 ports, kill task
        
=== Backend

=== General

