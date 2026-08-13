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
   FORM SUBMISSION
   ========================================== */
function setupFormValidation() {
  // Clear errors when switching forms
  const loginToggle = document.getElementById('loginToggle');
  const registerToggle = document.getElementById('registerToggle');

  if (loginToggle) {
    loginToggle.addEventListener('click', function () {
      clearFormErrors('registerFormElement');
    });
  }

  if (registerToggle) {
    registerToggle.addEventListener('click', function () {
      clearFormErrors('loginFormElement');
    });
  }
}

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Clear Django form error alerts
  const alerts = form.querySelectorAll('.alert');
  alerts.forEach(alert => alert.remove());

  // Clear field-level errors
  const errorMessages = form.querySelectorAll('.text-danger');
  errorMessages.forEach(error => error.remove());
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
