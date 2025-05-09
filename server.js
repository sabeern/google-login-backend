const express = require("express");
const app = express();

const dbConnection = require("./conf/dbConnection");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();
dbConnection();

app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "oid"],
  })
);

const loginRoute = require("./routes/login");
const profileRoute = require("./routes/profile");

app.use("/user", loginRoute);
app.use("/profile", profileRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("srver listening on port ", PORT);
});
