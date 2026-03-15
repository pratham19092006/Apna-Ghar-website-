import { useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import http from "../../common/http";

const RenterAllProperty = () => {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const response = await http.get("/api/user/getallbookings");

      if (response.data.success) {
        setBookings(response.data.data);
      } 
      else {
        message.error(response.data.message);
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        message.error("Session expired, please login again");
        navigate("/login");
      } else {
        message.error("Failed to fetch properties");
      }
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Property ID</th>
            <th>Tenant Name</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Total Members</th>
            <th>Female Members</th>
            <th>Male Members</th>
            <th>Booking Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <tr key={booking._id}>
                <td>{booking._id}</td>
                <td>{booking.propertyId}</td>
                <td>{booking.userName}</td>
                <td>{booking.address || "-"}</td>
                <td>{booking.phone}</td>
                <td>{booking.memberCount ?? "-"}</td>
                <td>{booking.femaleCount ?? "-"}</td>
                <td>{booking.maleCount ?? "-"}</td>
                <td>{booking.bookingStatus}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9">No bookings found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RenterAllProperty;

