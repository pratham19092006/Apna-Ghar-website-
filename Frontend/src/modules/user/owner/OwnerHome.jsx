import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import AddProperty from "./AddProperty";
import AllProperties from "./AllProperties";
import AllBookings from "./AllBookings";
import { clearUserSession } from "../../common/uiHelpers";
import ApnaGharLogo from "../../common/ApnaGharLogo";

const OWNER_TABS = [
  { key: "add", label: "Add Property", panel: <AddProperty /> },
  { key: "properties", label: "All Properties", panel: <AllProperties /> },
  { key: "bookings", label: "All Bookings", panel: <AllBookings /> },
];

const OwnerHome = () => {
  const session = useContext(UserContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("add");

  if (!session || !session.userData) return null;

  const handleLogOut = () => {
    clearUserSession();
    navigate("/login");
  };

  const activePanel = OWNER_TABS.find((tab) => tab.key === activeTab)?.panel;

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
          <p className="section-kicker">Owner Workspace</p>
          <h3 className="text-lg font-extrabold text-slate-900">Property and Booking Operations</h3>
          <p className="text-sm text-slate-600">Post listings, edit availability, and manage booking requests from one place.</p>
        </section>

        <section className="card mb-4 p-4">
          <div className="flex flex-wrap gap-2">
            {OWNER_TABS.map((tab) => (
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
