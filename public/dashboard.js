// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/check");
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = "/auth.html";
      return false;
    }

    document.getElementById("username-display").textContent =
      "Hello, " + data.username;
    return true;
  } catch (error) {
    console.error("Auth check failed");
    window.location.href = "/auth.html";
    return false;
  }
}

async function handleLogout() {
  try {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/auth.html";
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

let currentMode = "safe";
let browserLocation = null;

// Get browser location
function getBrowserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        browserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log("location :", browserLocation);
        loadData(); // Refresh display
      },
      (error) => {
        console.error("Error getting location:", error.message);
        alert(
          "Location access denied. Please enable location permissions for this site."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    alert("Geolocation is not supported.");
  }
}

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");
    const settings = await response.json();
    currentMode = settings.mode;
    updateModeUI(currentMode);
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

function updateModeUI(mode) {
  const safeModeBtn = document.getElementById("safe-mode-btn");
  const lockModeBtn = document.getElementById("lock-mode-btn");
  const currentModeSpan = document.getElementById("current-mode");
  const descriptionElem = document.getElementById("mode-description");

  safeModeBtn.classList.remove("active");
  lockModeBtn.classList.remove("active", "lock");

  if (mode === "safe") {
    safeModeBtn.classList.add("active");
    currentModeSpan.textContent = "Safe Mode";
    currentModeSpan.style.color = "#4CAF50";
    descriptionElem.textContent = "Buzzer is disabled. System monitoring only.";
  } else {
    lockModeBtn.classList.add("active", "lock");
    currentModeSpan.textContent = "Lock Mode";
    currentModeSpan.style.color = "#ff5722";
    descriptionElem.textContent =
      "Alarm active. Buzzer will trigger on movement detection.";
  }
}

async function setMode(mode) {
  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });

    if (response.ok) {
      currentMode = mode;
      updateModeUI(mode);
    } else {
      console.error("Failed to update mode");
    }
  } catch (error) {
    console.error("Error setting mode:", error);
  }
}

async function loadData() {
  try {
    const res = await fetch("/api/latest");

    if (res.status === 401) {
      window.location.href = "/auth.html";
      return;
    }

    const data = await res.json();

    if (!data) return;

    const alarmStatus = document.getElementById("alarm-status");
    alarmStatus.innerText = data.alarm ? "ALARM ACTIVATED" : "Normal";
    alarmStatus.style.color = data.alarm ? "#ff0000" : "#4CAF50";
    alarmStatus.style.fontWeight = "bold";

    // Update GPS coordinates with fallback to browser location
    if (data.gps_latitude && data.gps_longitude) {
      const mapsLink =
        "https://www.google.com/maps?q=" +
        data.gps_latitude +
        "," +
        data.gps_longitude;
      document.getElementById("gps-coordinates").innerHTML =
        '<a href="' +
        mapsLink +
        '" target="_blank" style="color: #2196F3; text-decoration: none;">' +
        data.gps_latitude.toFixed(6) +
        ", " +
        data.gps_longitude.toFixed(6) +
        " [Map]</a>";
    } else if (browserLocation) {
      const mapsLink =
        "https://www.google.com/maps?q=" +
        browserLocation.latitude +
        "," +
        browserLocation.longitude;
      document.getElementById("gps-coordinates").innerHTML =
        '<a href="' +
        mapsLink +
        '" target="_blank" style="color: #2196F3; text-decoration: none;">' +
        browserLocation.latitude.toFixed(6) +
        ", " +
        browserLocation.longitude.toFixed(6) +
        " [Map]</a>";
    } else {
      document.getElementById("gps-coordinates").innerHTML =
        'Waiting for GPS fix... <button onclick="getBrowserLocation()" class="btn-location">Get Location</button>';
    }

    if (data.timestamp) {
      const lastUpdate = new Date(data.timestamp);
      document.getElementById("last-update").innerText =
        lastUpdate.toLocaleString();
    } else {
      document.getElementById("last-update").innerText = "N/A";
    }

    const magnitudeElem = document.getElementById("magnitude");
    if (data.magnitude !== null && data.magnitude !== undefined) {
      magnitudeElem.innerText = data.magnitude.toFixed(3);
      magnitudeElem.style.color = data.alarm ? "#ff0000" : "#333";
      magnitudeElem.style.fontWeight = data.alarm ? "bold" : "500";
    } else {
      magnitudeElem.innerText = "0.000";
    }

    document.getElementById("accel-x").innerText =
      data.accel_x !== null && data.accel_x !== undefined
        ? data.accel_x.toFixed(3)
        : "0.000";
    document.getElementById("accel-y").innerText =
      data.accel_y !== null && data.accel_y !== undefined
        ? data.accel_y.toFixed(3)
        : "0.000";
    document.getElementById("accel-z").innerText =
      data.accel_z !== null && data.accel_z !== undefined
        ? data.accel_z.toFixed(3)
        : "0.000";
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

checkAuth().then((authenticated) => {
  if (authenticated) {
    getBrowserLocation();
    loadSettings();
    loadData();
    setInterval(loadData, 2000);
  }
});
