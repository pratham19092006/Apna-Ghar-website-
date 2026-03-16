import { useEffect, useState } from "react";
import Toast from "../common/Toast";
import http, { API_BASE_URL } from "../common/http";

const RENT_BOOKING_FEE_RUPEES = 50;

const AllPropertiesCards = ({
  loggedIn,
  autoOpenPropertyId = "",
  onAutoOpenHandled = () => {},
}) => {
  const initialUserDetails = {
    fullName: "",
    address: "",
    phone: "",
    memberCount: "",
    femaleCount: "",
    maleCount: "",
  };

  const currentUser = (() => {
    try {
      const rawUser = localStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  })();
  const [properties, setProperties] = useState([]);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [propertyAdFilter, setPropertyAdFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [focusedProperty, setFocusedProperty] = useState(null);
  const [userDetails, setUserDetails] = useState(initialUserDetails);
  const [bookingFeeAccepted, setBookingFeeAccepted] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [phonePePaymentInitiated, setPhonePePaymentInitiated] = useState(false);
  const [phonePePaymentIntentRef, setPhonePePaymentIntentRef] = useState("");
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
  };

  const getOwnerContactForDisplay = (ownerContact = "", propertyAdType = "") => {
    const adType = String(propertyAdType || "").trim().toLowerCase();
    const contact = String(ownerContact || "").trim();

    if (adType !== "rent") {
      return contact;
    }

    const digits = contact.replace(/\D/g, "");
    if (!digits) {
      return contact;
    }

    if (digits.length <= 6) {
      return "*".repeat(digits.length);
    }

    return `${"*".repeat(6)}${digits.slice(6)}`;
  };

  const fetchProperties = async () => {
    try {
      const res = await http.get("/api/user/getAllProperties");
      setProperties(res.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBooking = async (status, propertyId) => {
    const isRentBooking =
      String(focusedProperty?.propertyAdType || "").trim().toLowerCase() === "rent";

    if (isRentBooking && !bookingFeeAccepted) {
      return showToast(
        "error",
        `Please accept the Rs ${RENT_BOOKING_FEE_RUPEES} booking amount note before booking`
      );
    }

    try {
      setBookingInProgress(true);
      let paymentPayload = {
        bookingFeeAccepted: isRentBooking ? bookingFeeAccepted : false,
      };

      if (isRentBooking) {
        if (!phonePePaymentInitiated) {
          const intentResponse = await http.post(
            `/api/user/create-phonepe-payment-intent/${propertyId}`
          );

          if (!intentResponse.data?.success) {
            showToast("error", intentResponse.data?.message || "Unable to start payment");
            return;
          }

          const upiUrl = intentResponse.data?.upiUrl;
          const isMobileDevice = /Android|iPhone|iPad|iPod|Windows Phone/i.test(
            navigator.userAgent
          );

          setPhonePePaymentInitiated(true);
          setPhonePePaymentIntentRef(intentResponse.data?.transactionRef || "");

          if (upiUrl && isMobileDevice) {
            window.location.href = upiUrl;
            showToast(
              "success",
              `PhonePe opened. After payment, return here and click Pay Rs ${RENT_BOOKING_FEE_RUPEES} & Confirm Booking again.`
            );
          } else if (upiUrl) {
            try {
              await navigator.clipboard.writeText(upiUrl);
              showToast(
                "success",
                `Desktop detected: UPI link copied. Complete payment in PhonePe app, then click Pay Rs ${RENT_BOOKING_FEE_RUPEES} & Confirm Booking again.`
              );
            } catch {
              showToast(
                "error",
                `Desktop detected: pay Rs ${RENT_BOOKING_FEE_RUPEES} to ${intentResponse.data?.upiId || "merchant UPI"}, then click Pay Rs ${RENT_BOOKING_FEE_RUPEES} & Confirm Booking again.`
              );
            }
          }

          return;
        }

        paymentPayload = {
          bookingFeeAccepted: true,
          paymentMethod: "phonepe",
          paymentIntentRef: phonePePaymentIntentRef,
        };
      }

      const res = await http.post(`/api/user/bookinghandle/${propertyId}`, {
        userDetails,
        status,
        ...paymentPayload,
      });

      if (res.data.success) {
        showToast("success", res.data.message);
        setPhonePePaymentInitiated(false);
        setPhonePePaymentIntentRef("");
        setBookingModalOpen(false);
      } else {
        showToast("error", res.data.message);
      }
    } catch (error) {
      console.log(error);
      const serverMessage = error?.response?.data?.message;
      showToast("error", serverMessage || "Booking failed");
    } finally {
      setBookingInProgress(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (!loggedIn || !autoOpenPropertyId || properties.length === 0) {
      return;
    }

    const matchedProperty = properties.find(
      (property) => property._id === autoOpenPropertyId
    );

    if (matchedProperty) {
      setFocusedProperty(matchedProperty);
      setBookingModalOpen(true);
    }

    onAutoOpenHandled();
  }, [autoOpenPropertyId, loggedIn, onAutoOpenHandled, properties]);

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
    setBookingFeeAccepted(false);
    setPhonePePaymentInitiated(false);
    setPhonePePaymentIntentRef("");
    setUserDetails((prev) => ({
      ...initialUserDetails,
      phone: currentUser?.phone || prev.phone,
    }));
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
            (() => {
              const isOwnProperty =
                loggedIn &&
                currentUser?._id &&
                property?.ownerId &&
                String(property.ownerId) === String(currentUser._id);

              return (
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
                      <b>Owner:</b>{" "}
                      {getOwnerContactForDisplay(
                        property.ownerContact,
                        property.propertyAdType
                      )}
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
                    isOwnProperty ? (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        You posted this property, so booking is disabled.
                      </p>
                    ) : (
                      <button
                        onClick={() => openBookingModal(property)}
                        className="btn btn-primary mt-2 w-full"
                      >
                        Get Info / Book
                      </button>
                    )
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
              );
            })()
          ))
        ) : (
          <p className="text-sm text-slate-500">No properties available at the moment.</p>
        )}
      </div>

      {bookingModalOpen && focusedProperty && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card relative w-full max-w-2xl max-h-[88vh] overflow-y-auto p-6">
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
                  <b>Owner Contact:</b>{" "}
                  {getOwnerContactForDisplay(
                    focusedProperty.ownerContact,
                    focusedProperty.propertyAdType
                  )}
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
            {String(focusedProperty.propertyAdType || "").trim().toLowerCase() ===
              "rent" && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>
                  A minimal booking amount of <b>Rs {RENT_BOOKING_FEE_RUPEES}</b> is required to confirm this renting.
                </p>
                <p className="mt-1">
                  If the home is not finally rented, this amount will be refunded.
                </p>
              </div>
            )}

            <form
              className="mt-4 space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                await handleBooking("pending", focusedProperty._id);
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
                type="text"
                name="address"
                placeholder="Your Address"
                required
                className="field"
                value={userDetails.address}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, address: e.target.value })
                }
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  required
                  className="field"
                  value={userDetails.phone}
                  onChange={(e) =>
                    setUserDetails({ ...userDetails, phone: e.target.value })
                  }
                />
              </div>
              <input
                type="number"
                name="memberCount"
                placeholder="Total Members Want To Live"
                required
                min="1"
                className="field"
                value={userDetails.memberCount}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, memberCount: e.target.value })
                }
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  name="femaleCount"
                  placeholder="No. of Female Members"
                  required
                  min="0"
                  className="field flex-1"
                  value={userDetails.femaleCount}
                  onChange={(e) =>
                    setUserDetails({ ...userDetails, femaleCount: e.target.value })
                  }
                />
                <input
                  type="number"
                  name="maleCount"
                  placeholder="No. of Male Members"
                  required
                  min="0"
                  className="field flex-1"
                  value={userDetails.maleCount}
                  onChange={(e) =>
                    setUserDetails({ ...userDetails, maleCount: e.target.value })
                  }
                />
              </div>
              {String(focusedProperty.propertyAdType || "").trim().toLowerCase() ===
                "rent" && (
                <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={bookingFeeAccepted}
                    onChange={(e) => setBookingFeeAccepted(e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <span>
                    I agree to pay the minimal amount of <b>Rs {RENT_BOOKING_FEE_RUPEES}</b> to confirm this room. If the home is
                    not finally rented, this amount will be refunded.
                  </span>
                </label>
              )}
              <button type="submit" className="btn btn-primary w-full">
                {bookingInProgress
                  ? "Processing..."
                  : String(focusedProperty.propertyAdType || "")
                      .trim()
                      .toLowerCase() === "rent"
                  ? `Pay Rs ${RENT_BOOKING_FEE_RUPEES} & Confirm Booking`
                  : "Book Property"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPropertiesCards;
