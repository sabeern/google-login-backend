const { oauth2Client } = require("../utils/googleClient");
const userSchema = require("../models/userModel");
const { google } = require("googleapis");
const schedule = require("node-schedule");
// Initialize Twilio client using environment variables
const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Controller to update the user's mobile number.
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

// Checks all logged-in users and makes a Twilio call if an upcoming Google Calendar event is found.
const performLoginUserEventCheck = async () => {
  try {
    console.log("checking started");
    const loggingUsers = await userSchema.find({
      mobile: { $exists: true, $nin: [null, ""] },
      g_refreshToken: { $exists: true, $nin: [null, ""] },
      g_accessToken: { $exists: true, $nin: [null, ""] },
    });

    for (const user of loggingUsers) {
      const isEvent = await getGoogleCalenderEvents(user);
      if (isEvent) {
        const result = await twilioCall(user);
        if (result.status) {
          await userSchema.findByIdAndUpdate(user._id, {
            $set: { callSid: result.sid },
          });
        }
      }
      // Add a 2-second delay between users
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (err) {
    console.error("Error in performLoginUserEventCheck:", err);
  }
};

// Function to check if the user has a calendar event in the next five minutes.
const getGoogleCalenderEvents = async (user) => {
  try {
    // return true;
    console.log("google event checked");
    oauth2Client.setCredentials({
      access_token: user.g_accessToken,
      refresh_token: user.g_refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const time = new Date();
    const now = new Date(time);
    const TIME_VARIATION = Number(process.env.TIME_VARIATION || "0");
    now.setMinutes(now.getMinutes() + TIME_VARIATION);
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

    const calendarRes = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: fiveMinutesLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });
    const upcomingEvents = calendarRes.data.items.filter((event) => {
      const start = new Date(event.start.dateTime || event.start.date);
      return start > now;
    });
    if (upcomingEvents.length > 0) return true;
    else return false;
  } catch (err) {
    return false;
  }
};

// Trigger a Twilio call to the user's mobile number.
const twilioCall = async (user) => {
  try {
    console.log("call function called");
    // return { status: true, sid: 123 };
    const call = await client.calls.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to: `+91${user.mobile}`,
      url: process.env.TWILIO_URL,
    });
    return { status: true, sid: call?.sid };
  } catch (err) {
    return { status: false };
  }
};

// A scheduler that runs every four minutes to check the calendar events of logged-in users and make a call.
// schedule.scheduleJob("*/1 * * * *", performLoginUserEventCheck);
setTimeout(performLoginUserEventCheck, 5000);
