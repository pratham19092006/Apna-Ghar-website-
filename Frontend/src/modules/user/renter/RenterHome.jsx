import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import AllPropertiesCards from "../AllPropertiesCards";
import AllProperty from "./AllProperties";
import { logoutUser } from "../../common/uiHelpers";
import ApnaGharLogo from "../../common/ApnaGharLogo";

const RenterHome = () => {
  const session = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const [autoOpenPropertyId, setAutoOpenPropertyId] = useState(
    () => location.state?.openBookingPropertyId || ""
  );

  if (!session || !session.userData) return null;

  const handleLogOut = async () => {
    await logoutUser(session, navigate, "/");
  };

  return (
    <div className="app-shell">
      <header className="top-nav">
        <ApnaGharLogo subtitle="Renter" />
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
          <p className="section-kicker">Renter Dashboard</p>
          <h3 className="text-lg font-extrabold text-slate-900">Explore and Track Bookings</h3>
          <p className="text-sm text-slate-600">Discover properties quickly and monitor your booking history with clarity.</p>
        </section>

        <section className="card mb-4 p-4">
          <div className="flex gap-2">
            <button
              className={`btn text-sm ${
                activeTab === 0
                  ? "btn-primary"
                  : "border border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => setActiveTab(0)}
            >
              All Properties
            </button>
            <button
              className={`btn text-sm ${
                activeTab === 1
                  ? "btn-primary"
                  : "border border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => setActiveTab(1)}
            >
              Booking History
            </button>
          </div>
        </section>

        <section className="card p-5">
          {activeTab === 0 && (
            <AllPropertiesCards
              loggedIn={session.userLoggedIn}
              autoOpenPropertyId={autoOpenPropertyId}
              onAutoOpenHandled={() => setAutoOpenPropertyId("")}
            />
          )}
          {activeTab === 1 && <AllProperty />}
        </section>
      </main>
    </div>
  );
};

export default RenterHome;
