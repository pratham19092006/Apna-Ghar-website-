import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import AddProperty from "./AddProperty";
import OwnerAllProperties from "./AllProperties";
import OwnerAllBookings from "./AllBookings";
import AllPropertiesCards from "../AllPropertiesCards";
import RenterBookingHistory from "../renter/AllProperties";
import { clearUserSession } from "../../common/uiHelpers";
import ApnaGharLogo from "../../common/ApnaGharLogo";

const USER_TABS = [
  { key: "discover", label: "Discover Properties", panel: <AllPropertiesCards loggedIn={true} /> },
  { key: "history", label: "My Bookings", panel: <RenterBookingHistory /> },
  { key: "add", label: "Add Property", panel: <AddProperty /> },
  { key: "properties", label: "My Listed Properties", panel: <OwnerAllProperties /> },
  { key: "bookings", label: "Owner Booking Requests", panel: <OwnerAllBookings /> },
];

const OwnerHome = () => {
  const session = useContext(UserContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discover");

  if (!session || !session.userData) return null;
  if (String(session.userData.type).toLowerCase() === "admin") {
    navigate("/adminhome");
    return null;
  }

  const handleLogOut = () => {
    clearUserSession();
    navigate("/login");
  };

  const activePanel = USER_TABS.find((tab) => tab.key === activeTab)?.panel;

  return (
    <div className="app-shell">
      <header className="top-nav">
        <ApnaGharLogo subtitle="Owner" />
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900">
            {session.userData.name}
          </span>
          <button onClick={handleLogOut} className="btn btn-danger text-sm">
            Log Out
          </button>
        </div>
      </header>

      <main className="mx-auto mt-6 w-[95%] max-w-6xl">
        <section className="mb-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-4">
          <p className="section-kicker">Unified Workspace</p>
          <h3 className="text-lg font-extrabold text-slate-900">Renter and Owner Features in One Account</h3>
          <p className="text-sm text-slate-600">Browse properties, track your bookings, post listings, and manage owner requests from one dashboard.</p>
        </section>

        <section className="card mb-4 p-4">
          <div className="flex flex-wrap gap-2">
            {USER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`btn text-sm ${
                  activeTab === tab.key
                    ? "btn-primary"
                    : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-5">{activePanel}</section>
      </main>
    </div>
  );
};

export default OwnerHome;
