const userSchema = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { oauth2Client } = require("../utils/googleClient");
const axios = require("axios");

exports.login = async (req, res) => {
  try {
    const { code } = req.body;
    const googleRes = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(
      `${process.env.GOOGLE_URL}?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const { email, name } = userRes.data;
    let userDetails = await userSchema.findOne({ email });
    if (!userDetails) {
      const newUser = new userSchema({
        name,
        email,
        token: googleRes.tokens.access_token,
      });
      userDetails = await newUser.save();
    }
    const cookies = req.cookies;
    let newRefreshTokenArray = !cookies?.jwt
      ? userDetails.refreshToken
      : userDetails.refreshToken.filter((rt) => rt !== cookies.jwt);
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
    userDetails.refreshToken = [...newRefreshTokenArray, refreshToken];
    await userDetails.save();
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

exports.handleRefreshToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    const foundUser = await userSchema.findOne({ refreshToken });
    if (!foundUser) return res.sendStatus(403);
    // evaluate jwt
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err || foundUser._id.toString() !== decoded.userId)
        return res.sendStatus(403);
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
    console.log("found user", foundUser);
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
