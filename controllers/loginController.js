const userSchema = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { oauth2Client } = require("../utils/googleClient");
const axios = require("axios");

// Controller for handling Google login
exports.login = async (req, res) => {
  try {
    const { code } = req.body;
    // Exchange authorization code for access/refresh tokens from Google
    const googleRes = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleRes.tokens);
    // Get user info from Google using the access token
    const userRes = await axios.get(
      `${process.env.GOOGLE_URL}?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const { email, name } = userRes.data;
    let userDetails = await userSchema.findOne({ email });
    // Check if user exists in DB; if not, create a new one
    if (!userDetails) {
      const newUser = new userSchema({
        name,
        email,
        g_accessToken: googleRes.tokens.access_token,
        g_refreshToken: googleRes.tokens.refresh_token,
      });
      userDetails = await newUser.save();
    } else {
      // Update existing user's Google tokens
      userDetails.g_accessToken = googleRes.tokens.access_token;
      userDetails.g_refreshToken = googleRes.tokens.refresh_token;
    }
    // Handle refresh tokens
    const cookies = req.cookies;
    let newRefreshTokenArray = !cookies?.jwt
      ? userDetails.refreshToken
      : userDetails.refreshToken.filter((rt) => rt !== cookies.jwt);
    // Generate access and refresh tokens
    const accessToken = jwt.sign(
      { userId: userDetails?._id },
      process.env.JWT_SECRET_ACCESS,
      { expiresIn: "12h" }
    );
    const refreshToken = jwt.sign(
      { userId: userDetails?._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "2d" }
    );
    // Save new refresh token to DB
    userDetails.refreshToken = [...newRefreshTokenArray, refreshToken];
    await userDetails.save();
    // Store refresh token in cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      //   secure: true,
      //   sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      accessToken,
      name: userDetails.name,
      mobile: userDetails.mobile,
    });
  } catch (err) {
    res.status(500).send({ errorMessage: err.message });
  }
};

// Controller for refreshing access tokens using refresh token
exports.handleRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    const foundUser = await userSchema.findOne({ refreshToken });
    if (!foundUser) return res.sendStatus(403);
    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err || foundUser._id.toString() !== decoded.userId)
        return res.sendStatus(403);
      // Generate new access token
      const accessToken = jwt.sign(
        { userId: foundUser._id },
        process.env.JWT_SECRET_ACCESS,
        { expiresIn: "12h" }
      );
      res.json({
        accessToken,
        name: foundUser.name,
        mobile: foundUser?.mobile,
      });
    });
  } catch (err) {
    res.status(500).send({ errorMessage: "Internal server error" });
  }
};

// Controller for logging out a user
exports.logOut = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      const token = authHeader.split(" ")[1];
    }
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;
    const foundUser = await userSchema.findOne({ refreshToken });
    // Clear the refresh token cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      //   sameSite: "None",
      //   secure: true,
    });

    // Delete refreshToken in db
    if (foundUser) {
      const otherUsers = foundUser.refreshToken.filter(
        (val) => val !== refreshToken
      );
      foundUser.refreshToken = otherUsers;
      await foundUser.save();
    }
    return res.sendStatus(204);
  } catch (err) {
    res.status(500).send({ errorMessage: "Internal server error" });
  }
};
