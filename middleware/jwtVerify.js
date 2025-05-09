const jwt = require("jsonwebtoken");

const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET_ACCESS, (err, decoded) => {
      if (err) return res.sendStatus(403); //invalid token
      req.user = decoded.userId;
      next();
    });
  } catch (err) {
    res.status(500).send({ errorMessage: "Internal server error" });
  }
};

module.exports = verifyJWT;
