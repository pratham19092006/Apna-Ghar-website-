import { useEffect, useState } from "react";
import http from "../common/http";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalProperties: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [usersRes, propertiesRes, bookingsRes] = await Promise.all([
        http.get("/api/admin/getallusers"),
        http.get("/api/admin/getallproperties"),
        http.get("/api/admin/getallbookings"),
      ]);

      const users = usersRes.data.data || [];
      const properties = propertiesRes.data.data || [];
      const bookings = bookingsRes.data.data || [];

      const totalAdmins = users.filter((u) => String(u.type).toLowerCase() === "admin").length;
      
      setStats({
        totalUsers: users.length,
        totalAdmins,
        totalProperties: properties.length,
        totalBookings: bookings.length,
      });
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Loading analytics...</div>;
  }

  return (
    <div className="relative mt-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-indigo-900 mb-1">Total Accounts</p>
          <p className="text-4xl font-black text-indigo-700">{stats.totalUsers}</p>
        </div>
        
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-rose-900 mb-1">Total Admins</p>
          <p className="text-4xl font-black text-rose-700">{stats.totalAdmins}</p>
        </div>

        <div className="rounded-xl border border-teal-100 bg-teal-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-teal-900 mb-1">Total Properties</p>
          <p className="text-4xl font-black text-teal-700">{stats.totalProperties}</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-amber-900 mb-1">Total Bookings</p>
          <p className="text-4xl font-black text-amber-700">{stats.totalBookings}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
