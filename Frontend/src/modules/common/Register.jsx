import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../common/Toast";
import http from "./http";
import ApnaGharLogo from "./ApnaGharLogo";
import { useContext } from "react";
import { UserContext } from "../../context/userContext";

const Register = () => {
  const navigate = useNavigate();
  const session = useContext(UserContext);
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

    if (!formState.name || !formState.email || !formState.phone || !formState.password) {
      return showToast("error", "Please fill all fields");
    }

    if (!isEmailVerified || !emailVerificationToken) {
      return showToast("error", "Please verify your email with OTP before registering");
    }

    try {
      const response = await http.post("/api/user/register", {
        ...formState,
        phone: formState.phone,
        type: "user",
        emailVerificationToken,
      });

      if (response.data.success) {
        showToast("success", response.data.message);
        
        let signedInUser = response.data.user;
        let userToken = response.data.token;

        // Fallback: If backend was not restarted and did not send user/token,
        // explicitly call the login endpoint to retrieve them natively.
        if (!signedInUser || !userToken) {
          try {
            const loginRes = await http.post("/api/user/login", {
              email: formState.email,
              password: formState.password,
            });
            if (loginRes.data.success) {
              signedInUser = loginRes.data.user;
              userToken = loginRes.data.token;
            }
          } catch (e) {
            console.error("Auto-login fallback failed", e);
          }
        }

        if (signedInUser) {
          localStorage.setItem("user", JSON.stringify(signedInUser));
          if (userToken) {
            localStorage.setItem("token", userToken);
          }
          if (session) {
            session.setUserData(signedInUser);
            session.setUserLoggedIn(true);
          }
        }

        setTimeout(() => {
          // Force robust refresh routing to completely guarantee App mounts with storage fully synced
          window.location.href = "/";
        }, 1000);
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
            <p className="mt-1 text-sm text-slate-500">Create a user account. Renter/owner mode is selected from home.</p>
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
