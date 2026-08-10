/* ====================================
   LOGIN & REGISTER PAGE - FUNCTIONALITY
   ==================================== */

document.addEventListener('DOMContentLoaded', function () {
  setupAuthToggle();
  setupPasswordVisibility();
  setupFormValidation();
});

/* ==========================================
   AUTH TOGGLE - SWITCH BETWEEN LOGIN/REGISTER
   ========================================== */
function setupAuthToggle() {
  const loginToggle = document.getElementById('loginToggle');
  const registerToggle = document.getElementById('registerToggle');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toggleIndicator = document.querySelector('.auth-toggle-indicator');

  if (!loginToggle || !registerToggle) return;

  // Login Toggle Click
  loginToggle.addEventListener('click', function () {
    activateAuthMode('login', loginToggle, registerToggle, loginForm, registerForm, toggleIndicator);
  });

  // Register Toggle Click
  registerToggle.addEventListener('click', function () {
    activateAuthMode('register', loginToggle, registerToggle, loginForm, registerForm, toggleIndicator);
  });

  // Initialize indicator position
  updateToggleIndicator(loginToggle, toggleIndicator);
}

function activateAuthMode(mode, loginToggle, registerToggle, loginForm, registerForm, indicator) {
  if (mode === 'login') {
    loginToggle.classList.add('active');
    registerToggle.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    updateToggleIndicator(loginToggle, indicator);
  } else {
    loginToggle.classList.remove('active');
    registerToggle.classList.add('active');
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    updateToggleIndicator(registerToggle, indicator);
  }
}

function updateToggleIndicator(activeButton, indicator) {
  const buttonRect = activeButton.getBoundingClientRect();
  const toggleRect = activeButton.closest('.auth-toggle').getBoundingClientRect();
  const offset = buttonRect.left - toggleRect.left;

  indicator.style.left = offset + 'px';
  indicator.style.width = buttonRect.width + 'px';
}

/* ==========================================
   PASSWORD VISIBILITY TOGGLE
   ========================================== */
function setupPasswordVisibility() {
  const loginPasswordToggle = document.getElementById('loginPasswordToggle');
  const loginPasswordInput = document.getElementById('loginPassword');
  const registerPasswordToggle = document.getElementById('registerPasswordToggle');
  const registerPasswordInput = document.getElementById('registerPassword');
  const registerConfirmPasswordToggle = document.getElementById('registerConfirmPasswordToggle');
  const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');

  if (loginPasswordToggle && loginPasswordInput) {
    loginPasswordToggle.addEventListener('click', function (e) {
      e.preventDefault();
      togglePasswordVisibility(loginPasswordInput, loginPasswordToggle);
    });
  }

  if (registerPasswordToggle && registerPasswordInput) {
    registerPasswordToggle.addEventListener('click', function (e) {
      e.preventDefault();
      togglePasswordVisibility(registerPasswordInput, registerPasswordToggle);
    });
  }

  if (registerConfirmPasswordToggle && registerConfirmPasswordInput) {
    registerConfirmPasswordToggle.addEventListener('click', function (e) {
      e.preventDefault();
      togglePasswordVisibility(registerConfirmPasswordInput, registerConfirmPasswordToggle);
    });
  }
}

function togglePasswordVisibility(input, toggle) {
  const isPassword = input.type === 'password';

  if (isPassword) {
    input.type = 'text';
    toggle.querySelector('i').classList.remove('fa-eye');
    toggle.querySelector('i').classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    toggle.querySelector('i').classList.remove('fa-eye-slash');
    toggle.querySelector('i').classList.add('fa-eye');
  }
}

/* ==========================================
   FORM VALIDATION
   ========================================== */
