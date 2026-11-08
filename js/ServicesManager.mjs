// Is this the same service? By id; history entries from before ids were stored: by name and provider.
export function sameService(a, b) {
  if (a.id && b.id) return a.id === b.id;
  return a.naam === b.naam && a.aanbieder === b.aanbieder;
}

// Key for the anonymous rating counts (opendienstenBeoordelingen)
export function ratingKey(service) {
  return service.id || `${service.naam}|${service.aanbieder || ''}`;
}

export class ServicesManager {
  constructor() {
    this.services = [];
    this.liveServices = [];
  }

  // Load services from JSON
  async loadServices() {
    try {
      const response = await fetch('/diensten.json');
      this.services = await response.json();

      // Only live open services: what is not an open service (open: false) is shown, but never chosen or sorted
      // Infrastructure (domain names, newsletters) is neither: shown, not chosen or sorted either
      this.liveServices = this.services.filter(service =>
        service.status === 'live' && service.open !== false && service.soort !== 'infrastructuur');

      return this.liveServices;
    } catch (error) {
      console.error('Error loading services:', error);
      return [];
    }
  }

  // Re-sort the server-rendered cards in each category grid by rating, and show the ratings.
  // The grids come from _includes/organisms/services-by-category.html (data-categorie).
  // Sort the server-rendered cards in each category by rating. The cards are moved, not rebuilt,
  // so what the server put next to them (who uses it, services only in another profile) stays.
  renderCategoryGrids() {
    if (this.services.length === 0) return; // loading failed: keep the server order

    document.querySelectorAll('.services-grid[data-categorie]').forEach(grid => {
      const items = [...grid.children].map(element => {
        const card = element.matches('.service-card') ? element : element.querySelector('.service-card');
        return { element, service: this.liveServices.find(s => s.id === card?.dataset.id) };
      });
      const known = items.filter(item => item.service);
      const sorted = this.sortServicesByRating(known.map(item => item.service))
        .map(service => known.find(item => item.service === service).element);
      grid.append(...sorted, ...items.filter(item => !item.service).map(item => item.element));
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

  // Create a service card element, same markup as _includes/organisms/service-card.html:
  // the title is the link to the service (a.card-link, stretched over the card); software and provider
  // are links of their own on top of it.
  createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.setAttribute('data-id', service.id);
    card.setAttribute('data-category', this.slugify(service.categorie));

    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'favicon-container';
    faviconContainer.appendChild(this.createImage(service.favicon, 'service-favicon', 48));
    if (service.aanbieder_favicon) {
      faviconContainer.appendChild(this.createImage(service.aanbieder_favicon, 'provider-favicon', 22));
    }

    const serviceInfo = document.createElement('div');
    serviceInfo.className = 'service-info';

    const title = document.createElement('h4');
    const cardLink = document.createElement('a');
    cardLink.className = 'card-link';
    cardLink.href = service.url;
    cardLink.target = '_blank';
    cardLink.rel = 'noopener';
    cardLink.textContent = service.naam;
    title.appendChild(cardLink);

    // "Nextcloud door Disroot": the software and the provider, each linked to its page
    const software = document.createElement('p');
    software.className = 'service-software';
    if (service.software_id && service.software !== service.naam) {
      const softwareLink = document.createElement('a');
      softwareLink.className = 'card-sublink';
      softwareLink.href = `/software/${service.software_id}/`;
      softwareLink.textContent = service.software || '';
      software.append(softwareLink, ' ');
    }
    if (service.aanbieder) {
      const providerLink = document.createElement(service.aanbieder_id ? 'a' : 'span');
      if (service.aanbieder_id) {
        providerLink.className = 'card-sublink';
        providerLink.href = `/aanbieders/${service.aanbieder_id}/`;
      }
      providerLink.textContent = service.aanbieder;
      software.append('door ', providerLink);
    }

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
    categoryBadge.textContent = service.categorie.replace(/-/g, ' ');

    // Services that can make a room or document of their own say so; a click makes one (js/opendienstenapp.js)
    const badges = document.createElement('span');
    badges.className = 'service-badges';
    badges.appendChild(categoryBadge);
    badges.append(...this.dienstTags(service));

    metaRow.append(badges);
    serviceMeta.appendChild(metaRow);

    // Second row: rating display (if available)
    const ratingData = this.getServiceAverageRating(service);
    if (ratingData.hasRatings) {
      const ratingDisplay = document.createElement('div');
      ratingDisplay.className = 'service-rating';

      const fullStars = Math.floor(ratingData.rating);
      const stars = document.createElement('span');
      stars.className = 'rating-stars';
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', `${ratingData.rating.toFixed(1)} van 5 sterren`);
      stars.textContent = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

      const ratingText = document.createElement('span');
      ratingText.className = 'rating-text';
      ratingText.textContent = `${ratingData.rating.toFixed(1)} (${ratingData.ratedCount})`;

      ratingDisplay.append(stars, ratingText);
      serviceMeta.appendChild(ratingDisplay);
    }

    serviceInfo.append(title);
    if (software.childNodes.length) serviceInfo.append(software);
    serviceInfo.append(description, serviceMeta);
    card.append(faviconContainer, serviceInfo);

    return card;
  }

  createImage(src, className, size) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.className = className;
    img.loading = 'lazy';
    img.width = size;
    img.height = size;
    return img;
  }

  // The labels of a service, same as _includes/molecules/dienst-tags.html:
  // ✓ or ✗ open source, europees, gratis, geen login, voor iedereen: same text, green or red
  dienstTags(service) {
    const redenen = service.redenen || [];
    const tags = [];
    const tag = (text, goed) => {
      const el = document.createElement('span');
      el.className = `tag ${goed ? 'tag-goed' : 'tag-niet'}`;
      el.textContent = text;
      tags.push(el);
    };
    // Always all five, like _includes/molecules/dienst-tags.html
    tag('open source', service.open_source === true && !redenen.includes('gesloten'));
    tag('europees', service.eu_hosting === true);
    tag('gratis', !redenen.includes('betaald'));
    const geenLogin = service.open !== false && service.soort !== 'infrastructuur' && !redenen.includes('account');
    tag('geen login', geenLogin);
    if (!geenLogin) tags[tags.length - 1].title = 'Login vereist';
    tag('voor iedereen', !service.doelgroep);
    if (service.doelgroep) tags[tags.length - 1].title = `Alleen voor ${service.doelgroep}`;
    return tags;
  }


  // Utility function to slugify category names
  slugify(text) {
    return text.toLowerCase().replace(/\s+/g, '-');
  }

  // The open services a start page can choose from. If some services in the
  // category can make a unique URL (random_url), only those: a room or document
  // of your own is the point of starting one.
  // allowIds: the ids a profile chose for this category; if any of them is live, only those.
  candidatesFor(category, allowIds = null) {
    let inCategory = this.liveServices.filter(service => service.categorie === category);
    if (allowIds && allowIds.length > 0) {
      const chosen = inCategory.filter(service => allowIds.includes(service.id));
      if (chosen.length > 0) return chosen;
    }
    // A service for a limited audience (doelgroep, e.g. governments) is only chosen if a profile chose it
    inCategory = inCategory.filter(service => !service.doelgroep);
    const withRandomUrl = inCategory.filter(service => service.random_url);
    return withRandomUrl.length > 0 ? withRandomUrl : inCategory;
  }

  // Choose an open service with roulette wheel selection based on ratings.
  // exclude: a service not to choose again ("Kies een andere dienst"), if there is another.
  selectRandomService(category, exclude = null, allowIds = null) {
    let candidates = this.candidatesFor(category, allowIds);

    if (exclude && candidates.length > 1) {
      candidates = candidates.filter(service =>
        !sameService(service, exclude)
      );
    }

    if (candidates.length === 0) {
      throw new Error(`No services found for category: ${category}`);
    }

    return this.rouletteWheelSelection(this.calculateServiceWeights(candidates));
  }

  // Get average rating for a specific service
  // Ratings come from the history (if kept) and from the anonymous counts (opendienstenBeoordelingen)
  getServiceAverageRating(service) {
    const storedUrls = JSON.parse(localStorage.getItem('opendienstenStoredUrls') || '[]');
    let anonymous = {};
    try {
      anonymous = JSON.parse(localStorage.getItem('opendienstenBeoordelingen') || '{}')[ratingKey(service)] || {};
    } catch (e) { /* ignore */ }
    const anonymousSum = anonymous.som || 0;
    const anonymousCount = anonymous.aantal || 0;

    // Find all history entries for this service
    const serviceHistory = storedUrls.filter(entry => sameService(entry.service, service));

    const ratedEntries = serviceHistory.filter(entry => entry.rating);
    const ratedCount = ratedEntries.length + anonymousCount;
    const totalRating = ratedEntries.reduce((sum, entry) => sum + entry.rating, 0) + anonymousSum;

    // Default rating 3 if there are no ratings yet
    return {
      rating: ratedCount > 0 ? totalRating / ratedCount : 3,
      hasRatings: ratedCount > 0,
      historyCount: serviceHistory.length,
      ratedCount
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
        return item.service;
      }
    }

    // Fallback (should not reach here)
    return servicesWithWeights[servicesWithWeights.length - 1].service;
  }

  // Generate a unique, hard to guess URL on the service: a room or document of your own.
  // Only for services with a random_url; others get their normal URL.
  // Just the base plus a random code, e.g. https://meetme.bit.nl/k7m2q9xw4hr8tn3v
  generateUniqueUrl(service) {
    if (!service.random_url) return service.url;

    const base = service.random_url.endsWith('/') ? service.random_url : service.random_url + '/';
    return `${base}${this.randomToken()}`;
  }

  // 16 characters from a cryptographic random source: about 80 bits, not guessable
  randomToken(length = 16) {
    const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
  }
}