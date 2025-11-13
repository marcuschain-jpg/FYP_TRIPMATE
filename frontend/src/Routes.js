import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
import ItineraryPlan from './pages/ItineraryPlan';
import Landing from './pages/Landing';

// named this way as Routes() itself is a inbuilt function, conflicts will happen
function AppRoutes() {
    return(
        <BrowserRouter>
            <nav>
                <Link to="/">Home</Link> | {" "}
                <Link to="/ItineraryPlanPage">Plan Itinerary</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/ItineraryPlanPage" element={<ItineraryPlan />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;