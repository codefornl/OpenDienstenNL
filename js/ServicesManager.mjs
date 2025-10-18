export class ServicesManager {
  constructor() {
    this.services = [];
    this.liveServices = [];
    this.categories = {};
    this.activeCategory = null; // Track the currently active category filter
  }

  // Load services from JSON
  async loadServices() {
    try {
      const response = await fetch('/diensten.json');
      this.services = await response.json();

      // Filter only live services
      this.liveServices = this.services.filter(service => service.status === 'live');

      // Setup categories
      this.setupCategories();

      return this.liveServices;
    } catch (error) {
      console.error('Error loading services:', error);
      return [];
    }
  }

  // Setup categories for filtering
  setupCategories() {
    this.categories = {};
    this.liveServices.forEach(service => {
      const category = this.slugify(service.categorie);
      if (!this.categories[category]) {
        this.categories[category] = {
          name: service.categorie,
          services: []
        };
      }
      this.categories[category].services.push(service);
    });
  }

  // Render services to the grid
  renderServices(containerId = 'services-grid') {
    const servicesGrid = document.getElementById(containerId);
    if (!servicesGrid) {
      console.error('Services grid container not found');
      return;
    }

    servicesGrid.innerHTML = '';

    // Sort services by average rating (descending), then by name
    const sortedServices = this.sortServicesByRating(this.liveServices);

    sortedServices.forEach(service => {
      const serviceCard = this.createServiceCard(service);
      servicesGrid.appendChild(serviceCard);
    });
  }

  // Sort services by average rating (highest first)
  sortServicesByRating(services) {
    return services.slice().sort((a, b) => {
      const ratingA = this.getServiceAverageRating(a);
      const ratingB = this.getServiceAverageRating(b);

      // Primary sort: by rating (descending)
      // Services with actual ratings (hasRatings=true) get priority over default ratings
      if (ratingA.hasRatings && !ratingB.hasRatings) return -1;
      if (!ratingA.hasRatings && ratingB.hasRatings) return 1;

      // If both have ratings or both don't have ratings, sort by rating value
      if (ratingB.rating !== ratingA.rating) {
        return ratingB.rating - ratingA.rating;
      }

      // Secondary sort: by number of ratings (more ratings = more reliable)
      if (ratingB.ratedCount !== ratingA.ratedCount) {
        return ratingB.ratedCount - ratingA.ratedCount;
      }

      // Tertiary sort: alphabetically by name
      return a.naam.localeCompare(b.naam);
    });
  }

  // Create a service card element
  createServiceCard(service) {
    const card = document.createElement('a');
    card.href = service.url;
    card.className = 'service-card';
    card.target = '_blank';
    card.setAttribute('data-category', this.slugify(service.categorie));

    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'favicon-container';

    const serviceFavicon = document.createElement('img');
    serviceFavicon.src = service.favicon;
    serviceFavicon.alt = service.naam;
    serviceFavicon.className = 'service-favicon';
    faviconContainer.appendChild(serviceFavicon);

    if (service.aanbieder_favicon) {
      const providerFavicon = document.createElement('img');
      providerFavicon.src = service.aanbieder_favicon;
      providerFavicon.alt = service.aanbieder;
      providerFavicon.className = 'provider-favicon';
      faviconContainer.appendChild(providerFavicon);
    }

    const serviceInfo = document.createElement('div');
    serviceInfo.className = 'service-info';

    const title = document.createElement('h4');
    title.textContent = service.naam;

    const description = document.createElement('p');
    description.className = 'service-description';
    description.textContent = service.beschrijving;

    const serviceMeta = document.createElement('div');
    serviceMeta.className = 'service-meta';

    // First row: category and provider info
    const metaRow = document.createElement('div');
    metaRow.className = 'service-meta-row';

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = service.categorie;

    const providerInfo = document.createElement('div');
    providerInfo.className = 'provider-info';

    const euFlag = document.createElement('span');
    if (service.eu_hosting) {
      euFlag.className = 'eu-flag';
      euFlag.textContent = '🇪🇺';
    } else {
      euFlag.className = 'non-eu-flag';
      euFlag.title = 'Niet in EU gehost';
      euFlag.innerHTML = '<span class="eu-flag-base">🇪🇺</span><span class="prohibited-symbol">✘</span>';
    }

    const providerName = document.createElement('span');
    providerName.className = 'provider-name';
    providerName.textContent = service.aanbieder || '';

    providerInfo.appendChild(euFlag);
    providerInfo.appendChild(providerName);

    metaRow.appendChild(categoryBadge);
    metaRow.appendChild(providerInfo);
    serviceMeta.appendChild(metaRow);

    // Second row: rating display (if available)
    const ratingData = this.getServiceAverageRating(service);
    if (ratingData.hasRatings) {
      const ratingDisplay = document.createElement('div');
      ratingDisplay.className = 'service-rating';

      const stars = document.createElement('span');
      stars.className = 'rating-stars';
      const fullStars = Math.floor(ratingData.rating);
      const hasHalfStar = ratingData.rating - fullStars >= 0.5;
      stars.textContent = '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));

      const ratingText = document.createElement('span');
      ratingText.className = 'rating-text';
      ratingText.textContent = `${ratingData.rating.toFixed(1)} (${ratingData.ratedCount})`;

      ratingDisplay.appendChild(stars);
      ratingDisplay.appendChild(ratingText);
      serviceMeta.appendChild(ratingDisplay);
    }

    serviceInfo.appendChild(title);
    serviceInfo.appendChild(description);
    serviceInfo.appendChild(serviceMeta);

    card.appendChild(faviconContainer);
    card.appendChild(serviceInfo);

    return card;
  }

  // Setup category filters
  setupFilters(containerSelector = '.category-filters', onFilterChange = null) {
    const categoryFilters = document.querySelector(containerSelector);
    if (!categoryFilters) {
      console.error('Category filters container not found');
      return;
    }

    categoryFilters.innerHTML = '';

    // Add "All" filter
    const allButton = document.createElement('button');
    allButton.innerText = 'Alle';
    allButton.classList.add('filter-button', 'active');
    allButton.addEventListener('click', () => {
      this.showAllServices();
      if (onFilterChange) onFilterChange(null);
    });
    categoryFilters.appendChild(allButton);

    // Add category filters
    Object.keys(this.categories).forEach(categorySlug => {
      const category = this.categories[categorySlug];
      const button = document.createElement('button');
      button.innerText = category.name;
      button.classList.add('filter-button');
      button.setAttribute('data-category', categorySlug);
      button.addEventListener('click', (e) => {
        const selectedCategory = e.target.getAttribute('data-category');
        this.showCategoryServices(selectedCategory);
        if (onFilterChange) onFilterChange(selectedCategory);
      });
      categoryFilters.appendChild(button);
    });
  }

  // Filter functions
  showAllServices() {
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-button:not([data-category])').classList.add('active');

    // Update active category
    this.activeCategory = null;

    // Re-render all services sorted by rating
    this.renderServices();

    window.location.hash = '';
  }

  showCategoryServices(category) {
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    const button = document.querySelector('.filter-button[data-category="' + category + '"]');
    if (button) {
      button.classList.add('active');

      // Update active category
      this.activeCategory = category;

      // Re-render only services in this category (sorted by rating)
      const categoryServices = this.liveServices.filter(service =>
        this.slugify(service.categorie) === category
      );
      const sortedCategoryServices = this.sortServicesByRating(categoryServices);

      // Clear and re-render with sorted category services
      const servicesGrid = document.getElementById('services-grid');
      servicesGrid.innerHTML = '';

      sortedCategoryServices.forEach(service => {
        const serviceCard = this.createServiceCard(service);
        servicesGrid.appendChild(serviceCard);
      });

      window.location.hash = category;
    }
  }

  // Apply hash filter
  applyHashFilter() {
    const hash = window.location.hash.substring(1);
    if (hash && this.categories[hash]) {
      this.showCategoryServices(hash);
    } else {
      this.showAllServices();
    }
  }

  // Get current active category
  getActiveCategory() {
    return this.activeCategory;
  }

  // Utility function to slugify category names
  slugify(text) {
    return text.toLowerCase().replace(/\s+/g, '-');
  }

  // Generate random service for quick actions using roulette wheel selection based on ratings
  selectRandomService(category) {
    const filteredServices = this.liveServices.filter(service =>
      service.categorie === category
    );

    if (filteredServices.length === 0) {
      throw new Error(`No services found for category: ${category}`);
    }

    // Get historical ratings for weighted selection
    const servicesWithWeights = this.calculateServiceWeights(filteredServices);

    // Debug logging
    console.log('Service weights for category:', category);
    servicesWithWeights.forEach(item => {
      console.log(`- ${item.service.naam} (${item.service.aanbieder}): rating ${item.rating.toFixed(1)}, weight ${item.weight.toFixed(2)}, history: ${item.historyCount}`);
    });

    return this.rouletteWheelSelection(servicesWithWeights);
  }

  // Get average rating for a specific service
  getServiceAverageRating(service) {
    const storedUrls = JSON.parse(localStorage.getItem('opendienstenStoredUrls') || '[]');

    // Find all history entries for this service
    const serviceHistory = storedUrls.filter(entry =>
      entry.service.naam === service.naam &&
      entry.service.aanbieder === service.aanbieder
    );

    let averageRating = 3; // Default rating if no history
    let hasRatings = false;

    if (serviceHistory.length > 0) {
      // Calculate average rating from rated entries
      const ratedEntries = serviceHistory.filter(entry => entry.rating);

      if (ratedEntries.length > 0) {
        const totalRating = ratedEntries.reduce((sum, entry) => sum + entry.rating, 0);
        averageRating = totalRating / ratedEntries.length;
        hasRatings = true;
      }
      // If there are unrated entries but no rated ones, use default (3)
    }

    return {
      rating: averageRating,
      hasRatings,
      historyCount: serviceHistory.length,
      ratedCount: serviceHistory.filter(entry => entry.rating).length
    };
  }

  // Calculate weights based on historical ratings
  calculateServiceWeights(services) {
    return services.map(service => {
      const ratingData = this.getServiceAverageRating(service);

      // Convert rating to weight (exponential to give better ratings much higher chance)
      // Rating 1 -> weight ~0.37, Rating 3 -> weight 1, Rating 5 -> weight ~2.72
      const weight = Math.exp((ratingData.rating - 3) / 2);

      return {
        service,
        rating: ratingData.rating,
        weight,
        historyCount: ratingData.historyCount,
        hasRatings: ratingData.hasRatings,
        ratedCount: ratingData.ratedCount
      };
    });
  }

  // Roulette wheel selection based on weights
  rouletteWheelSelection(servicesWithWeights) {
    const totalWeight = servicesWithWeights.reduce((sum, item) => sum + item.weight, 0);

    if (totalWeight === 0) {
      // Fallback to uniform random if all weights are 0
      const randomIndex = Math.floor(Math.random() * servicesWithWeights.length);
      return servicesWithWeights[randomIndex].service;
    }

    let random = Math.random() * totalWeight;

    for (const item of servicesWithWeights) {
      random -= item.weight;
      if (random <= 0) {
        console.log(`Selected service: ${item.service.naam} (rating: ${item.rating.toFixed(1)}, weight: ${item.weight.toFixed(2)})`);
        return item.service;
      }
    }

    // Fallback (should not reach here)
    return servicesWithWeights[servicesWithWeights.length - 1].service;
  }

  // Generate unique URL for service
  generateUniqueUrl(service, category) {
    const baseUrl = service.random_url || service.url;
    let uniqueUrl;

    if (category === 'videobellen') {
      const roomNames = ['vergadering', 'meeting', 'overleg', 'gesprek', 'sessie', 'bijeenkomst'];
      const randomRoom = roomNames[Math.floor(Math.random() * roomNames.length)] +
                         Math.floor(Math.random() * 10000);
      uniqueUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + randomRoom;
    } else if (category === 'samen-schrijven') {
      const docNames = ['document', 'notitie', 'tekst', 'concept', 'draft', 'samenwerking'];
      const randomDoc = docNames[Math.floor(Math.random() * docNames.length)] +
                       Math.floor(Math.random() * 10000);
      uniqueUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + randomDoc;
    } else {
      uniqueUrl = baseUrl;
    }

    return uniqueUrl;
  }
}