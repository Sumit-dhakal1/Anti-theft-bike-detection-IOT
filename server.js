/*************************************************
 * ANTI-THEFT BIKE DETECTION SERVER (FINAL)
 *************************************************/

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const port = 3000;

/* =========================================
   MIDDLEWARE
========================================= */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  credentials: true
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

/* 🔴 ESP32 SAFE CONNECTION */
app.use((req, res, next) => {
  res.setHeader("Connection", "close");
  next();
});

/* =========================================
   SESSION (DASHBOARD ONLY)
========================================= */
app.use(session({
  name: "anti-theft-session",
  secret: "anti-theft-bike-secret-key-2026",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000, httpOnly: true }
}));

/* =========================================
   DATABASE
========================================= */
mongoose.connect("mongodb://localhost:27017/anti_theft_bike_db", {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000
}).then(() => console.log("✓ MongoDB connected"))
  .catch(err => console.error("Mongo error:", err.message));

/* =========================================
   SCHEMAS
========================================= */
const SensorData = mongoose.model("SensorData", new mongoose.Schema({
  gps_latitude: Number,
  gps_longitude: Number,
  accel_x: Number,
  accel_y: Number,
  accel_z: Number,
  magnitude: Number,
  alarm: Boolean,
  mode: String,
  timestamp: { type: Date, default: Date.now }
}));

const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
}));

const Settings = mongoose.model("Settings", new mongoose.Schema({
  mode: { type: String, default: "safe" },
  threshold: { type: Number, default: 1.3 },
  updatedAt: { type: Date, default: Date.now }
}));

/* =========================================
   EMAIL
========================================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sumudhakal94@gmail.com",
    pass: "xmfccuxwijdzdksq"
  }
});

async function sendAlarmEmail(data) {
  const link = data.gps_latitude
    ? `https://www.google.com/maps?q=${data.gps_latitude},${data.gps_longitude}`
    : "GPS not available";

  await transporter.sendMail({
    from: "sumudhakal94@gmail.com",
    to: "avitheshake@gmail.com",
    subject: "🚨 BIKE THEFT ALERT",
    html: `
      <h2>🚨 Theft Detected</h2>
      <p>Magnitude: <b>${data.magnitude}g</b></p>
      <p>Mode: <b>${data.mode}</b></p>
      <p><a href="${link}">View Location</a></p>
    `
  });
}

/* =========================================
   AUTH MIDDLEWARE
========================================= */
const requireAuth = (req, res, next) => {
  if (req.session.userId) next();
  else res.status(401).json({ message: "Unauthorized" });
};

/* =========================================
   AUTH ROUTES
========================================= */
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (await User.findOne({ $or: [{ username }, { email }] }))
    return res.status(400).json({ message: "User exists" });

  await new User({
    username,
    email,
    password: await bcrypt.hash(password, 10)
  }).save();

  res.json({ message: "Registered successfully" });
});

app.post("/api/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  req.session.userId = user._id;
  res.json({ message: "Login successful" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// Add this endpoint
app.get("/api/auth/check", (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

/* =========================================
   SETTINGS
========================================= */
app.get("/api/settings", async (req, res) => {
  const settings = await Settings.findOne() || await new Settings().save();
  res.json(settings);
});

app.post("/api/settings", requireAuth, async (req, res) => {
  const settings = await Settings.findOne() || new Settings();
  if (req.body.mode) settings.mode = req.body.mode;
  if (req.body.threshold) settings.threshold = req.body.threshold;
  settings.updatedAt = new Date();
  await settings.save();
  res.json(settings);
});

/* =========================================
   🔥 ESP32 SAFE ENDPOINT (NO SESSION)
========================================= */
app.post("/esp32/data", (req, res) => {
  /* 🚀 RESPOND FIRST - Include current mode */
  setImmediate(async () => {
    try {
      const settings = await Settings.findOne() || new Settings();
      res.status(200).json({ 
        status: "ok",
        mode: settings.mode,  // ✅ Send current mode to ESP32
        threshold: settings.threshold
      });
      
      const {
        gps_latitude = 0,
        gps_longitude = 0,
        accel_x = 0,
        accel_y = 0,
        accel_z = 0
      } = req.body || {};

      const magnitude = Math.sqrt(accel_x**2 + accel_y**2 + accel_z**2);
      const alarm = settings.mode === "lock" && magnitude > settings.threshold;

      const data = await SensorData.create({
        gps_latitude,
        gps_longitude,
        accel_x,
        accel_y,
        accel_z,
        magnitude: +magnitude.toFixed(3),
        alarm,
        mode: settings.mode
      });

      if (alarm) sendAlarmEmail(data);
      console.log(`✓ ESP32 | ${settings.mode} | Mag:${magnitude.toFixed(2)} | Alarm:${alarm}`);
    } catch (err) {
      console.error("✗ ESP32 ERROR:", err.message);
    }
  });
});

/* =========================================
   DASHBOARD DATA
========================================= */
app.get("/api/data", requireAuth, async (req, res) => {
  res.json(await SensorData.find().sort({ timestamp: -1 }).limit(100));
});

app.get("/api/latest", requireAuth, async (req, res) => {
  res.json(await SensorData.findOne().sort({ timestamp: -1 }) || {});
});

/* =========================================
   START
========================================= */
app.listen(port, () => {
  console.log(`✓ Server running on http://localhost:${port}`);
});
