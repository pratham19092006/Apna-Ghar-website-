import { useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import http from "../common/http";

const AdminAllProperty = () => {
  const [properties, setProperties] = useState([]);
  const navigate = useNavigate();

  const fetchAllProperties = async () => {
    try {
      const response = await http.get("/api/admin/getallproperties");

      if (response.data.success) {
        setProperties(response.data.data);
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
        message.error("Failed to fetch Property");
      }
    }
  };

  useEffect(() => {
    fetchAllProperties();
  }, []);

  return (
    <div className="mt-4">
      <table className="data-table">
        <thead>
          <tr>
            <th>Property ID</th>
            <th>Owner ID</th>
            <th>Property Type</th>
            <th>Property Ad Type</th>
            <th>Property Address</th>
            <th>Owner Contact</th>
            <th>Property Amt</th>
          </tr>
        </thead>
        <tbody>
          {properties.length > 0 ? (
            properties.map((property) => (
              <tr key={property._id}>
                <td>{property._id}</td>
                <td>{property.ownerId}</td>
                <td>{property.propertyType}</td>
                <td>{property.propertyAdType || "N/A"}</td>
                <td>{property.propertyAddress}</td>
                <td>{property.ownerContact}</td>
                <td>Rs {property.propertyAmt}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No properties found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAllProperty;
