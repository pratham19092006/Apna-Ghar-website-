import { useEffect, useState } from "react";
import Toast from "../common/Toast";
import { useNavigate } from "react-router-dom";
import http from "../common/http";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const navigate = useNavigate();

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await http.get("/api/admin/getallusers");

      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        showToast("error", response.data.message || "Unauthorized access");
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Failed to fetch Users");
    }
  };

  return (
    <div className="relative mt-4">
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user._id}>
                <td>{user._id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{String(user.type).toLowerCase() === "admin" ? "Admin" : "User"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AllUsers;
