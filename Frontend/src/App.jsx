import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./modules/common/Home";
import Login from "./modules/common/Login";
import Register from "./modules/common/Register";
import ForgotPassword from "./modules/common/ForgotPassword";
import AdminHome from "./modules/admin/AdminHome";
import OwnerHome from "./modules/user/owner/OwnerHome";
import RenterHome from "./modules/user/renter/RenterHome";
import AllUsers from "./modules/admin/AllUsers";
import AddProperty from "./modules/user/owner/AddProperty";
import OwnerAllBookings from "./modules/user/owner/AllBookings";
import RenterAllProperty from "./modules/user/renter/AllProperties";
import AdminAllBookings from "./modules/admin/AllBookings";
import AdminAllProperty from "./modules/admin/AllProperty";
import OwnerAllProperties from "./modules/user/owner/AllProperties";
import AllPropertiesCards from "./modules/user/AllPropertiesCards";
import { useEffect, useState } from "react";
import { UserContext } from "./context/userContext";

const readPersistedUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    console.error("Unable to parse user from localStorage", error);
    return null;
  }
};

function App() {
  const [userData, setUserData] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    const existingUser = readPersistedUser();
    if (existingUser) {
      setUserData(existingUser);
      setUserLoggedIn(true);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{ userData, setUserData, userLoggedIn, setUserLoggedIn }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/adminhome" element={<AdminHome />} />
          <Route path="/ownerhome" element={<OwnerHome />} />
          <Route path="/renterhome" element={<RenterHome />} />
          <Route path="/getallbookings" element={<AdminAllBookings />} />
          <Route path="/getallproperties" element={<AdminAllProperty />} />
          <Route path="/getallusers" element={<AllUsers />} />
          <Route path="/postproperty" element={<AddProperty />} />
          <Route path="/getallbookings" element={<OwnerAllBookings />} />
          <Route path="/getallproperties" element={<OwnerAllProperties />} />
          <Route path="/getallbookings" element={<RenterAllProperty />} />
          <Route path="/getAllProperties" element={<AllPropertiesCards />} />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
