/**
 * Dream Wedding - Main JavaScript
 * Navbar, shared functionality, smooth behavior
 */

document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initActiveNavLink();
  initAuthNav();
});

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      var icon = menuToggle.querySelector('span');
      if (icon) {
        icon.textContent = navLinks.classList.contains('active') ? '\u2715' : '\u2630';
      }
    });

    // Close menu when clicking a link (mobile)
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          navLinks.classList.remove('active');
        }
      });
    });
  }
}

/**
 * Set active state on current page nav link
 */
function initActiveNavLink() {
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPath === '') currentPath = 'index.html';

  document.querySelectorAll('.nav-links a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (href && href !== '#' && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function initAuthNav() {
  if (typeof isUserLoggedIn !== 'function') return;
  var loginLi = document.getElementById('navLoginLi');
  var logoutLi = document.getElementById('navLogoutLi');
  var regLi = document.getElementById('navRegLi');
  var logoutBtn = document.getElementById('navLogoutBtn');
  if (!loginLi || !logoutLi) return;
  if (isUserLoggedIn()) {
    loginLi.style.display = 'none';
    logoutLi.style.display = '';
    if (regLi) regLi.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.onclick = function(e) {
        e.preventDefault();
        if (typeof logoutUser === 'function') logoutUser();
        
        if (typeof showToast === 'function') {
          showToast('Logged out successfully', 'success');
          setTimeout(function() { window.location.href = 'index.html'; }, 1500);
        } else {
          window.location.href = 'index.html';
        }
      };
    }
  } else {
    loginLi.style.display = '';
    logoutLi.style.display = 'none';
    if (regLi) regLi.style.display = '';
  }
}

/**
 * Custom Toast Notification
 */
window.showToast = function(message, type) {
  type = type || 'success';
  var toast = document.createElement('div');
  toast.className = 'custom-toast ' + (type === 'error' ? 'error' : 'success');
  var icon = type === 'error' ? '✖' : '✓';
  var iconStyle = type === 'error' ? 'color:#e74c3c;font-weight:bold;font-size:1.1rem;' : 'color:#2ecc71;font-weight:bold;font-size:1.1rem;';
  toast.innerHTML = '<span style="' + iconStyle + '">' + icon + '</span> <span>' + message + '</span>';
  
  document.body.appendChild(toast);
  
  // Trigger reflow for animation
  setTimeout(function() {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, 3000);
};

/**
 * Custom Confirm Dialog
 */
window.showConfirmCustom = function(title, message, onConfirm) {
  var overlay = document.createElement('div');
  overlay.className = 'custom-confirm-overlay';
  
  var box = document.createElement('div');
  box.className = 'custom-confirm-box';
  
  var h3 = document.createElement('h3');
  h3.textContent = title;
  
  var p = document.createElement('p');
  p.textContent = message;
  
  var btns = document.createElement('div');
  btns.className = 'custom-confirm-btns';
  
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = function() {
    overlay.classList.remove('show');
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
  };
  
  var confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary';
  confirmBtn.textContent = 'Yes, Remove';
  confirmBtn.style.background = '#e74c3c';
  confirmBtn.style.backgroundImage = 'none';
  confirmBtn.style.borderColor = '#e74c3c';
  confirmBtn.onclick = function() {
    overlay.classList.remove('show');
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof onConfirm === 'function') onConfirm();
    }, 300);
  };
  
  btns.appendChild(cancelBtn);
  btns.appendChild(confirmBtn);
  
  box.appendChild(h3);
  box.appendChild(p);
  box.appendChild(btns);
  overlay.appendChild(box);
  
  document.body.appendChild(overlay);
  
  setTimeout(function() {
    overlay.classList.add('show');
  }, 10);
};
