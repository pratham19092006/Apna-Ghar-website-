import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../common/Toast";
import http from "./http";
import ApnaGharLogo from "./ApnaGharLogo";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [payload, setPayload] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!payload.email || !payload.password || !payload.confirmPassword) {
      return showToast("error", "Please fill all fields");
    }

    if (payload.password !== payload.confirmPassword) {
      return showToast("error", "Passwords do not match");
    }

    try {
      const res = await http.post("/api/user/forgotpassword", payload);

      if (res.data.success) {
        showToast("success", "Your password has been changed!");
        navigate("/login");
      } else {
        showToast("error", res.data.message);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        showToast("error", "User doesn't exist");
      } else {
        showToast("error", "Something went wrong. Please try again.");
      }
      navigate("/register");
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
          <Link className="nav-action nav-action-login" to="/login">
            Login
          </Link>
        </div>
      </nav>

      <section className="card mx-auto mt-10 w-[94%] max-w-md p-7">
          <div className="mb-6 text-center">
            <p className="section-kicker">Password Reset</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Forgot Password?</h1>
            <p className="mt-1 text-sm text-slate-500">
              Recover access with a secure password update.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              value={payload.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="field"
            />
            <input
              type="password"
              name="password"
              value={payload.password}
              onChange={handleChange}
              placeholder="New Password"
              className="field"
            />
            <input
              type="password"
              name="confirmPassword"
              value={payload.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="field"
            />
            <button type="submit" className="btn btn-primary w-full">
              Change Password
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account? <Link to="/register" className="font-semibold text-teal-700">Sign Up</Link>
          </p>
      </section>
    </div>
  );
};

export default ForgotPassword;

