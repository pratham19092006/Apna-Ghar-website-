import { useEffect, useState } from "react";
import Toast from "../common/Toast";
import http, { API_BASE_URL } from "../common/http";

const AllPropertiesCards = ({ loggedIn }) => {
  const [properties, setProperties] = useState([]);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [propertyAdFilter, setPropertyAdFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [focusedProperty, setFocusedProperty] = useState(null);
  const [userDetails, setUserDetails] = useState({ fullName: "", phone: "" });
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const fetchProperties = async () => {
    try {
      const res = await http.get("/api/user/getAllProperties");
      setProperties(res.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBooking = async (status, propertyId, ownerId) => {
    try {
      const res = await http.post(`/api/user/bookinghandle/${propertyId}`, {
        userDetails,
        status,
        ownerId,
      });

      if (res.data.success) {
        showToast("success", res.data.message);
        setBookingModalOpen(false);
      } else {
        showToast("error", res.data.message);
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Booking failed");
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = properties
    .filter(
      (property) =>
        addressFilter === "" ||
        property.propertyAddress
          .toLowerCase()
          .includes(addressFilter.toLowerCase())
    )
    .filter(
      (property) =>
        propertyAdFilter === "" ||
        property.propertyAdType
          .toLowerCase()
          .includes(propertyAdFilter.toLowerCase())
    )
    .filter(
      (property) =>
        propertyTypeFilter === "" ||
        property.propertyType
          .toLowerCase()
          .includes(propertyTypeFilter.toLowerCase())
    );

  const openBookingModal = (property) => {
    setFocusedProperty(property);
    setBookingModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-4">
        <p className="section-kicker">Property Discovery</p>
        <h4 className="text-lg font-extrabold text-slate-900">Search and Book in Minutes</h4>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-3">
        <input
          type="text"
          placeholder="Search by Address"
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
          className="field"
        />
        <select
          value={propertyAdFilter}
          onChange={(e) => setPropertyAdFilter(e.target.value)}
          className="field"
        >
          <option value="">All Ad Types</option>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
        </select>
        <select
          value={propertyTypeFilter}
          onChange={(e) => setPropertyTypeFilter(e.target.value)}
          className="field"
        >
          <option value="">All Types</option>
          <option value="commercial">Commercial</option>
          <option value="land/plot">Land/Plot</option>
          <option value="residential">Residential</option>
        </select>
      </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => (
            <div
              key={property._id}
              className="card overflow-hidden"
            >
              <img
                src={`${API_BASE_URL}${property.propertyImage?.[0]?.path || ""}`}
                alt="Property"
                className="h-44 w-full object-cover"
              />
              <div className="space-y-2 p-4">
                <h3 className="text-lg font-bold text-slate-900">{property.propertyAddress}</h3>
                <p className="text-sm text-slate-600">
                  {property.propertyType} - {property.propertyAdType}
                </p>
                {loggedIn && (
                  <>
                    <p className="text-sm text-slate-700">
                      <b>Owner:</b> {property.ownerContact}
                    </p>
                    <p className="text-sm text-slate-700">
                      <b>Availability:</b> {property.isAvailable}
                    </p>
                    <p className="text-sm text-slate-700">
                      <b>Price:</b> Rs {property.propertyAmt}
                    </p>
                  </>
                )}
                {property.isAvailable === "Available" ? (
                  loggedIn ? (
                    <button
                      onClick={() => openBookingModal(property)}
                      className="btn btn-primary mt-2 w-full"
                    >
                      Get Info / Book
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700">
                      Login to see details
                    </p>
                  )
                ) : (
                  <p className="mt-2 text-xs text-red-700">Not Available</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No properties available at the moment.</p>
        )}
      </div>

      {bookingModalOpen && focusedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card relative w-full max-w-2xl p-6">
            <button
              onClick={() => setBookingModalOpen(false)}
              className="absolute right-3 top-3 rounded-md border border-slate-300 px-2 py-1 text-xs"
            >
              Close
            </button>
            <h3 className="mb-4 text-xl font-bold text-slate-900">Property Info</h3>
            <img
              src={`${API_BASE_URL}${focusedProperty.propertyImage?.[0]?.path || ""}`}
              alt="Property"
              className="mb-4 h-48 w-full rounded object-cover"
            />
            <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <p>
                  <b>Owner Contact:</b> {focusedProperty.ownerContact}
                </p>
                <p>
                  <b>Availability:</b> {focusedProperty.isAvailable}
                </p>
                <p>
                  <b>Price:</b> Rs {focusedProperty.propertyAmt}
                </p>
              </div>
              <div>
                <p>
                  <b>Location:</b> {focusedProperty.propertyAddress}
                </p>
                <p>
                  <b>Type:</b> {focusedProperty.propertyType}
                </p>
                <p>
                  <b>Ad Type:</b> {focusedProperty.propertyAdType}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              <b>Additional Info:</b> {focusedProperty.additionalInfo}
            </p>

            <form
              className="mt-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleBooking("pending", focusedProperty._id, focusedProperty.ownerId);
              }}
            >
              <input
                type="text"
                name="fullName"
                placeholder="Your Full Name"
                required
                className="field"
                value={userDetails.fullName}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, fullName: e.target.value })
                }
              />
              <input
                type="number"
                name="phone"
                placeholder="Phone Number"
                required
                className="field"
                value={userDetails.phone}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, phone: e.target.value })
                }
              />
              <button type="submit" className="btn btn-primary w-full">
                Book Property
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPropertiesCards;
