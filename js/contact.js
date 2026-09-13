/**
 * Dream Wedding - Contact Page JavaScript
 * Form validation
 */

document.addEventListener('DOMContentLoaded', function() {
  initContactForm();
});

/**
 * Initialize contact form with validation
 */
function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('contactName').value.trim();
    var email = document.getElementById('contactEmail').value.trim();
    var phone = document.getElementById('contactPhone').value.trim();
    var subject = document.getElementById('contactSubject').value;
    var message = document.getElementById('contactMessage').value.trim();
    var messageEl = document.getElementById('contactMessageEl');

    var valid = true;
    var errorMsg = '';

    if (!name) {
      valid = false;
      errorMsg = 'Please enter your name.';
    } else if (!email) {
      valid = false;
      errorMsg = 'Please enter your email.';
    } else if (!isValidEmail(email)) {
      valid = false;
      errorMsg = 'Please enter a valid email address.';
    } else if (!subject) {
      valid = false;
      errorMsg = 'Please select a subject.';
    } else if (!message) {
      valid = false;
      errorMsg = 'Please enter your message.';
    } else if (message.length < 20) {
      valid = false;
      errorMsg = 'Message must be at least 20 characters.';
    }

    if (!valid) {
      messageEl.textContent = errorMsg;
      messageEl.className = 'form-message error-message';
      return;
    }

    messageEl.textContent = 'Thank you! Your message has been sent. We will get back to you soon.';
    messageEl.className = 'form-message success-message';
    form.reset();
  });
}

function isValidEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
