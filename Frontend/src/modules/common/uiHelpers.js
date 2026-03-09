export const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export const clearUserSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};
