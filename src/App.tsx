import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import Home from "./pages/Dashboard/Ecommerce";
import TeamZeroDashboard from "./pages/Dashboard/TeamZeroDashboard";
import CustomerPage from "./pages/Customer/CustomerPage";
import CustomerDevicePage from "./pages/CustomerDevice/CustomerDevicePage";
import NmsPortalPage from "./pages/NmsPortal/NmsPortalPage";
import UserManagerPage from "./pages/UserManager/UserManagerPage";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/OtherPage/Blank";
import NotFound from "./pages/OtherPage/NotFound";
import BasicTables from "./pages/Tables/BasicTables";
import UserProfiles from "./pages/UserProfiles";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            {/* TeamZero Solutions Portal */}
            <Route index path="/" element={<TeamZeroDashboard />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/devices" element={<CustomerDevicePage />} />
            <Route path="/nms" element={<NmsPortalPage />} />
            <Route path="/nms-portals" element={<NmsPortalPage />} />
            <Route path="/user-manager" element={<UserManagerPage />} />
            <Route path="/ecommerce" element={<Home />} />

            {/* Profile & Utilities */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<Navigate to="/signin" replace />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
