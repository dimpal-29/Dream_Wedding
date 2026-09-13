/**
 * Dream Wedding - Login & Registration Validation
 * Basic front-end form validation
 */

document.addEventListener('DOMContentLoaded', function() {
  initLoginForm();
  initRegistrationForm();
});

/**
 * Initialize login form validation
 */
function initLoginForm() {
  var form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var messageEl = document.getElementById('loginMessage');

    if (!email || !password) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please enter both email and password.', 'error');
      } else {
        messageEl.textContent = 'Please enter both email and password.';
        messageEl.className = 'form-message error-message';
      }
      return;
    }

    if (!isValidEmail(email)) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please enter a valid email address.', 'error');
      } else {
        messageEl.textContent = 'Please enter a valid email address.';
        messageEl.className = 'form-message error-message';
      }
      return;
    }

    var user = null;
    if (typeof authenticateUser === 'function') {
      user = authenticateUser(email, password);
    }
    
    if (!user) {
      if (typeof window.showToast === 'function') {
        window.showToast('Invalid email or password.', 'error');
      } else {
        messageEl.textContent = 'Invalid email or password.';
        messageEl.className = 'form-message error-message';
      }
      return;
    }

    if (typeof setUserLoggedIn === 'function') {
      setUserLoggedIn(user);
    }

    if (typeof window.showToast === 'function') {
      window.showToast('Login successful! Welcome back, ' + user.name, 'success');
      messageEl.textContent = '';
    } else {
      messageEl.innerHTML = '<span style="color:#27ae60">Login successful! Redirecting...</span>';
    }
    
    var redirectUrl = typeof getRedirectUrl === 'function' ? getRedirectUrl() : null;
    if (redirectUrl) try { redirectUrl = decodeURIComponent(redirectUrl); } catch (e) {}
    setTimeout(function() {
      window.location.href = redirectUrl || 'index.html';
    }, 1500);
  });
}

/**
 * Initialize registration form validation
 */
function initRegistrationForm() {
  var form = document.getElementById('registrationForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var firstName = document.getElementById('regFirstName').value.trim();
    var lastName = document.getElementById('regLastName').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var phone = document.getElementById('regPhone').value.trim();
    var password = document.getElementById('regPassword').value;
    var confirmPassword = document.getElementById('regConfirmPassword').value;
    var terms = document.getElementById('regTerms').checked;
    var messageEl = document.getElementById('regMessage');

    var name = firstName + ' ' + lastName;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword || !terms) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please fill in all required fields and agree to terms.', 'error');
      } else {
        messageEl.textContent = 'Please fill in all required fields and agree to terms.';
        messageEl.className = 'form-message error-message';
      }
      return;
    }

    if (!isValidEmail(email)) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please enter a valid email address.', 'error');
      } else {
        messageEl.textContent = 'Please enter a valid email address.';
        messageEl.className = 'form-message error-message';
      }
      return;
    }

    if (password.length < 6) {
      if (typeof window.showToast === 'function') {
        window.showToast('Password must be at least 6 characters.', 'error');
      }
      return;
    }

    if (password !== confirmPassword) {
      if (typeof window.showToast === 'function') {
        window.showToast('Passwords do not match.', 'error');
      } else {
        messageEl.textContent = 'Passwords do not match.';
        messageEl.className = 'form-message error-message';
      }
      return;
    }

    var newUser = {
      name: name,
      email: email,
      phone: phone,
      password: password
    };

    if (typeof registerNewUser === 'function') {
      var success = registerNewUser(newUser);
      if (!success) {
        if (typeof window.showToast === 'function') {
          window.showToast('Email is already registered. Please login.', 'error');
        } else {
          messageEl.textContent = 'Email is already registered. Please login.';
          messageEl.className = 'form-message error-message';
        }
        return;
      }
    } else {
      console.warn('registerNewUser function not found. User not saved:', newUser);
    }

    if (typeof window.showToast === 'function') {
      window.showToast('Registration successful! Redirecting to login...', 'success');
      messageEl.textContent = '';
    } else {
      messageEl.innerHTML = '<span style="color:#27ae60">Registration successful! Redirecting to login...</span>';
    }
    
    var redirectUrl = typeof getRedirectUrl === 'function' ? getRedirectUrl() : null;
    var loginUrl = 'login.html';
    if (redirectUrl) {
      try {
        loginUrl += '?redirect=' + encodeURIComponent(decodeURIComponent(redirectUrl));
      } catch (e) {}
    }
    setTimeout(function() {
      window.location.href = loginUrl;
    }, 2000);
  });
}

function isValidEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
