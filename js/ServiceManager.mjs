export class ServiceManager {
  constructor() {
    this.services = [];
  }

  // Initialize with services data (for redirect pages)
  initWithServices(servicesData) {
    this.services = servicesData;
  }

  // Generate session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  // Select random service from category
  selectRandomService(category) {
    const filteredServices = this.services.filter(service => 
      service.categorie === category && service.status === 'live'
    );
    
    if (filteredServices.length === 0) {
      throw new Error(`No services found for category: ${category}`);
    }

    const randomIndex = Math.floor(Math.random() * filteredServices.length);
    return filteredServices[randomIndex];
  }

  // Generate unique URL for service
  generateUniqueUrl(service, category) {
    const baseUrl = service.random_url || service.url;
    let uniqueUrl;
    
    // Add random room/meeting name for video services
    if (category === 'videobellen') {
      const roomNames = ['vergadering', 'meeting', 'overleg', 'gesprek', 'sessie', 'bijeenkomst'];
      const randomRoom = roomNames[Math.floor(Math.random() * roomNames.length)] + 
                         Math.floor(Math.random() * 10000);
      uniqueUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + randomRoom;
    }
    // Add random document name for collaborative writing
    else if (category === 'samen-schrijven') {
      const docNames = ['document', 'notitie', 'tekst', 'concept', 'draft', 'samenwerking'];
      const randomDoc = docNames[Math.floor(Math.random() * docNames.length)] + 
                       Math.floor(Math.random() * 10000);
      uniqueUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + randomDoc;
    }
    else {
      uniqueUrl = baseUrl;
    }

    return uniqueUrl;
  }

  // Store service URL in localStorage for history
  storeServiceUrl(sessionId, service, category, uniqueUrl) {
    try {
      const storedUrls = JSON.parse(localStorage.getItem('openDienstenUrls') || '[]');
      const urlEntry = {
        sessionId: sessionId,
        service: service.naam,
        category: service.categorie || category,
        software: service.software,
        aanbieder: service.aanbieder,
        url: uniqueUrl,
        timestamp: new Date().toISOString()
      };
      
      storedUrls.push(urlEntry);
      localStorage.setItem('openDienstenUrls', JSON.stringify(storedUrls));
      
      console.log('Generated service URL:', uniqueUrl);
      console.log('Session ID:', sessionId);
      
      return urlEntry;
    } catch (e) {
      console.warn('Could not store service URL:', e);
      throw e;
    }
  }

  // Store session data for rating
  storeSessionData(sessionId, service, category, needsRating = false) {
    try {
      const sessionData = {
        sessionId: sessionId,
        service: service.naam,
        software: service.software,
        aanbieder: service.aanbieder,
        category: category,
        needsRating: needsRating,
        timestamp: new Date().toISOString()
      };
      
      sessionStorage.setItem('openDienstenCurrentSession', JSON.stringify(sessionData));
      return sessionData;
    } catch (e) {
      console.warn('Could not store session data:', e);
      throw e;
    }
  }

  // Full redirect flow for a category
  redirectToRandomService(category, sessionId = null) {
    try {
      // Use provided session ID or generate new one
      const actualSessionId = sessionId || this.generateSessionId();
      
      // Select random service
      const selectedService = this.selectRandomService(category);
      
      // Generate unique URL
      const uniqueUrl = this.generateUniqueUrl(selectedService, category);
      
      // Store URL in history
      this.storeServiceUrl(actualSessionId, selectedService, category, uniqueUrl);
      
      // Store session data
      this.storeSessionData(actualSessionId, selectedService, category, false);
      
      return {
        sessionId: actualSessionId,
        service: selectedService,
        url: uniqueUrl
      };
    } catch (error) {
      console.error('Error in redirect flow:', error);
      throw error;
    }
  }

  // Log stored URLs to console
  logStoredUrls() {
    try {
      const storedUrls = JSON.parse(localStorage.getItem('openDienstenUrls') || '[]');
      if (storedUrls.length > 0) {
        console.log('🔗 Gegenereerde URLs van OpenDiensten:', storedUrls);
        console.table(storedUrls.map(entry => ({
          'Service': entry.service,
          'Categorie': entry.category,
          'Software': entry.software,
          'URL': entry.url,
          'Datum': new Date(entry.timestamp).toLocaleString('nl-NL')
        })));
      } else {
        console.log('🔗 Nog geen gegenereerde URLs van OpenDiensten');
      }
    } catch (e) {
      console.warn('Could not read URLs from localStorage:', e);
    }
  }

  // Get stored URLs for history display
  getStoredUrls() {
    try {
      return JSON.parse(localStorage.getItem('openDienstenUrls') || '[]');
    } catch (e) {
      console.warn('Could not read URLs from localStorage:', e);
      return [];
    }
  }

  // Clear all stored URLs and ratings
  clearHistory() {
    try {
      localStorage.removeItem('openDienstenUrls');
      localStorage.removeItem('openDienstenRatings');
      return true;
    } catch (e) {
      console.warn('Could not clear history:', e);
      return false;
    }
  }

  // Get stored ratings
  getStoredRatings() {
    try {
      return JSON.parse(localStorage.getItem('openDienstenRatings') || '[]');
    } catch (e) {
      console.warn('Could not read ratings from localStorage:', e);
      return [];
    }
  }

  // Find rating for a session ID
  findRatingForSession(sessionId, storedRatings) {
    return storedRatings.find(rating => rating.sessionId === sessionId);
  }

  // Generate rating display HTML
  generateRatingHtml(rating) {
    if (!rating) {
      return '<div class="service-rating-history no-rating"><span class="rating-text">Nog niet beoordeeld</span></div>';
    }

    const stars = '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating);
    return `<div class="service-rating-history">
      <span class="rating-stars">${stars}</span>
      <span class="rating-text">${rating.rating}/5</span>
    </div>`;
  }

  // Load and display stored services in history view with ratings
  loadStoredServices() {
    const dienstenLijst = document.getElementById('diensten-lijst');
    const clearBtn = document.getElementById('clear-history-btn');
    
    if (!dienstenLijst || !clearBtn) {
      console.warn('History elements not found');
      return;
    }
    
    try {
      const storedUrls = this.getStoredUrls();
      const storedRatings = this.getStoredRatings();
      
      if (storedUrls.length === 0) {
        dienstenLijst.innerHTML = '<p class="empty-state">Je hebt nog geen diensten gegenereerd. Klik op "Start videogesprek" of "Start samen schrijven" om te beginnen!</p>';
        clearBtn.style.display = 'none';
        return;
      }

      const html = storedUrls.reverse().map(entry => {
        const matchingRating = this.findRatingForSession(entry.sessionId, storedRatings);
        const ratingHtml = this.generateRatingHtml(matchingRating);
        
        return '<div class="dienst-item">' +
          '<div class="dienst-header">' +
            '<div class="dienst-info">' +
              '<h3>' + entry.service + '</h3>' +
              '<div class="dienst-meta">' + entry.category + ' • ' + entry.software + ' • ' + new Date(entry.timestamp).toLocaleString('nl-NL') + '</div>' +
            '</div>' +
            '<div class="dienst-rating">' + ratingHtml + '</div>' +
          '</div>' +
          '<div class="dienst-url"><a href="' + entry.url + '" target="_blank">' + entry.url + '</a></div>' +
        '</div>';
      }).join('');
      
      dienstenLijst.innerHTML = html;
      clearBtn.style.display = 'block';
    } catch (e) {
      dienstenLijst.innerHTML = '<p class="empty-state">Er is een fout opgetreden bij het laden van je diensten.</p>';
      clearBtn.style.display = 'none';
    }
  }

  // Setup clear history button handler
  setupClearHistoryHandler() {
    const clearBtn = document.getElementById('clear-history-btn');
    if (!clearBtn) {
      console.warn('Clear history button not found');
      return;
    }

    clearBtn.addEventListener('click', () => {
      if (confirm('Weet je zeker dat je alle geschiedenis wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
        if (this.clearHistory()) {
          this.loadStoredServices(); // Refresh the view
          console.log('Geschiedenis gewist');
        } else {
          alert('Er is een fout opgetreden bij het wissen van de geschiedenis.');
        }
      }
    });
  }

  // Log linked data (URLs + ratings)
  logLinkedData() {
    try {
      const storedRatings = JSON.parse(localStorage.getItem('openDienstenRatings') || '[]');
      const storedUrls = this.getStoredUrls();
      
      if (storedRatings.length > 0 && storedUrls.length > 0) {
        console.log('🔗⭐ Gekoppelde sessies en ratings:');
        const linkedData = [];
        storedUrls.forEach(urlEntry => {
          const matchingRating = storedRatings.find(rating => 
            rating.sessionId === urlEntry.sessionId
          );
          linkedData.push({
            'SessionID': urlEntry.sessionId,
            'Service': urlEntry.service,
            'URL': urlEntry.url,
            'Rating': matchingRating ? 
              '★'.repeat(matchingRating.rating) + '☆'.repeat(5 - matchingRating.rating) + ' (' + matchingRating.rating + '/5)' : 
              'Nog niet beoordeeld',
            'Datum': new Date(urlEntry.timestamp).toLocaleString('nl-NL')
          });
        });
        console.table(linkedData);
      }
    } catch (e) {
      console.warn('Could not read linked data from localStorage:', e);
    }
  }
}