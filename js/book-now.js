/**
 * Dream Wedding - Book Now Page
 * Form for making new bookings - opens from Book buttons
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof isUserLoggedIn === 'function' && !isUserLoggedIn()) {
    document.getElementById('loginRequiredMsg').style.display = 'block';
    document.getElementById('bookingFormWrapper').style.display = 'none';
    var redirectUrl = 'book-now.html' + (window.location.search || '');
    var loginLink = document.getElementById('loginRedirectLink');
    var regLink = document.getElementById('regRedirectLink');
    if (loginLink) loginLink.href = 'login.html?redirect=' + encodeURIComponent(redirectUrl);
    if (regLink) regLink.href = 'registration.html?redirect=' + encodeURIComponent(redirectUrl);
    return;
  }
  initBookNowForm();
  prefillFromUrl();
});

var STORAGE_KEY = 'dreamWedding_bookings';

function prefillFromUrl() {
  var params = getUrlParams();
  var service = params.service || params.package;
  var eventTypeFromUrl = params.eventType || '';
  var serviceInput = document.getElementById('bookingService');
  var packageSelect = document.getElementById('bookingPackage');
  var eventTypeSelect = document.getElementById('bookingEventType');
  var notesEl = document.getElementById('bookingNotes');
  
  if (service && packageSelect) {
    var pOptions = packageSelect.querySelectorAll('option');
    for (var k = 0; k < pOptions.length; k++) {
      if (pOptions[k].value && pOptions[k].value.toLowerCase().indexOf(service.toLowerCase()) >= 0) {
        packageSelect.value = pOptions[k].value;
        service = null; // Prevent it from trying to match service text
        break;
      }
    }
  }

  if (service && serviceInput) {
    serviceInput.value = service;
  }

  if (eventTypeFromUrl && eventTypeSelect) {
    var opts = eventTypeSelect.querySelectorAll('option');
    for (var k = 0; k < opts.length; k++) {
      if (opts[k].value && opts[k].value.toLowerCase() === eventTypeFromUrl.toLowerCase()) {
        eventTypeSelect.value = opts[k].value;
        break;
      }
    }
  }
}

function getUrlParams() {
  var params = {};
  var search = window.location.search.substring(1);
  if (!search) return params;
  var pairs = search.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
  }
  return params;
}

function initBookNowForm() {
  var form = document.getElementById('bookingForm');
  if (!form) return;

  var user = typeof getLoggedInUser === 'function' ? getLoggedInUser() : null;
  if (user) {
    var nameField = document.getElementById('bookingName');
    var emailField = document.getElementById('bookingEmail');
    var phoneField = document.getElementById('bookingPhone');
    
    if (nameField && user.name) {
      nameField.value = user.name;
      nameField.readOnly = true;
      applyLockedStyle(nameField, 'Name');
    }
    if (emailField && user.email) {
      emailField.value = user.email;
      emailField.readOnly = true;
      applyLockedStyle(emailField, 'Email');
    }
    if (phoneField && user.phone) {
      phoneField.value = user.phone;
      phoneField.readOnly = true;
      applyLockedStyle(phoneField, 'Phone');
    }
  }

  function applyLockedStyle(el, label) {
    el.style.backgroundColor = '#f4f4f4';
    el.style.color = '#777';
    el.style.cursor = 'not-allowed';
    el.title = label + ' is linked to your account and cannot be changed here';
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('bookingName').value.trim();
    var email = document.getElementById('bookingEmail').value.trim();
    var phone = document.getElementById('bookingPhone').value.trim();
    var service = document.getElementById('bookingService').value;
    var packageVal = document.getElementById('bookingPackage') ? document.getElementById('bookingPackage').value : '';
    var eventType = document.getElementById('bookingEventType');
    var date = document.getElementById('bookingDate').value;
    var guests = document.getElementById('bookingGuests').value;
    var notes = document.getElementById('bookingNotes').value.trim();
    var messageEl = document.getElementById('bookingMessage');

    var eventTypeVal = eventType ? eventType.value : '';
    var venueVal = document.getElementById('bookingVenue') ? document.getElementById('bookingVenue').value : '';
    var budgetVal = document.getElementById('bookingBudget') ? document.getElementById('bookingBudget').value : '';
    var addressVal = document.getElementById('bookingAddress') ? document.getElementById('bookingAddress').value.trim() : '';

    var finalService = service;
    if (packageVal && !service) finalService = packageVal;
    else if (packageVal && service) finalService = service + ' + ' + packageVal;

    if (!name || !email || !phone || !finalService || !date || !guests) {
      if (typeof window.showToast === 'function') window.showToast('Please fill in all required fields.', 'error');
      else showMessage(messageEl, 'Please fill in all required fields.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      if (typeof window.showToast === 'function') window.showToast('Please enter a valid email address.', 'error');
      else showMessage(messageEl, 'Please enter a valid email address.', 'error');
      return;
    }

    var currentUser = typeof getLoggedInUser === 'function' ? getLoggedInUser() : null;
    if (currentUser) {
      if (currentUser.email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
        if (typeof window.showToast === 'function') window.showToast('Email must match your registered account.', 'error');
        else showMessage(messageEl, 'Email must match your registered account.', 'error');
        return;
      }
      if (currentUser.name && name !== currentUser.name) {
        if (typeof window.showToast === 'function') window.showToast('Name must match your registered account.', 'error');
        else showMessage(messageEl, 'Name must match your registered account.', 'error');
        return;
      }
      if (currentUser.phone && phone !== currentUser.phone) {
        if (typeof window.showToast === 'function') window.showToast('Phone must match your registered account.', 'error');
        else showMessage(messageEl, 'Phone must match your registered account.', 'error');
        return;
      }
    }

    var booking = {
      id: Date.now(),
      name: name,
      email: email,
      phone: phone,
      service: finalService,
      eventType: eventTypeVal || 'N/A',
      venue: venueVal || 'N/A',
      budget: budgetVal || 'N/A',
      address: addressVal || 'N/A',
      date: date,
      guests: guests || 'N/A',
      notes: notes || 'None',
      createdAt: new Date().toISOString()
    };

    saveBooking(booking);
    if (typeof window.showToast === 'function') {
      window.showToast('Booking successful! Redirecting to your bookings...', 'success');
      if (messageEl) messageEl.textContent = '';
    } else {
      showMessage(messageEl, 'Booking successful! Redirecting to your bookings...', 'success');
    }
    setTimeout(function() {
      window.location.href = 'bookings.html';
    }, 1500);
  });
}

function saveBooking(booking) {
  var bookings = getBookings();
  bookings.unshift(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function getBookings() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function isValidEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showMessage(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = 'form-message ' + (type === 'success' ? 'success-message' : 'error-message');
}
