import { BrowserRouter, Routes, Route} from "react-router-dom";

//Import pages
import ItineraryPlan from "./pages/ItineraryPlan";
import Landing from "./pages/Landing";

//Import nav bars
import UserNavbar from "./navs/UserNavbar";
import AdminNavbar from "./navs/AdminNavbar";

// named this way as Routes() itself is a inbuilt function, conflicts will happen
function AppRoutes() {   
  return (
    <>
      <BrowserRouter>
        {/*Routes linking*/}
        <Routes>
          {/*User navbar*/}
          <Route element={<UserNavbar />}>         
            {/*Route to home*/}
            <Route path="/" element={<Landing />} />

            {/*Route to "my trips" page*/}
            <Route path="/ItineraryPlanPage" element={<ItineraryPlan />} />

            {/*other pages (WIP)*/}
            <Route path="/ourstory" element={<Placeholder title="Our Story" />} />
            <Route path="/mytrips" element={<ItineraryPlan />} />
            <Route path="/feed" element={<Placeholder title="Feed" />} />
            <Route path="/pricing" element={<Placeholder title="Pricing" />} />
            <Route path="/join" element={<Placeholder title="Join A Trip" />} />
          </Route>

          {/*User navbar*/}
          <Route element={<AdminNavbar/ >}>
            <Route path="/overview"/>
            <Route path="/users"/>
            <Route path="/systems"/>
            <Route path="/content"/>
            <Route path="/support"/>
            <Route path="/settings"/>
          </Route>

          {/*User links*/}
            <Route path="/mytrips/trip/:id" />
          {/*Admin links*/}
            <Route path="overview/:id"/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

/*Placeholder for unfinished pages*/
function Placeholder({ title }) {
  return (
    <div style={{ padding: "40px" }}>
      <h1>{title}</h1>
      <p>This page will be created later.</p>
    </div>
  );
}

export default AppRoutes;