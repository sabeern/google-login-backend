const { oauth2Client } = require("../utils/googleClient");
const userSchema = require("../models/userModel");
const { google } = require("googleapis");

exports.updateMobileNumber = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res
        .status(400)
        .send({ errorMessage: "Mobile number is required." });
    }

    const user = await userSchema.findByIdAndUpdate(
      req.user,
      { $set: { mobile } },
      { new: true }
    );

    if (!user) {
      return res
        .status(400)
        .send({ errorMessage: "User not found or update failed." });
    }

    res.send({ mobile });
  } catch (err) {
    res.status(500).send({ errorMessage: "Failed to update mobile." });
  }
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const user = await userSchema.findById(req.userId); // From auth middleware
    oauth2Client.setCredentials({ access_token: user.token });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

    const calendarRes = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: fiveMinutesLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json({ events: calendarRes.data.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
