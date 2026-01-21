# 🚴 Anti-Theft Bike Detection System

A smart IoT solution to protect your bike from theft using real-time motion detection, GPS tracking, and instant alerts.

---

## ✨ Key Features

✅ **Real-time Motion Detection** - MPU6050 accelerometer detects unauthorized movement  
✅ **GPS Tracking** - Records exact location of your bike  
✅ **Smart Mode System** - Safe Mode (monitoring) / Lock Mode (alarm active)  
✅ **Instant Alerts** - Email notification when theft detected  
✅ **Live Dashboard** - Monitor bike status in real-time from browser  
✅ **Adjustable Sensitivity** - Customize motion threshold anytime  
✅ **Cloud Storage** - All data saved securely in MongoDB  

---

## 🏗️ System Overview

```
┌─────────────────┐
│  ESP32 + Sensors│
│  • Accelerometer│
│  • GPS Module   │
│  • Buzzer Alarm │
└────────┬────────┘
         │ Wi-Fi
         ▼
┌─────────────────┐       ┌─────────────────┐
│  Node.js Server │─────→ │  MongoDB Atlas  │
│  Port 3000      │       │   Database      │
└─────────────────┘       └─────────────────┘
         │
         ▼
    🌐 Web Dashboard
```

---

## 📸 Demo & Screenshots

### 1. Login Page
User authentication to access dashboard
![Login Page](screenshots/login.png)

### 2. Register Page
Create new account for bike monitoring
![Register Page](screenshots/register.png)

### 3. Dashboard - Safe Mode
Real-time sensor monitoring with buzzer disabled
![Dashboard Safe](screenshots/dashboard1.png)

### 4. Dashboard - Lock Mode
Active alarm mode - buzzer triggers on motion
![Dashboard Lock](screenshots/dash2.png)

### 5. Settings Page
Adjust detection sensitivity and toggle modes
![Settings](screenshots/settings.png)

### 6. GPS Location
Real-time bike location tracking
![GPS Location](screenshots/gps-location.png)

### 7. Alarm Alert
System triggers alert when theft detected
![Alarm Alert](screenshots/alarm-alert.png)

### 8. ESP32 Console
Live sensor data from microcontroller
![ESP32 Console](screenshots/esp32-console.png)

### 9. Server Console
Backend processing sensor data
![Server Console](screenshots/server-console.png)

---

## 🔧 Hardware Setup

| Component | Pin | Function |
|-----------|-----|----------|
| **MPU6050** | GPIO 21, 22 (I2C) | Motion detection |
| **GPS NEO-6M** | GPIO 25, 26 (UART) | Location tracking |
| **Buzzer** | GPIO 5 | Alarm sound |

---

## 🚀 Quick Start

### 1️⃣ Start Backend Server
```bash
cd C:\IOT\ok
npm install
node server.js
```
✅ Server runs on `http://localhost:3000`

### 2️⃣ Upload ESP32 Code
- Connect ESP32 via USB
- Open `main.py` in Thonny IDE
- Click Run/Upload
- Listen for 2 beeps (buzzer test)

### 3️⃣ Access Dashboard
```
http://localhost:3000/auth.html
```
- Register account
- Login to dashboard
- Toggle Safe/Lock mode

---

## 📡 How It Works

1. **ESP32** reads accelerometer & GPS every 1 second
2. **Sends data** to server via Wi-Fi POST request
3. **Server** saves to MongoDB and checks for alarm
4. **Alert triggered** if motion > threshold in Lock Mode
5. **Buzzer beeps** on ESP32 and email sent to user
6. **Dashboard** displays real-time status & location

---

## ⚙️ Configuration

**Update Server IP in ESP32 code:**
```python
SERVER_IP = "192.168.1.76"  # Your laptop IP
SERVER_PORT = 3000
```

**Update MongoDB Connection:**
```javascript
const dbURI = "mongodb+srv://username:password@cluster.mongodb.net/database";
```

---

## 📊 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/esp32/data` | ESP32 sends sensor data |
| GET | `/api/settings` | Get current mode & threshold |
| POST | `/api/settings` | Update mode & threshold |
| POST | `/api/login` | User authentication |
| GET | `/api/data` | Get sensor history |

---

## 🎯 Features Explained

### 🟢 Safe Mode
- System monitors bike continuously
- Buzzer is **OFF**
- Data stored but no alarm triggers
- Perfect for parking in secure locations

### 🔴 Lock Mode
- Alarm **ACTIVE**
- Any motion triggers buzzer
- Email alert sent immediately
- Real-time dashboard notification
- Ideal for outdoor/risky parking

### ⚙️ Threshold Setting
- Default: `1.3g` (gravity)
- Lower = More sensitive
- Higher = Less sensitive
- Adjust based on environment

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| ESP32 shows `ECONNRESET` | ✅ Normal! Data still saves |
| Buzzer not beeping | Check GPIO 5 wiring, ensure Lock Mode |
| Can't access dashboard | Use `localhost:3000` not `127.0.0.1:5500` |
| GPS not working | Wait 30-60 seconds for lock, check antenna |
| MongoDB connection failed | Add your IP to Atlas whitelist |

---

## 📁 Project Structure

```
C:\IOT\ok\
├── server.js              # Node.js backend
├── main.py               # ESP32 MicroPython code
├── public/               # Frontend files
│   ├── auth.html
│   ├── dashboard.html
│   └── styles.css
├── package.json
├── README.md
└── screenshots/          # Demo images
```

---

## 🔐 Security

- ✅ Password hashing (bcryptjs)
- ✅ Session authentication
- ✅ CORS protection
- ✅ MongoDB user validation
- ✅ Input sanitization

---

## 🚀 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Hardware**: ESP32, MPU6050, GPS NEO-6M
- **Communication**: Wi-Fi, I2C, UART

---

## 📞 Status

✅ **Fully Functional**  
📅 **Last Updated**: January 2026  
📌 **Version**: 1.0.0

---

## 📝 License

Open Source Project - MIT License

---

**Made with ❤️ for Bike Security**