import { useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import http from "../common/http";

const AdminAllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const response = await http.get("/api/admin/getallbookings");

      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        message.error(response.data.message || "Unauthorized access");
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        message.error("Session expired, please login again");
        navigate("/login");
      } else {
        message.error("Failed to fetch bookings");
      }
    }
  };


  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="mt-4">
      <table className="data-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Owner ID</th>
            <th>Property ID</th>
            <th>Tenant ID</th>
            <th>Tenant Name</th>
            <th>Tenant Contact</th>
            <th>Booking Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <tr key={booking._id}>
                <td>{booking._id}</td>
                <td>{booking.ownerID}</td>
                <td>{booking.propertyId}</td>
                <td>{booking.userID}</td>
                <td>{booking.userName}</td>
                <td>{booking.phone}</td>
                <td>{booking.bookingStatus}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No bookings found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAllBookings;
