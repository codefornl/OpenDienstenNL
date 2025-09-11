import { RatingManager } from './RatingManager.mjs';
import { ServiceManager } from './ServiceManager.mjs';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize managers
  const ratingManager = new RatingManager();
  const serviceManager = new ServiceManager();
  
  // Log stored data
  serviceManager.logStoredUrls();
  ratingManager.logStoredRatings();
  serviceManager.logLinkedData();

  // Navigation functionality
  var overzichtView = document.querySelector('.services-grid').parentElement;
  var geschiedenisView = document.getElementById('geschiedenis-view');
  var overzichtLink = document.querySelector('.nav-link[href="/"]');
  var geschiedenisLink = document.getElementById('mijn-diensten-link');
  var quickActions = document.querySelector('.quick-actions');

  function showOverzicht() {
    // Hide geschiedenis view
    geschiedenisView.style.display = 'none';
    // Show overzicht elements
    document.querySelector('.services-grid').style.display = 'grid';
    quickActions.style.display = 'flex';
    document.querySelector('.filter-menu').style.display = 'block';
    // Update nav state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    overzichtLink.classList.add('active');
    // Refresh ratings display
    setTimeout(function() { ratingManager.addRatingsToServices(); }, 100);
  }

  function showGeschiedenis() {
    // Hide overzicht elements
    document.querySelector('.services-grid').style.display = 'none';
    quickActions.style.display = 'none';
    document.querySelector('.filter-menu').style.display = 'none';
    // Show geschiedenis view
    geschiedenisView.style.display = 'block';
    // Update nav state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    geschiedenisLink.classList.add('active');
    // Load stored services using ServiceManager
    serviceManager.loadStoredServices();
  }

  // Event listeners
  overzichtLink.addEventListener('click', function(e) {
    e.preventDefault();
    showOverzicht();
  });

  geschiedenisLink.addEventListener('click', function(e) {
    e.preventDefault();
    showGeschiedenis();
  });

  // Setup clear history button using ServiceManager
  serviceManager.setupClearHistoryHandler();
  
  // Setup RatingManager
  ratingManager.init();
  var randomButtons = document.querySelectorAll('.random-button');
  ratingManager.setupActionButtonHandlers(randomButtons);
  
  // Check for rating request on page load (handled by RatingManager)
  setTimeout(function() { ratingManager.checkForRatingRequest(); }, 500);
  
  
  // Category filter functionality
  var categories = {};
  var allServices = [];
  
  document.querySelectorAll('[data-category]').forEach(function(el) {
    var category = el.getAttribute('data-category');
    allServices.push(el);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(el);
  });
  
  // Filter functions
  function showAllServices() {
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-button:not([data-category])').classList.add('active');
    allServices.forEach(function(service) {
      service.style.display = 'flex';
    });
    window.location.hash = '';
  }
  
  function showCategoryServices(category) {
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    var button = document.querySelector('.filter-button[data-category="' + category + '"]');
    if (button) {
      button.classList.add('active');
      allServices.forEach(function(service) {
        service.style.display = 'none';
      });
      if (categories[category]) {
        categories[category].forEach(function(service) {
          service.style.display = 'flex';
        });
      }
      window.location.hash = category;
    }
  }
  
  // Add "All" filter
  var allButton = document.createElement('button');
  allButton.innerText = 'Alle';
  allButton.classList.add('filter-button', 'active');
  allButton.addEventListener('click', function() {
    showAllServices();
  });
  document.querySelector('.category-filters').appendChild(allButton);
  
  // Add category filters
  for (var category in categories) {
    var button = document.createElement('button');
    button.innerText = category;
    button.classList.add('filter-button');
    button.setAttribute('data-category', category);
    button.addEventListener('click', function(e) {
      var selectedCategory = e.target.getAttribute('data-category');
      showCategoryServices(selectedCategory);
    });
    document.querySelector('.category-filters').appendChild(button);
  }
  
  // Handle URL hash on page load
  function applyHashFilter() {
    var hash = window.location.hash.substring(1);
    if (hash && categories[hash]) {
      showCategoryServices(hash);
    } else {
      showAllServices();
    }
  }
  
  // Apply hash filter on load
  applyHashFilter();
  
  // Listen for hash changes (back/forward navigation)
  window.addEventListener('hashchange', applyHashFilter);

  // Add ratings on page load using RatingManager
  console.log('Calling addRatingsToServices on page load');
  ratingManager.addRatingsToServices();
  
});