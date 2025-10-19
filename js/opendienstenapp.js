import { ServicesManager } from './ServicesManager.mjs';
import { HistoryManager } from './HistoryManager.mjs';
import { RatingManager } from './RatingManager.mjs';

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize managers
  const servicesManager = new ServicesManager();
  const historyManager = new HistoryManager();
  const ratingManager = new RatingManager(historyManager);

  // Load services and setup UI
  await servicesManager.loadServices();
  servicesManager.renderServices();

  // Setup filters with callback to update history view if visible
  servicesManager.setupFilters('.category-filters', (selectedCategory) => {
    // If history view is visible, update it with the new filter
    const geschiedenisView = document.getElementById('geschiedenis-view');
    if (geschiedenisView && geschiedenisView.style.display !== 'none') {
      historyManager.loadStoredServices(selectedCategory);
    }
  });

  // Log stored data
  historyManager.logStoredUrls();

  // Navigation functionality
  const geschiedenisView = document.getElementById('geschiedenis-view');
  const overzichtLink = document.querySelector('.nav-link[href="/"]');
  const geschiedenisLink = document.getElementById('mijn-diensten-link');
  const quickActions = document.querySelector('.quick-actions');

  function showOverzicht() {
    // Hide geschiedenis view
    geschiedenisView.style.display = 'none';
    // Show overzicht elements
    document.querySelector('.services-grid').style.display = 'grid';
    quickActions.style.display = '';
    document.querySelector('.filter-menu').style.display = 'block';
    // Update nav state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    overzichtLink.classList.add('active');
  }

  function showGeschiedenis() {
    // Hide overzicht elements
    document.querySelector('.services-grid').style.display = 'none';
    quickActions.style.display = 'none';
    // Keep filter menu visible for geschiedenis
    document.querySelector('.filter-menu').style.display = 'block';
    // Show geschiedenis view
    geschiedenisView.style.display = 'block';
    // Update nav state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    geschiedenisLink.classList.add('active');
    // Load stored services using HistoryManager with current filter
    const activeCategory = servicesManager.getActiveCategory();
    historyManager.loadStoredServices(activeCategory);
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

  // Setup clear history button using HistoryManager
  historyManager.setupClearHistoryHandler();

  // Setup export/import handlers
  historyManager.setupExportImportHandlers();

  // Initialize RatingManager
  ratingManager.init();

  // Setup action button handlers
  const randomButtons = document.querySelectorAll('.random-button');
  randomButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();

      let category;
      if (button.href.includes('videogesprek')) {
        category = 'videobellen';
      } else if (button.href.includes('samen-schrijven')) {
        category = 'samen-schrijven';
      }

      if (category) {
        try {
          const service = servicesManager.selectRandomService(category);
          const uniqueUrl = servicesManager.generateUniqueUrl(service, category);
          const sessionId = historyManager.generateSessionId();

          // Store in history
          historyManager.storeGeneratedUrl(sessionId, service, category, uniqueUrl);

          // Open redirect page in new tab with session ID
          const redirectUrl = `/redirect.html?session=${sessionId}`;
          window.open(redirectUrl, '_blank');

          // Immediately show rating popover on current tab
          ratingManager.showRatingPopover(sessionId);
        } catch (error) {
          console.error('Error generating service URL:', error);
          alert('Geen diensten beschikbaar voor deze categorie.');
        }
      }
    });
  });

  // Apply hash filter on load
  servicesManager.applyHashFilter();

  // Listen for hash changes (back/forward navigation)
  window.addEventListener('hashchange', () => {
    servicesManager.applyHashFilter();
  });
});