/**
 * Dream Wedding - Bookings Page
 * Displays list of user's bookings only (no form)
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof isUserLoggedIn === 'function' && !isUserLoggedIn()) {
    document.getElementById('loginRequiredMsg').style.display = 'block';
    document.getElementById('bookingsLayout').style.display = 'none';
    var redirectUrl = 'bookings.html';
    var loginLink = document.querySelector('#loginRequiredMsg a[href^="login.html"]');
    var regLink = document.querySelector('#loginRequiredMsg a[href^="registration.html"]');
    if (loginLink) loginLink.href = 'login.html?redirect=' + encodeURIComponent(redirectUrl);
    if (regLink) regLink.href = 'registration.html?redirect=' + encodeURIComponent(redirectUrl);
    return;
  }
  loadBookings();
});

var STORAGE_KEY = 'dreamWedding_bookings';

function getBookings() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function loadBookings() {
  var container = document.getElementById('bookingsList');
  var headerTitle = document.querySelector('.bookings-header h2');
  if (!container) return;

  var currentUser = typeof getLoggedInUser === 'function' ? getLoggedInUser() : null;
  if (currentUser && headerTitle) {
    headerTitle.textContent = currentUser.name + "'s Bookings";
  }

  var currentUser = typeof getLoggedInUser === 'function' ? getLoggedInUser() : null;
  var allBookings = getBookings();
  
  // Filter bookings to ONLY show those belonging to the current user's email
  var bookings = allBookings.filter(function(b) {
    return currentUser && b.email && b.email.toLowerCase() === currentUser.email.toLowerCase();
  });

  container.innerHTML = '';

  if (bookings.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 40px 20px;"><p class="empty-message">No bookings found for your account.</p><p><small>Logged in as: ' + (currentUser ? currentUser.email : 'Unknown') + '</small></p></div>';
    return;
  }

  bookings.forEach(function(booking) {
    var card = document.createElement('div');
    card.className = 'booking-card';
    var guestsVal = booking.guests;
    var guestsText = (guestsVal !== undefined && guestsVal !== null && String(guestsVal) !== 'N/A' && String(guestsVal) !== '') ? '<p>Guests: ' + escapeHtml(String(guestsVal)) + '</p>' : '';
    var eventText = (booking.eventType && booking.eventType !== 'N/A') ? '<p>Event: ' + escapeHtml(booking.eventType) + '</p>' : '';
    var venueText = (booking.venue && booking.venue !== 'N/A') ? '<p>Venue: ' + escapeHtml(booking.venue) + '</p>' : '';
    var budgetText = (booking.budget && booking.budget !== 'N/A') ? '<p>Budget: ' + escapeHtml(booking.budget) + '</p>' : '';

    var details = guestsText + eventText + venueText + budgetText;
    
    card.innerHTML = '<h4>' + escapeHtml(booking.service) + '</h4><p><strong>' + escapeHtml(booking.name) + '</strong></p><p>' + escapeHtml(booking.email) + ' / ' + escapeHtml(booking.phone || '') + '</p><p class="booking-date">' + formatDate(booking.date) + '</p>' + details + '<button class="delete-booking" data-id="' + booking.id + '">Remove</button>';
    container.appendChild(card);
  });

  container.querySelectorAll('.delete-booking').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof window.showConfirmCustom === 'function') {
        window.showConfirmCustom('Remove Booking', 'Are you sure you want to remove this booking?', function() {
          var id = parseInt(btn.getAttribute('data-id'), 10);
          deleteBooking(id);
          loadBookings();
          if (typeof window.showToast === 'function') window.showToast('Booking removed successfully', 'success');
        });
      } else if (confirm('Are you sure you want to remove this booking?')) {
        var id = parseInt(btn.getAttribute('data-id'), 10);
        deleteBooking(id);
        loadBookings();
      }
    });
  });
}

function deleteBooking(id) {
  var bookings = getBookings().filter(function(b) { return b.id !== id; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
