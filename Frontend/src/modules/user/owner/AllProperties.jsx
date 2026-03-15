import { message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../common/http";

const OwnerAllProperties = () => {
  const [image, setImage] = useState(null);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [editingPropertyData, setEditingPropertyData] = useState({
    propertyType: "",
    propertyAdType: "",
    propertyAddress: "",
    ownerContact: "",
    propertyAmt: 0,
    additionalInfo: "",
  });
  const [allProperties, setAllProperties] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const closeModal = () => setShowEditModal(false);

  const openModal = (property) => {
    setEditingPropertyId(property._id);
    setEditingPropertyData(property);
    setShowEditModal(true);
  };

  const fetchOwnerProperties = async () => {
    try {
      const response = await http.get("/api/owner/getallproperties");
      if (response.data.success) {
        setAllProperties(response.data.data);
      } else {
        message.error(response.data.message || "Failed to fetch properties");
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        message.error("Session expired, please login again");
        navigate("/login");
      } else {
        message.error("Failed to fetch properties");
      }
    }
  };

  useEffect(() => {
    fetchOwnerProperties();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingPropertyData((prev) => ({ ...prev, [name]: value }));
  };

  const saveChanges = async (propertyId, status) => {
    try {
      const formData = new FormData();
      Object.entries(editingPropertyData).forEach(([key, value]) =>
        formData.append(key, value)
      );
      if (image) formData.append("propertyImage", image);
      formData.append("isAvailable", status);

      const res = await http.patch(`/api/owner/updateproperty/${propertyId}`, formData);

      if (res.data.success) {
        message.success(res.data.message);
        closeModal();
        fetchOwnerProperties();
      } else {
        message.error(res.data.message || "Failed to save changes");
      }
    } catch (error) {
      console.log(error);

      if (error.response && error.response.status === 401) {
        message.error("Session expired, please login again");
        navigate("/login");
      } else {
        message.error("Failed to save changes");
      }
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm("Are you sure to delete?")) {
      try {
        const response = await http.delete(`/api/owner/deleteproperty/${propertyId}`);

        if (response.data.success) {
          message.success(response.data.message);
          fetchOwnerProperties();
        } else {
          message.error(response.data.message || "Failed to delete property");
        }
      } catch (error) {
        console.log(error);

        if (error.response && error.response.status === 401) {
          message.error("Session expired, please login again");
          navigate("/login");
        } else {
          message.error("Failed to delete property");
        }
      }
    }
  };


  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200">
        <table className="data-table">
          <thead>
        <tr>
          <th>Property ID</th>
          <th>Property Type</th>
          <th>Ad Type</th>
          <th>Address</th>
          <th>Owner Contact</th>
          <th>Amount</th>
          <th>Availability</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {allProperties.map((property) => (
          <tr key={property._id}>
            <td>{property._id}</td>
            <td>{property.propertyType}</td>
            <td>{property.propertyAdType}</td>
            <td>{property.propertyAddress}</td>
            <td>{property.ownerContact}</td>
            <td>Rs {property.propertyAmt}</td>
            <td>{property.isAvailable}</td>
            <td className="flex gap-2">
              <button
                onClick={() => openModal(property)}
                className="btn btn-primary text-xs"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(property._id)}
                className="btn btn-danger text-xs"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="card w-full max-w-xl p-6">
            <h3 className="mb-5 text-2xl font-black text-slate-900">Edit Property</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveChanges(editingPropertyId, editingPropertyData.isAvailable);
          }}
              className="space-y-3"
        >
          <input
            type="text"
            name="propertyType"
            value={editingPropertyData.propertyType}
            onChange={handleChange}
            placeholder="Property Type"
                className="field"
          />
          <input
            type="text"
            name="propertyAdType"
            value={editingPropertyData.propertyAdType}
            onChange={handleChange}
            placeholder="Ad Type"
                className="field"
          />
          <input
            type="text"
            name="propertyAddress"
            value={editingPropertyData.propertyAddress}
            onChange={handleChange}
            placeholder="Property Address"
                className="field"
          />
          <input
            type="text"
            name="ownerContact"
            value={editingPropertyData.ownerContact}
            onChange={handleChange}
            placeholder="Owner Contact"
                className="field"
          />
          <input
            type="number"
            name="propertyAmt"
            value={editingPropertyData.propertyAmt}
            onChange={handleChange}
            placeholder="Property Amount"
                className="field"
          />
          <textarea
            name="additionalInfo"
            value={editingPropertyData.additionalInfo}
            onChange={handleChange}
            placeholder="Additional Info"
                className="field"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
                className="field"
          />

              <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
                  onClick={closeModal}
                  className="btn border border-slate-300 bg-white text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
                  className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
          </div>
      </div>
      )}
    </div>

  );
};

export default OwnerAllProperties;

