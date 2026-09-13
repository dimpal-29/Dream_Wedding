/**
 * Dream Wedding - Gallery Page JavaScript
 * Review form handling and display
 */

document.addEventListener('DOMContentLoaded', function() {
  initGalleryReview();
  loadReviews();
});

var STORAGE_KEY = 'dreamWedding_galleryReviews';

/**
 * Initialize gallery review form
 */
function initGalleryReview() {
  var form = document.getElementById('galleryReviewForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('reviewName').value.trim();
    var email = document.getElementById('reviewEmail').value.trim();
    var coupleImg = document.getElementById('reviewCoupleImg').value.trim();
    var rating = document.getElementById('reviewRating').value;
    var text = document.getElementById('reviewText').value.trim();
    var messageEl = document.getElementById('reviewMessage');

    if (!name || !email || !text) {
      showMessage(messageEl, 'Please fill in all required fields.', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showMessage(messageEl, 'Please enter a valid email address.', 'error');
      return;
    }

    var review = {
      id: Date.now(),
      name: name,
      email: email,
      coupleImg: coupleImg || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
      rating: parseInt(rating, 10),
      text: text,
      date: new Date().toLocaleDateString()
    };

    saveReview(review);
    form.reset();
    showMessage(messageEl, 'Thank you for your review!', 'success');
    loadReviews();

    setTimeout(function() {
      messageEl.textContent = '';
      messageEl.className = 'form-message';
    }, 3000);
  });
}

/**
 * Save review to localStorage
 */
function saveReview(review) {
  var reviews = getReviews();
  reviews.unshift(review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

/**
 * Get all reviews from localStorage
 */
function getReviews() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Load and display reviews
 */
function loadReviews() {
  var container = document.getElementById('reviewsList');
  if (!container) return;

  var reviews = getReviews();
  container.innerHTML = '';

  if (reviews.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;">No reviews yet. Be the first to share your experience!</p>';
    return;
  }

  var coupleImages = [
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80'
  ];
  reviews.forEach(function(review, index) {
    var div = document.createElement('div');
    div.className = 'review-item';
    var imgUrl = review.coupleImg || coupleImages[index % coupleImages.length];
    var stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    div.innerHTML = '<div class="review-couple-img"><img src="' + escapeHtml(imgUrl) + '" alt="' + escapeHtml(review.name) + '"></div><div class="review-item-body"><div class="review-item-header"><span class="review-author">' + escapeHtml(review.name) + '</span><span class="review-rating">' + stars + '</span></div><p class="review-text">' + escapeHtml(review.text) + '</p><small style="color:#888;">' + review.date + '</small></div>';
    container.appendChild(div);
  });
}

function isValidEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showMessage(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = 'form-message ' + (type === 'success' ? 'success-message' : 'error-message');
}
