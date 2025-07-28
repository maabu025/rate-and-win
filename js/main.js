// main.js

document.addEventListener('DOMContentLoaded', function () {
  highlightActiveNav();
  loadUsernameFromStorage();
  setupAccessibilityToggle();
});

// Highlight the current page in the navbar
function highlightActiveNav() {
  const currentPage = location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll("nav a");

  navLinks.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

// Load stored username and personalize greeting
function loadUsernameFromStorage() {
  const username = localStorage.getItem('username');
  if (username) {
    const userSpans = document.querySelectorAll('.username');
    userSpans.forEach(span => {
      span.textContent = username;
    });
  }
}

// Accessibility toggle for dark mode
function setupAccessibilityToggle() {
  const toggle = document.querySelector('#darkModeToggle');
  if (!toggle) return;

  toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', toggle.checked);
    localStorage.setItem('darkMode', toggle.checked);
  });

  const isDark = JSON.parse(localStorage.getItem('darkMode'));
  if (isDark) {
    document.body.classList.add('dark-mode');
    toggle.checked = true;
  }
}

