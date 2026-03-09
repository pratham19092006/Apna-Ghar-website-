import { message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../common/http";

const OwnerAllBookings = () => {
  const [allBookings, setAllBookings] = useState([]);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const response = await http.get("/api/owner/getallbookings");

      if (response.data.success) {
        setAllBookings(response.data.data);
      } else {
        message.error(response.data.message || "Unauthorized access");
        navigate("/login"); 
      }
    } catch (error) {
      console.log(error);
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

  const handleStatus = async (bookingId, propertyId, status) => {
    try {
      const res = await http.post("/api/owner/handlebookingstatus", {
        bookingId,
        propertyId,
        status,
      });

      if (res.data.success) {
        message.success(res.data.message);
        fetchBookings();
      } else {
        message.error("Something went wrong");
      }
    } catch (error) {
      console.log(error);
      message.error("Failed to update booking status");
    }
  };

  return (
    <div className="mt-4">
      <table className="data-table">
        <thead>
      <tr>
        <th>Booking ID</th>
        <th>Property ID</th>
        <th>Tenant Name</th>
        <th>Tenant Phone</th>
        <th>Booking Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {allBookings.length > 0 ? (
        allBookings.map((booking) => (
          <tr key={booking._id}>
            <td>{booking._id}</td>
            <td>{booking.propertyId}</td>
            <td>{booking.userName}</td>
            <td>{booking.phone}</td>
            <td>{booking.bookingStatus}</td>
            <td>
              {booking.bookingStatus === "pending" ? (
                <button
                  onClick={() =>
                    handleStatus(booking._id, booking.propertyId, "booked")
                  }
                  className="btn btn-primary text-xs"
                >
                  Mark Booked
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleStatus(booking._id, booking.propertyId, "pending")
                  }
                  className="btn btn-warn text-xs"
                >
                  Mark Pending
                </button>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={6}>No bookings available</td>
        </tr>
      )}
    </tbody>
  </table>
    </div>

  );
};

export default OwnerAllBookings;
