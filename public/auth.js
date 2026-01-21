function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  clearMessage();
}

function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
  clearMessage();
}

function showMessage(message, type, formType) {
  const messageDiv = document.getElementById(formType + "-message");
  messageDiv.textContent = message;
  messageDiv.className = "message " + type;
  messageDiv.style.display = "block";
}

function clearMessage() {
  const loginMsg = document.getElementById("login-message");
  const registerMsg = document.getElementById("register-message");
  if (loginMsg) {
    loginMsg.style.display = "none";
    loginMsg.className = "message";
  }
  if (registerMsg) {
    registerMsg.style.display = "none";
    registerMsg.className = "message";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    
    if (response.ok) {
      // Redirect to dashboard on the correct server
      window.location.href = "http://localhost:3000/dashboard.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (error) {
    console.error("Login failed:", error);
    alert("Error: " + error.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    alert(data.message);
    
    if (response.ok) {
      // Redirect to login
      window.location.href = "http://localhost:3000/auth.html";
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Check if already logged in
async function checkAuth() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/check", {
      credentials: "include"
    });
    const data = await response.json();

    if (data.authenticated) {
      window.location.href = "http://localhost:3000/dashboard.html";
    }
  } catch (error) {
    console.error("Auth check failed:", error);
  }
}

checkAuth();
