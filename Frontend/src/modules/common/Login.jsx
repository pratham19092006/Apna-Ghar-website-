import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../common/Toast";
import http from "./http";
import ApnaGharLogo from "./ApnaGharLogo";
import { UserContext } from "../../context/userContext";

const Login = () => {
  const navigate = useNavigate();
  const session = useContext(UserContext);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const submitForm = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      return showToast("error", "Please fill all fields");
    }

    try {
      const res = await http.post("/api/user/login", credentials);
      if (res.data.success) {
        const signedInUser = res.data.user;

        localStorage.setItem("user", JSON.stringify(signedInUser));
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        if (session) {
          session.setUserData(signedInUser);
          session.setUserLoggedIn(true);
        }

        showToast("success", res.data.message);

        setTimeout(() => {
          const preferredMode = localStorage.getItem("preferredMode") || "owner";
          const pendingBookingPropertyId = localStorage.getItem("pendingBookingPropertyId");
          const normalizedType = String(signedInUser.type || "").toLowerCase();
          const accountType =
            normalizedType === "admin"
              ? "admin"
              : ["user", "owner", "renter"].includes(normalizedType)
                ? "user"
                : normalizedType;

          switch (accountType) {
            case "admin":
              navigate("/adminhome");
              break;
            case "user":
              if (pendingBookingPropertyId) {
                localStorage.removeItem("pendingBookingPropertyId");
                navigate("/renterhome", {
                  state: { openBookingPropertyId: pendingBookingPropertyId },
                });
              } else {
                navigate(preferredMode === "renter" ? "/renterhome" : "/ownerhome");
              }
              break;
            default:
              navigate("/");
          }
        }, 650);
      } else {
        showToast("error", res.data.message);
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Login failed");
      navigate("/login");
    }
  };

  return (
    <div className="app-shell">
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <nav className="top-nav">
        <ApnaGharLogo />
        <div className="flex gap-3 text-sm font-semibold text-slate-700">
          <Link className="nav-action" to="/">
            Home
          </Link>
          <Link className="nav-action nav-action-primary" to="/register">
            Register
          </Link>
        </div>
      </nav>

      <section className="mx-auto mt-10 grid w-[94%] max-w-5xl items-stretch gap-6 md:grid-cols-2">
          <article className="soft-card p-7">
            <p className="section-kicker">Welcome Back</p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">Sign In To Continue</h1>
            <p className="mt-4 text-sm text-slate-600">
              Access a role-based space for approvals, listings, and bookings.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="rounded-xl bg-white/60 px-3 py-2">Admin controls for users and approvals.</li>
              <li className="rounded-xl bg-white/60 px-3 py-2">Owner tools for listings and booking responses.</li>
              <li className="rounded-xl bg-white/60 px-3 py-2">Renter flow for browsing and booking history.</li>
            </ul>
          </article>

          <article className="card p-7">
            <div className="mb-6">
              <p className="section-kicker">Account Access</p>
              <h2 className="text-xl font-bold text-slate-900">Account Login</h2>
              <p className="text-sm text-slate-500">Use your registered email and password.</p>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleInput}
                placeholder="Email Address"
                className="field"
              />
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInput}
                placeholder="Password"
                className="field"
              />
              <button type="submit" className="btn btn-primary w-full">
                Sign In
              </button>
            </form>

            <div className="mt-4 flex justify-between text-xs font-semibold text-slate-600">
              <Link to="/forgotpassword" className="text-red-700">
                Forgot Password?
              </Link>
              <Link to="/register" className="text-teal-700">
                Create Account
              </Link>
            </div>
          </article>
      </section>
    </div>
  );
};

export default Login;
