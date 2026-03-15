import http from "./http";

export const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export const clearUserSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("preferredMode");
  localStorage.removeItem("pendingBookingPropertyId");
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const logoutUser = async (session, navigate, redirectPath = "/login") => {
  try {
    await http.post("/api/user/logout");
  } catch (error) {
    console.error("Logout API failed, clearing local session anyway", error);
  } finally {
    clearUserSession();
    if (session) {
      session.setUserData(null);
      session.setUserLoggedIn(false);
    }
    if (navigate) {
      navigate(redirectPath, { replace: true });
    }
  }
};
