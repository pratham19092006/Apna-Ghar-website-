import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import AllUsers from "./AllUsers";
import AllProperty from "./AllProperty";
import AllBookings from "./AllBookings";
import { logoutUser } from "../common/uiHelpers";
import ApnaGharLogo from "../common/ApnaGharLogo";

const ADMIN_TABS = [
  { key: "users", label: "All Users", panel: <AllUsers /> },
  { key: "properties", label: "All Properties", panel: <AllProperty /> },
  { key: "bookings", label: "All Bookings", panel: <AllBookings /> },
];

const AdminHome = () => {
  const session = useContext(UserContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");

  const handleLogOut = async () => {
    await logoutUser(session, navigate, "/login");
  };

  if (!session || !session.userData) return null;

  const selectedPanel = ADMIN_TABS.find((tab) => tab.key === activeTab)?.panel;

  return (
    <div className="app-shell">
      <header className="top-nav">
        <ApnaGharLogo subtitle="Admin" />
        <div className="flex items-center gap-3">
          <span className="hide-fullname-under-460 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900">
            {session.userData.name}
          </span>
          <button onClick={handleLogOut} className="btn btn-danger text-sm">
            Log Out
          </button>
        </div>
      </header>

      <main className="mx-auto mt-6 w-[95%] max-w-6xl">
        <section className="mb-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-4">
          <p className="section-kicker">Admin Control Center</p>
          <h3 className="text-lg font-extrabold text-slate-900">Platform Insights and Management</h3>
          <p className="text-sm text-slate-600">Review users, listings, and booking activity from a single dashboard.</p>
        </section>

        <section className="card mb-4 p-4">
          <div className="flex flex-wrap gap-2">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`btn text-sm ${
                  activeTab === tab.key
                    ? "btn-primary"
                    : "border border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-5">{selectedPanel}</section>
      </main>
    </div>
  );
};

export default AdminHome;
