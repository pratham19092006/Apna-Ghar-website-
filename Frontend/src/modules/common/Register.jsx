import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../common/Toast";
import http from "./http";
import ApnaGharLogo from "./ApnaGharLogo";

const Register = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpRequested, setEmailOtpRequested] = useState(false);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    type: "",
  });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setEmailOtpCode("");
      setEmailOtpRequested(false);
      setEmailOtpSending(false);
      setEmailOtpVerifying(false);
      setIsEmailVerified(false);
      setEmailVerificationToken("");
    }
  };

  const handleRequestEmailOtp = async () => {
    const email = String(formState.email || "").trim();

    if (!email) {
      return showToast("error", "Please enter your email first");
    }

    setEmailOtpSending(true);
    try {
      const response = await http.post("/api/user/request-email-otp", { email });

      if (response.data?.success) {
        setEmailOtpRequested(true);
        setIsEmailVerified(false);
        setEmailVerificationToken("");
        showToast("success", response.data.message || "OTP sent to your email");
      } else {
        showToast("error", response.data?.message || "Failed to send email OTP");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to send email OTP");
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const email = String(formState.email || "").trim();
    const otp = String(emailOtpCode || "").trim();

    if (!email) {
      return showToast("error", "Please enter your email first");
    }

    if (!otp) {
      return showToast("error", "Please enter the email OTP");
    }

    setEmailOtpVerifying(true);
    try {
      const response = await http.post("/api/user/verify-email-otp", { email, otp });

      if (response.data?.success) {
        setIsEmailVerified(true);
        setEmailVerificationToken(response.data?.emailVerificationToken || "");
        showToast("success", response.data.message || "Email verified successfully");
      } else {
        showToast("error", response.data?.message || "Email OTP verification failed");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Email OTP verification failed");
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.name || !formState.email || !formState.phone || !formState.password || !formState.type) {
      return showToast("error", "Please fill all fields");
    }

    if (!isEmailVerified || !emailVerificationToken) {
      return showToast("error", "Please verify your email with OTP before registering");
    }

    try {
      const response = await http.post("/api/user/register", {
        ...formState,
        phone: formState.phone,
        emailVerificationToken,
      });

      if (response.data.success) {
        showToast("success", response.data.message);
        setTimeout(() => navigate("/"), 1000);
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
            <p className="mt-1 text-sm text-slate-500">Create a user or admin account. Renter/owner mode is selected from home.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="field md:col-span-2"
            />
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="field"
              disabled={isEmailVerified}
            />
            <button
              type="button"
              onClick={handleRequestEmailOtp}
              disabled={emailOtpSending || isEmailVerified}
              className="btn btn-primary"
            >
              {isEmailVerified ? "Verified" : emailOtpSending ? "Sending..." : "Send Email OTP"}
            </button>
            <input
              type="text"
              value={emailOtpCode}
              onChange={(e) => setEmailOtpCode(e.target.value)}
              placeholder="Enter Email OTP"
              className="field"
              disabled={isEmailVerified}
            />
            <button
              type="button"
              onClick={handleVerifyEmailOtp}
              disabled={emailOtpVerifying || isEmailVerified || !emailOtpRequested}
              className="btn btn-primary"
            >
              {emailOtpVerifying ? "Verifying..." : "Verify Email OTP"}
            </button>
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              placeholder="Password"
              className="field md:col-span-2"
            />
            <input
              type="tel"
              name="phone"
              value={formState.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="field md:col-span-2"
            />

            <select
              name="type"
              value={formState.type}
              onChange={handleChange}
              className="field md:col-span-2"
            >
              <option value="">Select Account Type</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <button type="submit" className="btn btn-primary md:col-span-2">Register</button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Have an account? <Link to="/login" className="font-semibold text-teal-700">Sign In</Link>
          </p>
      </section>
    </div>
  );
};

export default Register;
