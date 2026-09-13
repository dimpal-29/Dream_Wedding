/**
 * Dream Wedding - Service Detail Page
 * Shows sub-services based on URL `category` param, with search + booking modal.
 */

var STORAGE_KEY = 'dreamWedding_bookings';

var SERVICE_DATA = {
  'ring-ceremony': {
    title: 'Ring Ceremony',
    desc: 'Celebrate the promise with a beautiful ring exchange.',
    items: [
      { name: 'Engagement Decoration', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc1Ov9xngHh5QCAvyEFQS4ojEsk4Z1ZMIsHg&s', desc: 'Warm, elegant setups for the engagement moment.', price: 'Starting at ₹45,000', rating: 4.8, defaultEventType: 'Engagement' },
      { name: 'Ring Ceremony Photography', img: 'https://i.pinimg.com/originals/19/e6/02/19e60291fa780b500ba72db76976da76.jpg', desc: 'Candid coverage with beautiful portraits.', price: 'Starting at ₹90,000', rating: 4.9, defaultEventType: 'Engagement' },
      { name: 'Cake Arrangement', img: 'https://petalbox.com/wp-content/uploads/2022/02/Birthday-Cake-Luxury-Arrangement.jpg', desc: 'Custom cakes and display styling.', price: 'Starting at ₹18,000', rating: 4.6, defaultEventType: 'Engagement' },
      { name: 'Music Setup', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80', desc: 'Live sound and playlist management for the ceremony.', price: 'Starting at ₹25,000', rating: 4.7, defaultEventType: 'Engagement' },
      { name: 'Anchor/Host', img: 'https://www.shaadidukaan.com/user_images/innerSlider_images/default/m/39-m.jpg', desc: 'A polished emcee for smooth proceedings.', price: 'Starting at ₹12,000', rating: 4.5, defaultEventType: 'Engagement' }
    ]
  },
  'pre-wedding': {
    title: 'Photography & Videography',
    desc: 'Stunning photos and cinematic videos before, during, and after the big day.',
    items: [
      { name: 'Pre-Wedding Photoshoot', img: 'https://weddingphotographybysf.com/wp-content/uploads/2025/07/Pre-Wedding-Shoot-in-Jaipur-9-scaled.jpg', desc: 'Editorial portraits tailored to your style.', price: 'Starting at ₹70,000', rating: 4.8, defaultEventType: 'Wedding' },
      { name: 'Cinematic Video Shoot', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80', desc: 'Cinematic storytelling with professional editing.', price: 'Starting at ₹1,10,000', rating: 4.9, defaultEventType: 'Wedding' },
      { name: 'Location/Theme Setup', img: 'https://ashaval.com/wp-content/uploads/2020/11/Lafabuloso_location_photography_pre_wedding_img_30.jpg', desc: 'Themes, props, and location styling.', price: 'Starting at ₹35,000', rating: 4.7, defaultEventType: 'Wedding' },
      { name: 'Props Arrangement', img: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&q=80', desc: 'Props and detailing that add personality to every frame.', price: 'Starting at ₹15,000', rating: 4.6, defaultEventType: 'Wedding' },
      { name: 'Post-Wedding Photoshoot', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToFlh2ptCuVvosIGjTY54EfimYH_iBN1hHrQ&s', desc: 'Celebrate your first moments together as a married couple with a beautiful photoshoot.', price: 'Starting at ₹50,000', rating: 4.8, defaultEventType: 'Wedding' }
    ]
  },
  'music-night': {
    title: 'Music Night',
    desc: 'Sangeet-inspired entertainment that keeps energy high.',
    items: [
      { name: 'DJ Setup', img: 'https://i.pinimg.com/736x/27/9e/54/279e541f02c8d01e2953a0c5f50a478d.jpg', desc: 'Powerful sound, perfect playlists, and smooth transitions.', price: 'Starting at ₹60,000', rating: 4.8, defaultEventType: 'Sangeet' },
      { name: 'Dance Choreography', img: 'https://img.weddingbazaar.com/photos/pictures/001/360/398/new_large/34.jpg?1578383722', desc: 'Choreography for couples and families.', price: 'Starting at ₹25,000', rating: 4.7, defaultEventType: 'Sangeet' },
      { name: 'Live Band', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTclM-5lODvBud4guicKfYqHv8blk4IeeVbQw&s', desc: 'Live musical performances for unforgettable moments.', price: 'Starting at ₹1,20,000', rating: 4.9, defaultEventType: 'Sangeet' },
      { name: 'Lighting & Stage', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQorRzgVpttRXHVg34aluj5p59-DHF5X0t6Gw&s', desc: 'Stage styling, lights, and dramatic ambience.', price: 'Starting at ₹40,000', rating: 4.8, defaultEventType: 'Sangeet' }
    ]
  },
  'decoration': {
    title: 'Decoration',
    desc: 'Floral, theme, and entrance décor that transforms your venue.',
    items: [
      { name: 'Floral Decoration', img: 'https://www.shutterstock.com/image-photo/elegant-floral-wedding-stage-lightcolored-260nw-2611937431.jpg', desc: 'Fresh blooms and luxe floral installations.', price: 'Starting at ₹80,000', rating: 4.8, defaultEventType: 'Wedding' },
      { name: 'Balloon Decoration', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyeHkWts9TqVsL5gAE80iQaw5Wi816Yr-nmg&s', desc: 'Creative balloon arches and photo-ready clusters.', price: 'Starting at ₹25,000', rating: 4.6, defaultEventType: 'Wedding' },
      { name: 'Entrance Decoration', img: 'https://image.wedmegood.com/resized/450X/uploads/member/435086/1732273249_WhatsApp_Image_2024_11_22_at_4.27.09_PM.jpeg', desc: 'Grand welcomes with stylish décor detailing.', price: 'Starting at ₹45,000', rating: 4.7, defaultEventType: 'Wedding' },
      { name: 'Theme Decoration', img: 'https://www.jaypeehotels.com/blog/wp-content/uploads/2021/01/Wedding-Themes-1024x684.jpg', desc: 'Personalized themes that match your wedding story.', price: 'Starting at ₹70,000', rating: 4.9, defaultEventType: 'Wedding' }
    ]
  },
  'destination': {
    title: 'Destination Wedding',
    desc: 'Planning with travel expertise for dream locations.',
    items: [
      { name: 'Venue Booking', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80', desc: 'Curated venues in your preferred destination.', price: 'Custom Quote', rating: 4.8, defaultEventType: 'Wedding' },
      { name: 'Travel Management', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLjHMLx5lH9qPXtT-QTfrNMLtpAfPqw8lvAQ&s', desc: 'Flights, transfers, schedules, and coordination.', price: 'Starting at ₹35,000', rating: 4.7, defaultEventType: 'Wedding' },
      { name: 'Guest Accommodation', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80', desc: 'Hotel blocks and hospitality planning for guests.', price: 'Starting at ₹30,000', rating: 4.6, defaultEventType: 'Wedding' },
      { name: 'Full Wedding Planning', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnL-QkP9uX1o5jO1ZdnIKGxMD1nLz63sC0BQ&s', desc: 'End-to-end management for a smooth celebration.', price: 'Custom Quote', rating: 4.9, defaultEventType: 'Wedding' }
    ]
  },
  'makeup-styling': {
    title: 'Makeup & Styling',
    desc: 'Bridal looks and groom styling for every ceremony.',
    items: [
      { name: 'Bridal Makeup', img: 'https://image.wedmegood.com/resized/720X/uploads/project/272733/1735326757_image9592.jpg?crop=0,432,2048,1151', desc: 'Airy, long-lasting makeup with premium products.', price: 'Starting at ₹25,000', rating: 4.7, defaultEventType: 'Mehendi' },
      { name: 'Groom Styling', img: 'https://cdn.prod.website-files.com/62c26a497dace2679a3c0777/689d94c2d82386dff5606668_Couply%20Styling.jpg', desc: 'Groom grooming, styling guidance, and touch-ups.', price: 'Starting at ₹18,000', rating: 4.6, defaultEventType: 'Wedding' },
      { name: 'Mehndi Artist', img: 'https://image.wedmegood.com/resized/720X/uploads/member/1351022/1753179340_image6081.jpg?crop=151,131,1895,1064', desc: 'Brilliant mehndi designs with a professional artist.', price: 'Starting at ₹12,000', rating: 4.8, defaultEventType: 'Mehendi' },
      { name: 'Hair Styling', img: 'https://img.freepik.com/free-photo/hairdresser-woman-weaving-braid-hair-wedding-styling_1328-2878.jpg?semt=ais_hybrid&w=740&q=80', desc: 'Bridal hairstyles that stay perfect through the day.', price: 'Starting at ₹15,000', rating: 4.7, defaultEventType: 'Wedding' }
    ]
  },
  'honeymoon': {
    title: 'Honeymoon',
    desc: 'Romantic experiences planned for your new beginning.',
    items: [
      { name: 'Travel Booking', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80', desc: 'Flights and travel plans curated for couples.', price: 'Starting at ₹40,000', rating: 4.8, defaultEventType: 'Wedding' },
      { name: 'Hotel Booking', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQktK99FYaTyVm1XQ9RvOBnNBvbnKeZ81fveA&s', desc: 'Comfortable stays with romantic ambiance.', price: 'Starting at ₹35,000', rating: 4.7, defaultEventType: 'Wedding' },
      { name: 'Romantic Setup', img: 'https://thumbs.dreamstime.com/b/honeymoon-couple-having-private-romantic-dinner-tropical-beach-115317160.jpg', desc: 'Surprise décor, proposals, and special moments.', price: 'Starting at ₹15,000', rating: 4.6, defaultEventType: 'Reception' },
      { name: 'Honeymoon Packages', img: 'https://4.imimg.com/data4/CC/CC/GLADMIN-/images-tour-package-honeymoon-20tour-20package-20andaman-500x500.jpg', desc: 'All-in packages designed around your preferences.', price: 'Custom Quote', rating: 4.9, defaultEventType: 'Wedding' }
    ]
  },
  'catering': {
    title: 'Catering',
    desc: 'Food experiences that delight every guest.',
    items: [
      { name: 'Buffet Service', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=900&q=80', desc: 'Variety buffet spreads with curated menus.', price: 'Starting at ₹1,000 / plate', rating: 4.7, defaultEventType: 'Reception' },
      { name: 'Live Food Counters', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsKo-wSVcYOM3q7aEeH0HSDL0Dgo2x3nIeow&s', desc: 'Interactive counters for a memorable dining experience.', price: 'Starting at ₹35,000', rating: 4.8, defaultEventType: 'Reception' },
      { name: 'Dessert Counter', img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=900&q=80', desc: 'Sweet counters with premium desserts.', price: 'Starting at ₹25,000', rating: 4.6, defaultEventType: 'Reception' },
      { name: 'Custom Menu', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTteXv6WTx7l2-zfXRVDj_DvWu9GqDyIhg8wQ&s', desc: 'Customized cuisines for your wedding theme.', price: 'Custom Quote', rating: 4.9, defaultEventType: 'Wedding' }
    ]
  },
  'all-weddings': {
    title: 'All Types of Weddings',
    desc: 'Choose your style. We make it spectacular.',
    items: [
      { name: 'Traditional Wedding', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmA7imfAH7mgNK2GcvxBOpSKns_afHiq-Tpw&s', desc: 'Classic rituals with authentic décor and flow.', price: 'Starting at ₹2,50,000', rating: 4.8, defaultEventType: 'Wedding' },
      { name: 'Modern Wedding', img: 'https://media-api.xogrp.com/images/aa0b73ce-4c72-45df-8585-4003c4b3a2a0~rs_768.h-cr_0.0.1093.820', desc: 'Minimalist, chic, and photo-forward aesthetics.', price: 'Starting at ₹3,20,000', rating: 4.9, defaultEventType: 'Wedding' },
      { name: 'Theme Wedding', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrXx4etm71UH2a0TeTCrE_2p2sAv3ETwo33w&s', desc: 'Story-driven décor, music, and styling.', price: 'Starting at ₹4,00,000', rating: 4.7, defaultEventType: 'Reception' },
      { name: 'Royal Wedding', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaQsBnsdOaPCfz9t-SgmZa4e93FSzIXxz8aQ&s', desc: 'Grand setups with premium services and detailing.', price: 'Starting at ₹5,50,000', rating: 4.9, defaultEventType: 'Wedding' }
    ]
  },
  'wedding-ceremony': {
    title: 'Wedding Ceremony',
    desc: 'Traditional rituals and grand celebrations for your special day.',
    items: [
      { name: 'Haldi Ceremony', img: 'https://www.theknot.com/tk-media/images/b0e84a56-db35-4752-acdd-c8d39c2743cc', desc: 'Vibrant yellow-themed décor and ritual management for a joyful Haldi.', price: 'Starting at ₹30,000', rating: 4.8, defaultEventType: 'Haldi' },
      { name: 'Mehendi Ceremony', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDhxrWxSi3DPTqkZxiR68tEbfCX9Kv9bT3yw&s', desc: 'Expert henna artists and colorful setups for your Mehendi afternoon.', price: 'Starting at ₹40,000', rating: 4.7, defaultEventType: 'Mehendi' },
      { name: 'Sangeet Night', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSivBdbBg3iGvPOOLctBu6QIutGgvdxBgKOUA&s', desc: 'Dazzling lights, dance floor, and non-stop music for an unforgettable Sangeet.', price: 'Starting at ₹60,000', rating: 4.9, defaultEventType: 'Sangeet' },
      { name: 'Wedding', img: 'https://symphonyevents.com.au/wp-content/uploads/2023/06/Wedding-1105-scaled.jpg', desc: 'A sacred mandap and meticulous planning for your seven vows.', price: 'Starting at ₹1,00,000', rating: 4.9, defaultEventType: 'Wedding' },
      { name: 'Grand Reception', img: 'https://www.fabricoz.com/cdn/shop/articles/rituals-and-ceremonies-at-an-indian-wedding_grande.jpg?v=1630234699', desc: 'Elegant dining and stage setup for your first evening as a married couple.', price: 'Starting at ₹80,000', rating: 4.8, defaultEventType: 'Reception' }
    ]
  }
};

document.addEventListener('DOMContentLoaded', function() {
  var params = getUrlParams();
  var category = params.category || 'decoration';

  loadCategory(category);
  initBackAndCloseHandlers();
});

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

function loadCategory(category) {
  var data = SERVICE_DATA[category] || SERVICE_DATA['decoration'];

  var titleEl = document.getElementById('categoryTitle');
  var descEl = document.getElementById('categoryDesc');
  var breadcrumbCurrent = document.getElementById('breadcrumbCurrent');

  if (titleEl) titleEl.textContent = data.title;
  if (descEl) descEl.textContent = data.desc;
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = data.title;

  document.title = data.title + ' - Dream Wedding';

  var grid = document.getElementById('serviceItemsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  data.items.forEach(function(item) {
    var card = document.createElement('article');
    card.className = 'sub-service-card';
    card.setAttribute('data-sub-service-name', item.name);
    card.setAttribute('data-default-event-type', item.defaultEventType || '');
    card.setAttribute('data-search-text', (item.name + ' ' + item.desc).toLowerCase());

    var stars = renderStars(item.rating);

    card.innerHTML =
      '<div class="sub-service-img">' +
        '<img src="' + escapeAttr(item.img) + '" alt="' + escapeAttr(item.name) + '">' +
      '</div>' +
      '<div class="sub-service-content">' +
        '<h3 class="sub-service-title">' + escapeHtml(item.name) + '</h3>' +
        '<p class="sub-service-desc">' + escapeHtml(item.desc) + '</p>' +
        '<div class="sub-service-actions" style="margin-top:auto; padding-top:10px;">' +
          '<button class="btn btn-primary" onclick="openBookingModal(\'' + escapeAttr(item.name) + '\', \'' + escapeAttr(item.defaultEventType || '') + '\')">Book Now</button>' +
        '</div>' +
      '</div>';

    grid.appendChild(card);
  });


}



// Redirect to generic book-now page
window.openBookingModal = function(serviceName, defaultEventType) {
  var urlParams = '?service=' + encodeURIComponent(serviceName || '') + '&eventType=' + encodeURIComponent(defaultEventType || '');
  if (typeof isUserLoggedIn === 'function' && !isUserLoggedIn()) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please login to book a service.', 'error');
      setTimeout(function() {
        var redirect = encodeURIComponent('book-now.html' + urlParams);
        window.location.href = 'login.html?redirect=' + redirect;
      }, 1500);
    } else {
      var redirect = encodeURIComponent('book-now.html' + urlParams);
      window.location.href = 'login.html?redirect=' + redirect;
    }
    return;
  }

  // Redirect directly to book-now.html instead of opening modal
  window.location.href = 'book-now.html' + urlParams;
};

function initBackAndCloseHandlers() {
  // No-op placeholder: back link already navigates via normal anchor
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
  var re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return re.test(email);
}

function renderStars(rating) {
  // Convert rating (e.g. 4.8) to filled star count (rounded)
  var r = Number(rating) || 0;
  var full = Math.max(0, Math.min(5, Math.round(r)));
  var stars = '';
  for (var i = 0; i < 5; i++) {
    stars += i < full ? '★' : '☆';
  }
  return stars;
}

function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(null, args);
    }, delay);
  };
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
