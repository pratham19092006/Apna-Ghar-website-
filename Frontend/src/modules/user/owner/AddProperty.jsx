import { useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import http from "../../common/http";

function AddProperty() {
  const [images, setImages] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState({
    propertyType: "residential",
    propertyAdType: "rent",
    propertyAddress: "",
    ownerContact: "",
    propertyAmt: 0,
    additionalInfo: "",
  });
  const navigate = useNavigate();

  const setFormValue = (event) => {
    const { name, value } = event.target;
    setPropertyDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelection = (event) => {
    setImages(event.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(propertyDetails).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (images) {
      for (let i = 0; i < images.length; i += 1) {
        formData.append("propertyImages", images[i]);
      }
    }

    try {
      const res = await http.post("/api/owner/postproperty", formData);

      if (res.data.success) {
        message.success(res.data.message);
        setPropertyDetails({
          propertyType: "residential",
          propertyAdType: "rent",
          propertyAddress: "",
          ownerContact: "",
          propertyAmt: 0,
          additionalInfo: "",
        });
        setImages(null);
      } else {
        message.error(res.data.message || "Unauthorized access");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error adding property:", error);
      if (error.response && error.response.status === 401) {
        message.error("Session expired, please login again");
        navigate("/login");
      } else {
        message.error("Failed to add property");
      }
    }
  };

  return (
    <div className="soft-card p-6">
      <h2 className="mb-5 text-2xl font-black text-slate-900">Add New Property</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Property Type
            </label>
        <select
          name="propertyType"
          value={propertyDetails.propertyType}
          onChange={setFormValue}
          className="field"
        >
          <option disabled>Choose...</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="land/plot">Land/Plot</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Property Ad Type
        </label>
        <select
          name="propertyAdType"
          value={propertyDetails.propertyAdType}
          onChange={setFormValue}
          className="field"
        >
          <option disabled>Choose...</option>
          <option value="rent">Rent</option>
          <option value="sale">Sale</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Property Full Address
        </label>
        <input
          type="text"
          name="propertyAddress"
          value={propertyDetails.propertyAddress}
          onChange={setFormValue}
          placeholder="Address"
          required
          className="field"
        />
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Property Images
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          required
          onChange={handleImageSelection}
          className="field"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Owner Contact No.
        </label>
        <input
          type="tel"
          name="ownerContact"
          value={propertyDetails.ownerContact}
          onChange={setFormValue}
          placeholder="Contact number"
          required
          className="field"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Property Amount
        </label>
        <input
          type="number"
          name="propertyAmt"
          value={propertyDetails.propertyAmt}
          onChange={setFormValue}
          placeholder="Amount"
          required
          className="field"
        />
      </div>
    </div>

    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Additional Details for the Property
      </label>
      <textarea
        name="additionalInfo"
        value={propertyDetails.additionalInfo}
        onChange={setFormValue}
        rows={4}
        placeholder="Add any details here..."
        className="field"
      />
    </div>

    <div className="text-right">
      <button type="submit" className="btn btn-primary">
        Submit Form
      </button>
    </div>
  </form>
    </div>
  );
}

export default AddProperty;
