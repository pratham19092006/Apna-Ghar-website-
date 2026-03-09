import { useEffect } from "react";

const Toast = ({ type = "success", message = "", onClose }) => {
  useEffect(() => {
    const timeoutId = setTimeout(onClose, 3000);
    return () => clearTimeout(timeoutId);
  }, [onClose]);

  const success = type === "success";
  const palette = success
    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
    : "bg-red-50 border-red-300 text-red-800";

  return (
    <div
      className={`fixed right-5 top-5 z-[9999] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${palette}`}
      role="status"
    >
      <span className="text-xs font-bold uppercase tracking-wide">
        {success ? "Success" : "Error"}
      </span>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-1 rounded-md border border-current px-2 py-0.5 text-xs"
      >
        Close
      </button>
    </div>
  );
};

export default Toast;
