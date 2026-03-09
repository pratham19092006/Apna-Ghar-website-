import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../common/Toast";
import http from "./http";
import ApnaGharLogo from "./ApnaGharLogo";

const Register = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    type: "",
  });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.name || !formState.email || !formState.password || !formState.type) {
      return showToast("error", "Please fill all fields");
    }

    try {
      const response = await http.post("/api/user/register", formState);

      if (response.data.success) {
        showToast("success", response.data.message);
        setTimeout(() => navigate("/login"), 1000);
      } else {
        showToast("error", response.data.message);
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Registration failed. Please try again.");
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

      <section className="card mx-auto mt-10 w-[94%] max-w-4xl p-8">
          <div className="mb-6">
            <p className="section-kicker">New Account</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Create Your ApnaGhar Profile</h1>
            <p className="mt-1 text-sm text-slate-500">Join as renter, owner, or admin and start using the platform instantly.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="Renter Full Name / Owner Name"
              className="field md:col-span-2"
            />
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="field"
            />
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              placeholder="Password"
              className="field"
            />

            <select
              name="type"
              value={formState.type}
              onChange={handleChange}
              className="field md:col-span-2"
            >
              <option value="">Select User Type</option>
              <option value="Renter">Renter</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
            </select>

            <button type="submit" className="btn btn-primary md:col-span-2">
              Register
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Have an account? <Link to="/login" className="font-semibold text-teal-700">Sign In</Link>
          </p>
      </section>
    </div>
  );
};

export default Register;
