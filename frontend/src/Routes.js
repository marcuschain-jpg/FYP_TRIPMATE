import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
import ItineraryPlan from './pages/ItineraryPlan';
import Landing from './pages/Landing';

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