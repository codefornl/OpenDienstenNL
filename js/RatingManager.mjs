export class RatingManager {
  constructor() {
    this.popover = null;
    this.stars = null;
    this.closeBtn = null;
    this.currentSessionData = null;
  }

  init() {
    this.popover = document.getElementById('rating-popover');
    this.stars = document.querySelectorAll('.star');
    this.closeBtn = document.querySelector('.close-popover');
    
    if (!this.popover || !this.stars.length || !this.closeBtn) {
      console.warn('Rating elements not found');
      return;
    }

    this.setupEventListeners();
    this.checkForRatingRequest();
  }

  setupEventListeners() {
    // Handle star clicks
    this.stars.forEach((star) => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        this.selectRating(rating);
        this.saveRating(rating);
      });
      
      // Hover effect
      star.addEventListener('mouseenter', () => {
        const hoverRating = parseInt(star.dataset.rating);
        this.highlightStars(hoverRating);
      });
    });
    
    // Reset hover on mouse leave
    document.querySelector('.star-rating').addEventListener('mouseleave', () => {
      this.stars.forEach(s => s.classList.remove('hover'));
    });
    
    // Close button
    this.closeBtn.addEventListener('click', () => {
      this.hidePopover();
    });
    
    // Close on background click
    this.popover.addEventListener('click', (e) => {
      if (e.target === this.popover) {
        this.hidePopover();
      }
    });
  }

  showRatingPopup(sessionId, service, category, actualService) {
    this.currentSessionData = {
      sessionId,
      service,
      category,
      actualService
    };

    this.popover.style.display = 'flex';
    this.popover.dataset.service = category;
    this.popover.dataset.sessionId = sessionId;
    this.popover.dataset.actualService = actualService;
    console.log('Showing rating popup for:', actualService);
  }

  hidePopover() {
    this.popover.style.display = 'none';
    this.resetStars();
  }

  selectRating(rating) {
    // Fill stars up to clicked rating
    this.stars.forEach((s, i) => {
      if (i < rating) {
        s.textContent = '★';
        s.classList.add('filled');
      } else {
        s.textContent = '☆';
        s.classList.remove('filled');
      }
    });
  }

  highlightStars(rating) {
    this.stars.forEach((s, i) => {
      if (i < rating) {
        s.classList.add('hover');
      } else {
        s.classList.remove('hover');
      }
    });
  }

  resetStars() {
    this.stars.forEach(s => {
      s.textContent = '☆';
      s.classList.remove('filled', 'hover');
    });
  }

  saveRating(rating) {
    try {
      const storedRatings = JSON.parse(localStorage.getItem('openDienstenRatings') || '[]');
      const ratingEntry = {
        sessionId: this.popover.dataset.sessionId || null,
        service: this.popover.dataset.actualService || this.popover.dataset.service,
        action: this.popover.dataset.service,
        rating: rating,
        timestamp: new Date().toISOString()
      };
      
      storedRatings.push(ratingEntry);
      localStorage.setItem('openDienstenRatings', JSON.stringify(storedRatings));
      console.log('Rating opgeslagen voor service:', ratingEntry.service, 'Rating:', ratingEntry.rating);
      
      // Clear session info after rating
      try {
        sessionStorage.removeItem('openDienstenCurrentSession');
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.warn('Could not save rating to localStorage:', e);
    }
    
    // Hide popover after rating
    setTimeout(() => {
      this.hidePopover();
    }, 1000);
  }

  checkForRatingRequest() {
    try {
      const currentSession = JSON.parse(sessionStorage.getItem('openDienstenCurrentSession') || '{}');
      if (currentSession.sessionId && currentSession.service && currentSession.needsRating) {
        // Show rating popup
        this.showRatingPopup(
          currentSession.sessionId,
          currentSession.category || 'service',
          currentSession.category,
          currentSession.service
        );
        
        // Mark that rating popup has been shown
        currentSession.needsRating = false;
        sessionStorage.setItem('openDienstenCurrentSession', JSON.stringify(currentSession));
      }
    } catch (e) {
      console.warn('Could not check for rating request:', e);
    }
  }

  logStoredRatings() {
    try {
      const storedRatings = JSON.parse(localStorage.getItem('openDienstenRatings') || '[]');
      if (storedRatings.length > 0) {
        console.log('⭐ Service ratings van OpenDiensten:', storedRatings);
        console.table(storedRatings.map(entry => ({
          'SessionID': entry.sessionId || 'Onbekend',
          'Service': entry.service,
          'Actie': entry.action || entry.service,
          'Rating': '★'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating) + ' (' + entry.rating + '/5)',
          'Datum': new Date(entry.timestamp).toLocaleString('nl-NL')
        })));
      } else {
        console.log('⭐ Nog geen service ratings van OpenDiensten');
      }
    } catch (e) {
      console.warn('Could not read ratings from localStorage:', e);
    }
  }

  addRatingsToServices() {
    try {
      const storedRatings = JSON.parse(localStorage.getItem('openDienstenRatings') || '[]');
      console.log('addRatingsToServices: Found ratings:', storedRatings);
      if (storedRatings.length === 0) {
        console.log('No ratings found, skipping rating display');
        return;
      }

      // Calculate average ratings per service
      const serviceRatings = {};
      storedRatings.forEach(rating => {
        const serviceName = rating.service;
        if (!serviceRatings[serviceName]) {
          serviceRatings[serviceName] = { total: 0, count: 0 };
        }
        serviceRatings[serviceName].total += rating.rating;
        serviceRatings[serviceName].count++;
      });
      
      console.log('Calculated service ratings:', serviceRatings);

      // Add ratings to service cards
      const serviceCards = document.querySelectorAll('.service-card');
      console.log('Found', serviceCards.length, 'service cards');
      serviceCards.forEach(card => {
        const serviceName = card.querySelector('h4').textContent.trim();
        console.log('Checking card for service:', serviceName);
        if (serviceRatings[serviceName]) {
          console.log('Found rating for', serviceName, ':', serviceRatings[serviceName]);
          const average = serviceRatings[serviceName].total / serviceRatings[serviceName].count;
          const count = serviceRatings[serviceName].count;
          
          // Remove existing rating if any
          const existingRating = card.querySelector('.service-rating');
          if (existingRating) {
            existingRating.remove();
          }
          
          // Create rating display
          const ratingDiv = document.createElement('div');
          ratingDiv.className = 'service-rating';
          
          const starsSpan = document.createElement('span');
          starsSpan.className = 'rating-stars';
          const fullStars = Math.floor(average);
          const hasHalfStar = average - fullStars >= 0.5;
          
          starsSpan.innerHTML = '★'.repeat(fullStars) + 
            (hasHalfStar ? '☆' : '') + 
            '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
          
          const ratingText = document.createElement('span');
          ratingText.className = 'rating-text';
          ratingText.textContent = average.toFixed(1) + ' (' + count + ')';
          
          ratingDiv.appendChild(starsSpan);
          ratingDiv.appendChild(ratingText);
          
          // Insert after service description
          const description = card.querySelector('.service-description');
          if (description && description.parentNode) {
            description.parentNode.insertBefore(ratingDiv, description.nextSibling);
          }
        }
      });
    } catch (e) {
      console.warn('Could not add ratings to services:', e);
    }
  }

  setupActionButtonHandlers(randomButtons) {
    randomButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Generate session ID for tracking
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        const actionText = button.textContent.trim();
        
        // Store session info
        try {
          const sessionData = {
            sessionId: sessionId,
            service: 'Willekeurige ' + (actionText.includes('videogesprek') ? 'videodienst' : 'schrijfdienst'),
            category: actionText.includes('videogesprek') ? 'videobellen' : 'samen-schrijven',
            needsRating: true,
            timestamp: new Date().toISOString()
          };
          sessionStorage.setItem('openDienstenCurrentSession', JSON.stringify(sessionData));
        } catch (e) {
          console.warn('Could not store session data:', e);
        }
        
        // Add session ID to the redirect URL
        const originalHref = button.getAttribute('href');
        const newHref = originalHref + '?session=' + encodeURIComponent(sessionId);
        button.setAttribute('href', newHref);
        
        // Show rating popup immediately
        this.showRatingPopup(
          sessionId,
          actionText.includes('videogesprek') ? 'videobellen' : 'samen-schrijven',
          actionText.includes('videogesprek') ? 'videobellen' : 'samen-schrijven',
          actionText
        );
      });
    });
  }
}