function setupFormValidation() {
  const loginFormElement = document.getElementById('loginFormElement');
  const registerFormElement = document.getElementById('registerFormElement');

  if (loginFormElement) {
    loginFormElement.addEventListener('submit', handleLoginSubmit);
  }

  if (registerFormElement) {
    registerFormElement.addEventListener('submit', handleRegisterSubmit);
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const rememberMe = document.getElementById('rememberMe').checked;

  // Validate inputs
  if (!email || !password) {
    showAlert('error', 'Please fill in all fields.');
    return;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    showAlert('error', 'Please enter a valid email address.');
    return;
  }

  // Validate password length
  if (password.length < 6) {
    showAlert('error', 'Password must be at least 6 characters long.');
    return;
  }

  // Create login data
  const loginData = {
    email: email,
    password: password,
    rememberMe: rememberMe,
    timestamp: new Date().toISOString()
  };

  // Log data (in production, send to server)
  console.log('Login Attempt:', loginData);

  // Show success message
  showAlert('success', 'Login successful! Redirecting...');

  // Simulate redirect after 2 seconds
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
}

function handleRegisterSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const phone = document.getElementById('registerPhone').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
  const agreeTerms = document.getElementById('agreeTerms').checked;

  // Validate inputs
  if (!name || !email || !phone || !password || !confirmPassword) {
    showAlert('error', 'Please fill in all fields.');
    return;
  }

  // Validate email format
  if (!isValidEmail(email)) {
    showAlert('error', 'Please enter a valid email address.');
    return;
  }

  // Validate phone format (basic check)
  if (!isValidPhone(phone)) {
    showAlert('error', 'Please enter a valid phone number.');
    return;
  }

  // Validate password length
  if (password.length < 6) {
    showAlert('error', 'Password must be at least 6 characters long.');
    return;
  }

  // Validate password match
  if (password !== confirmPassword) {
    showAlert('error', 'Passwords do not match. Please try again.');
    return;
  }

  // Validate terms acceptance
  if (!agreeTerms) {
    showAlert('error', 'Please agree to the Terms of Service and Privacy Policy.');
    return;
  }

  // Create registration data
  const registrationData = {
    name: name,
    email: email,
    phone: phone,
    password: password,
    timestamp: new Date().toISOString()
  };

  // Log data (in production, send to server)
  console.log('Registration Data:', registrationData);

  // Show success message
  showAlert('success', 'Account created successfully! Redirecting...');

  // Simulate redirect after 2 seconds
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
}

/* ==========================================
   VALIDATION HELPERS
   ========================================== */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  // Basic validation: at least 10 digits, allow spaces, dashes, parentheses
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/* ==========================================
   ALERT NOTIFICATION SYSTEM
   ========================================== */
function showAlert(type, message) {
  // Create alert container
  const alertContainer = document.createElement('div');
  alertContainer.className = `auth-alert alert-${type}`;

  // Set icon based on type
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

  // Set content
  alertContainer.innerHTML = `
    <div class="auth-alert-content">
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
      <button class="auth-alert-close" type="button">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `;

  // Add to page
  document.body.appendChild(alertContainer);

  // Trigger animation
  setTimeout(() => {
    alertContainer.classList.add('show');
  }, 10);

  // Close button functionality
  const closeBtn = alertContainer.querySelector('.auth-alert-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      alertContainer.classList.remove('show');
      setTimeout(() => {
        alertContainer.remove();
      }, 300);
    });
  }

  // Auto-close after 5 seconds for success, 7 seconds for error
  const duration = type === 'success' ? 5000 : 7000;
  setTimeout(() => {
    if (alertContainer.parentElement) {
      alertContainer.classList.remove('show');
      setTimeout(() => {
        alertContainer.remove();
      }, 300);
    }
  }, duration);
}

/* ==========================================
   WINDOW RESIZE - UPDATE TOGGLE INDICATOR
   ========================================== */
window.addEventListener('resize', function () {
  const loginToggle = document.getElementById('loginToggle');
  const toggleIndicator = document.querySelector('.auth-toggle-indicator');

  if (loginToggle && toggleIndicator) {
    if (loginToggle.classList.contains('active')) {
      updateToggleIndicator(loginToggle, toggleIndicator);
    } else {
      const registerToggle = document.getElementById('registerToggle');
      if (registerToggle) {
        updateToggleIndicator(registerToggle, toggleIndicator);
      }
    }
  }
});
