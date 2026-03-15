const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const authToken = req.cookies.token || bearerToken;

    if (!authToken) {
      return res
        .status(401)
        .send({ message: "No token found in cookies", success: false });
    }

    jwt.verify(authToken, process.env.JWT_KEY, (verifyError, decodedToken) => {
      if (verifyError) {
        return res
          .status(401)
          .send({ message: "Token is not valid", success: false });
      }

      req.body = req.body || {};
      req.body.userId = decodedToken.id;
      next();
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};

module.exports = {
  authMiddleware,
};