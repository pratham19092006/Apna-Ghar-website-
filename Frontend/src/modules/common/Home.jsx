import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import p1 from "../../images/p1.jpg";
import p2 from "../../images/p2.jpg";
import p3 from "../../images/p3.jpg";
import p4 from "../../images/p4.jpg";
import ApnaGharLogo from "./ApnaGharLogo";
import http, { API_BASE_URL } from "./http";
import { UserContext } from "../../context/userContext";
import { logoutUser } from "./uiHelpers";

const images = [p1, p2, p3, p4];

const Home = () => {
  const session = useContext(UserContext);
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [propertyAdFilter, setPropertyAdFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountButtonRef = useRef(null);
  const accountPanelRef = useRef(null);
  const [continueStatus, setContinueStatus] = useState(
    () => localStorage.getItem("preferredMode") || "owner"
  );
  const isRenterMode = continueStatus === "renter";

  const fetchProperties = async () => {
    try {
      const res = await http.get("/api/user/getAllProperties");
      setProperties(res.data.data || []);
      setLoadFailed(false);
    } catch (error) {
      console.log(error);
      setLoadFailed(true);
      setProperties([]);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = properties
    .filter(
      (property) =>
        addressFilter === "" ||
        property.propertyAddress.toLowerCase().includes(addressFilter.toLowerCase())
    )
    .filter(
      (property) =>
        propertyAdFilter === "" ||
        property.propertyAdType.toLowerCase().includes(propertyAdFilter.toLowerCase())
    )
    .filter(
      (property) =>
        propertyTypeFilter === "" ||
        property.propertyType.toLowerCase().includes(propertyTypeFilter.toLowerCase())
    );

  const dashboardPath = useMemo(() => {
    if (!session?.userData?.type) return "/";
    if (String(session.userData.type).toLowerCase() === "admin") return "/adminhome";
    return continueStatus === "renter" ? "/renterhome" : "/ownerhome";
  }, [continueStatus, session?.userData?.type]);

  const userInitial = session?.userData?.name?.charAt(0)?.toUpperCase() || "U";

  const accountDetails = useMemo(() => {
    if (!session?.userData) return [];

    return Object.entries(session.userData)
      .filter(([key, value]) => {
        const normalizedKey = key.toLowerCase();
        if (normalizedKey === "password" || key === "__v") return false;
        if (normalizedKey === "_id" || normalizedKey.endsWith("id")) return false;
        return value !== undefined && value !== null && value !== "";
      })
      .map(([key, value]) => {
        const normalizedKey = key.toLowerCase();

        if (normalizedKey === "type") {
          const accountType = String(value).toLowerCase() === "admin" ? "Admin" : "User";
          return {
            key,
            label: "Account Type",
            value: accountType,
            status: "default",
          };
        }

        if (normalizedKey === "mode") {
          return null;
        }

        if (normalizedKey === "granted") {
          if (continueStatus !== "owner") {
            return null;
          }

          const isGrantedOwner = String(value).toLowerCase() === "granted";
          return {
            key,
            label: "Owner Access",
            value: isGrantedOwner ? "Granted as owner" : "Not granted as owner",
            status: isGrantedOwner ? "granted" : "not-granted",
          };
        }

        return {
          key,
          label: key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()),
          value: Array.isArray(value)
            ? value.join(", ")
            : typeof value === "object"
              ? JSON.stringify(value)
              : String(value),
          status: "default",
        };
      })
      .filter(Boolean);
  }, [continueStatus, session?.userData]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!accountMenuOpen) return;

      const clickedInsideButton = accountButtonRef.current?.contains(event.target);
      const clickedInsidePanel = accountPanelRef.current?.contains(event.target);

      if (!clickedInsideButton && !clickedInsidePanel) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logoutUser(session, navigate, "/");
  };

  const handleHeroContinue = () => {
    localStorage.setItem("preferredMode", continueStatus);

    if (session?.userLoggedIn) {
      navigate(continueStatus === "renter" ? "/renterhome" : "/ownerhome");
      return;
    }

    navigate("/login");
  };

  const handleRenterCardAction = (property) => {
    if (session?.userLoggedIn) {
      navigate("/renterhome", {
        state: { openBookingPropertyId: property?._id },
      });
      return;
    }
    if (property?._id) {
      localStorage.setItem("pendingBookingPropertyId", property._id);
      localStorage.setItem("preferredMode", "renter");
    }
    navigate("/login");
  };

  const getOwnerContactForDisplay = (ownerContact = "", propertyAdType = "") => {
    const adType = String(propertyAdType || "").trim().toLowerCase();
    const contact = String(ownerContact || "").trim();

    if (adType !== "rent") {
      return contact;
    }

    const digits = contact.replace(/\D/g, "");
    if (!digits) {
      return contact;
    }

    if (digits.length <= 6) {
      return "*".repeat(digits.length);
    }

    return `${"*".repeat(6)}${digits.slice(6)}`;
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <ApnaGharLogo />
        {session?.userLoggedIn && session?.userData ? (
          <div className="relative flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            <button
              ref={accountButtonRef}
              type="button"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white transition hover:brightness-110"
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              aria-label="Open account details"
            >
              {userInitial}
            </button>
            <span className="hide-fullname-under-460 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {session.userData.name}
            </span>
            <Link className="nav-action" to={dashboardPath}>
              Dashboard
            </Link>
            <button className="nav-action nav-action-login" onClick={handleLogout}>
              Logout
            </button>

            {accountMenuOpen ? (
              <section
                ref={accountPanelRef}
                className="absolute right-0 top-12 z-50 w-[320px] rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-2xl backdrop-blur"
              >
                <p className="section-kicker">Account Details</p>
                <h4 className="hide-fullname-under-460 mt-1 text-base font-extrabold text-slate-900">{session.userData.name}</h4>
                <div className="mt-3 space-y-2 text-sm">
                  {accountDetails.map((detail) => (
                    <div key={detail.key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{detail.label}</p>
                      {detail.status === "granted" ? (
                        <p className="mt-0.5 break-words font-semibold text-emerald-700">✓ {detail.value}</p>
                      ) : detail.status === "not-granted" ? (
                        <p className="mt-0.5 break-words font-semibold text-red-700">✗ {detail.value}</p>
                      ) : (
                        <p className="mt-0.5 break-words font-semibold text-slate-800">{detail.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="flex gap-3 text-sm font-semibold text-slate-700">
            <Link className="nav-action" to="/">
              Home
            </Link>
            <Link className="nav-action nav-action-login" to="/login">
              Login
            </Link>
            <Link className="nav-action nav-action-primary" to="/register">
              Register
            </Link>
          </div>
        )}
      </nav>

      <main className="mx-auto mt-6 w-[95%] max-w-6xl space-y-8">
      <section className="grid gap-5 rounded-[24px] border border-indigo-100 bg-white p-6 shadow-2xl md:grid-cols-[1.3fr_1fr] md:p-8">
        <div className="space-y-5">
          <p className="section-kicker">Urban Living Reimagined</p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            {isRenterMode
              ? "Discover Your Next Home Without The Search Stress."
              : "List And Manage Rental Properties With Confidence."}
          </h1>
          <p className="max-w-xl text-sm text-slate-600 md:text-base">
            {isRenterMode
              ? "ApnaGhar helps you explore quality homes, compare options quickly, and book faster with a clean end-to-end renter experience."
              : "ApnaGhar helps you publish listings, manage availability, and handle booking requests from one streamlined owner workspace."}
          </p>
          <div className="hero-action-row">
            <label className="hero-select-wrap" htmlFor="continue-status">
              <span className="hero-select-caption">Continue As</span>
              <select
                id="continue-status"
                className="hero-select"
                value={continueStatus}
                onChange={(e) => {
                  const selectedMode = e.target.value;
                  setContinueStatus(selectedMode);
                  localStorage.setItem("preferredMode", selectedMode);
                }}
              >
                <option value="owner">Owner - Post & Manage</option>
                <option value="renter">Renter - Browse & Book</option>
              </select>
            </label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleHeroContinue}
            >
              {session?.userLoggedIn
                ? isRenterMode
                  ? "You are now renter"
                  : "You are now owner"
                : isRenterMode
                  ? "Start As Renter"
                  : "Start As Owner"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-2xl font-black text-indigo-700">500+</p>
              <p className="text-xs font-semibold text-indigo-900">Active Listings</p>
            </div>
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
              <p className="text-2xl font-black text-orange-700">98%</p>
              <p className="text-xs font-semibold text-orange-900">Happy Renters</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-2xl font-black text-emerald-700">24/7</p>
              <p className="text-xs font-semibold text-emerald-900">Fast Support</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 p-5 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-md"></div>
          <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-orange-300/25 blur-md"></div>
          <div className="relative space-y-4">
            <p className="inline-block rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              {isRenterMode ? "Renter Focus" : "Owner Focus"}
            </p>
            <h3 className="text-2xl font-black">
              {isRenterMode
                ? "Find The Right Property Type For Your Lifestyle"
                : "Reach The Right Renters For Every Listing"}
            </h3>
            <ul className="space-y-2 text-sm text-blue-50">
              {isRenterMode ? (
                <>
                  <li>Residential, commercial, and land options</li>
                  <li>Clear owner details and listing availability</li>
                  <li>Simple booking request flow</li>
                </>
              ) : (
                <>
                  <li>Post listings with images and pricing in minutes</li>
                  <li>Track booking requests and status from one place</li>
                  <li>Manage property availability without extra tools</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Live Inventory</p>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {isRenterMode ? "Featured Listings" : "Trending Listings From Owners"}
            </h3>
            <p className="text-sm text-slate-600">
              {isRenterMode
                ? "Filter by area, property category, and ad type in one click."
                : "See what top-performing listings look like and plan your next posting strategy."}
            </p>
          </div>
          {!session?.userLoggedIn ? (
            <Link to="/register" className="btn btn-warn">
              {isRenterMode ? "Create Renter Account" : "Become an Owner"}
            </Link>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-4">
            <p className="section-kicker">Property Discovery</p>
            <h4 className="text-lg font-extrabold text-slate-900">Search and Explore in Minutes</h4>
            {loadFailed ? (
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Listings are temporarily unavailable. Please make sure backend is running.
              </p>
            ) : null}
          </div>

          <div className="card p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="text"
                placeholder="Search by Address"
                value={addressFilter}
                onChange={(e) => setAddressFilter(e.target.value)}
                className="field"
              />
              <select
                value={propertyAdFilter}
                onChange={(e) => setPropertyAdFilter(e.target.value)}
                className="field"
              >
                <option value="">All Ad Types</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="field"
              >
                <option value="">All Types</option>
                <option value="commercial">Commercial</option>
                <option value="land/plot">Land/Plot</option>
                <option value="residential">Residential</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => {
                const isOwnProperty =
                  session?.userLoggedIn &&
                  session?.userData?._id &&
                  property?.ownerId &&
                  String(property.ownerId) === String(session.userData._id);

                return (
                <article key={property._id} className="card overflow-hidden">
                  <img
                    src={`${API_BASE_URL}${property.propertyImage?.[0]?.path || ""}`}
                    alt="Property"
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <h4 className="text-lg font-bold text-slate-900">{property.propertyAddress}</h4>
                    <p className="text-sm text-slate-600">
                      {property.propertyType} - {property.propertyAdType}
                    </p>
                    <p className="text-sm text-slate-700">
                      <b>Price:</b> Rs {property.propertyAmt}
                    </p>
                    {isRenterMode ? (
                      <>
                        <p
                          className={`text-xs font-semibold ${
                            property.isAvailable === "Available" ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {property.isAvailable}
                        </p>
                        <p className="text-sm text-slate-700">
                          <b>Owner Contact:</b>{" "}
                          {getOwnerContactForDisplay(
                            property.ownerContact || "Available after login",
                            property.propertyAdType
                          )}
                        </p>
                        {isOwnProperty ? (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            You posted this property, so booking is disabled.
                          </p>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary mt-2 w-full"
                            onClick={() => handleRenterCardAction(property)}
                          >
                            {session?.userLoggedIn ? "Get Info / Book This Home" : "Login To Get Info / Book"}
                          </button>
                        )}
                      </>
                    ) : (
                      isOwnProperty ? (
                        <p className="text-xs font-semibold text-emerald-700">
                          You are the owner
                        </p>
                      ) : (
                        <p
                          className={`text-xs font-semibold ${
                            property.isAvailable === "Available" ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {property.isAvailable}
                        </p>
                      )
                    )}
                  </div>
                </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No properties available at the moment.</p>
            )}
          </div>
        </div>
      </section>

      <section className="visual-tour-section overflow-hidden rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Visual Tour</p>
            <h4 className="text-lg font-extrabold text-slate-900">Gallery Of Popular Spaces</h4>
          </div>
          <span className="visual-tour-badge rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Live Preview</span>
        </div>

        <div className="visual-tour-marquee">
          <div className="visual-tour-track">
            {[...images, ...images].map((img, idx) => (
              <article
                key={`${img}-${idx}`}
                className="visual-tour-card visual-tour-marquee-card overflow-hidden rounded-xl border border-indigo-100 shadow-sm"
                style={{ "--stagger": idx % images.length }}
              >
                <img
                  src={img}
                  alt={`Property preview ${(idx % images.length) + 1}`}
                  className="visual-tour-image h-32 w-full object-cover md:h-36"
                  loading="eager"
                  fetchPriority="high"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <p className="section-kicker">Why ApnaGhar</p>
          <h3 className="text-3xl font-extrabold text-slate-900">Features That Make Renting Effortless</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Everything you need for discovering properties, managing listings, and handling bookings in one smooth platform.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl text-white">
              🏠
            </div>
            <h4 className="text-lg font-bold text-slate-900">Smart Property Discovery</h4>
            <p className="mt-2 text-sm text-slate-600">
              Filter homes by location, property type, and ad category to quickly find listings that match your needs.
            </p>
          </article>

          <article className="rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-2xl text-white">
              ⚡
            </div>
            <h4 className="text-lg font-bold text-slate-900">Fast Booking Workflow</h4>
            <p className="mt-2 text-sm text-slate-600">
              Submit booking requests in seconds with owner details and availability status clearly visible.
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-2xl text-white">
              🛡️
            </div>
            <h4 className="text-lg font-bold text-slate-900">Role-Based Experience</h4>
            <p className="mt-2 text-sm text-slate-600">
              Dedicated views for renters, owners, and admins keep every workflow focused, clean, and easy to manage.
            </p>
          </article>

          <article className="rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 text-2xl text-white">
              📍
            </div>
            <h4 className="text-lg font-bold text-slate-900">Location-Focused Search</h4>
            <p className="mt-2 text-sm text-slate-600">
              Browse homes by preferred neighborhoods and cities so you can shortlist properties close to your routine.
            </p>
          </article>

          <article className="rounded-2xl border border-fuchsia-100 bg-gradient-to-b from-fuchsia-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-600 text-2xl text-white">
              🔔
            </div>
            <h4 className="text-lg font-bold text-slate-900">Instant Status Updates</h4>
            <p className="mt-2 text-sm text-slate-600">
              Stay informed with quick booking and listing status updates so you always know what action to take next.
            </p>
          </article>

          <article className="rounded-2xl border border-rose-100 bg-gradient-to-b from-rose-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-2xl text-white">
              🤝
            </div>
            <h4 className="text-lg font-bold text-slate-900">Trusted Owner Connections</h4>
            <p className="mt-2 text-sm text-slate-600">
              Connect directly with verified owners and listing details to make confident rental decisions faster.
            </p>
          </article>
        </div>
      </section>

      <footer className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-blue-50 text-slate-800 shadow-2xl">
        <div className="grid gap-10 px-6 py-12 md:grid-cols-5 md:px-8">
          <section className="md:col-span-2">
            <h4 className="text-2xl font-black tracking-wide text-slate-900">ApnaGhar</h4>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
              Find homes, connect with owners, and manage bookings in one clean platform. Built for renters,
              owners, and admins with a fast and easy workflow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Verified Listings
              </span>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                Fast Booking
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Role Dashboards
              </span>
            </div>
          </section>

          <section>
            <h5 className="text-sm font-bold uppercase tracking-widest text-slate-800">Quick Links</h5>
            <div className="mt-4 space-y-2 text-sm">
              <Link to="/" className="block text-slate-600 transition hover:text-indigo-700">
                Home
              </Link>
              <Link to="/login" className="block text-slate-600 transition hover:text-indigo-700">
                Login
              </Link>
              <Link to="/register" className="block text-slate-600 transition hover:text-indigo-700">
                Register
              </Link>
              <button
                className="text-slate-600 transition hover:text-indigo-700"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Back To Top
              </button>
            </div>
          </section>

          <section>
            <h5 className="text-sm font-bold uppercase tracking-widest text-slate-800">Support</h5>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Email: support@apnaghar.in</p>
              <p>Phone: +91 98765 43210</p>
              <p>Hours: Mon-Sat, 9:00 AM to 7:00 PM</p>
              <p className="text-xs text-slate-500">Need help with booking or listing approval? Reach out anytime.</p>
            </div>
          </section>

          <section>
            <h5 className="text-sm font-bold uppercase tracking-widest text-slate-800">Popular Cities</h5>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Delhi NCR</p>
              <p>Mumbai</p>
              <p>Bengaluru</p>
              <p>Pune</p>
            </div>
          </section>
        </div>

        <div className="border-t border-indigo-100 bg-white/80 px-6 py-4 text-center text-xs text-slate-500 md:px-8">
          © {new Date().getFullYear()} ApnaGhar. Crafted for better renting experiences.
        </div>
      </footer>
      </main>

    </div>
  );
};

export default Home;
