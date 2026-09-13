/**
 * Dream Wedding - Home Page JavaScript
 * Hero slider functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  initSlider();
});

/**
 * Initialize the hero image slider with quotes
 */
function initSlider() {
  var slides = document.querySelectorAll('.hero-slider .slide');
  var dots = document.querySelectorAll('.slider-dot');
  var prevBtn = document.querySelector('.slider-arrow.prev');
  var nextBtn = document.querySelector('.slider-arrow.next');

  if (slides.length === 0) return;

  var currentIndex = 0;
  var interval;

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    
    slides.forEach(function(slide, i) {
      slide.classList.remove('active');
      if (i === currentIndex) slide.classList.add('active');
    });

    dots.forEach(function(dot, i) {
      dot.classList.remove('active');
      if (i === currentIndex) dot.classList.add('active');
    });
  }

  function nextSlide() {
    showSlide(currentIndex + 1);
  }

  function prevSlide() {
    showSlide(currentIndex - 1);
  }

  function startAutoPlay() {
    interval = setInterval(nextSlide, 5000);
  }

  function stopAutoPlay() {
    clearInterval(interval);
  }

  // Event listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      stopAutoPlay();
      nextSlide();
      startAutoPlay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      stopAutoPlay();
      prevSlide();
      startAutoPlay();
    });
  }

  dots.forEach(function(dot, i) {
    dot.addEventListener('click', function() {
      stopAutoPlay();
      showSlide(i);
      startAutoPlay();
    });
  });

  startAutoPlay();
}
