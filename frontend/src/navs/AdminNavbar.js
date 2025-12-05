import { Outlet, Link } from "react-router-dom";

function AdminNavbar(){
    return(
        <>
            <Link to="/overview">Overview</Link>
            <Link to="/users">Users</Link>
            <Link to="/systems">Systems</Link>
            <Link to="/content">Content</Link>
            <Link to="/support">Support</Link>
            <Link to="/settings">Settings</Link>

            <Outlet/>
        </>
    )
}

export default AdminNavbar;