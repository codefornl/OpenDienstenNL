export class RatingManager {
  constructor(historyManager) {
    this.historyManager = historyManager;
    this.popover = null;
    this.stars = null;
    this.closeBtn = null;
    this.currentSessionId = null;
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

      // Handle star hover for preview
      star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        this.previewRating(rating);
      });
    });

    // Handle close button
    this.closeBtn.addEventListener('click', () => {
      this.hidePopover();
    });

    // Handle background click
    this.popover.addEventListener('click', (e) => {
      if (e.target === this.popover) {
        this.hidePopover();
      }
    });

    // Reset preview on mouse leave
    this.popover.addEventListener('mouseleave', () => {
      this.resetStars();
    });
  }

  // Check for pending rating request
  checkForRatingRequest() {
    const ratingRequest = localStorage.getItem('ratingRequest');
    if (ratingRequest) {
      // Small delay to ensure the user has returned to the main page
      setTimeout(() => {
        this.showRatingPopover(ratingRequest);
      }, 1000);
    }
  }

  // Show rating popover for a specific session
  showRatingPopover(sessionId) {
    const entry = this.historyManager.getEntryBySessionId(sessionId);
    if (!entry) {
      console.warn('No entry found for session:', sessionId);
      return;
    }

    // Don't show if already rated (unless called directly from action button)
    if (entry.rating && localStorage.getItem('ratingRequest')) {
      localStorage.removeItem('ratingRequest');
      return;
    }

    this.currentSessionId = sessionId;
    this.resetStars();
    this.popover.style.display = 'flex';

    // Update popover title with service name
    const title = this.popover.querySelector('h3');
    if (title) {
      title.textContent = `Hoe was ${entry.service.naam}?`;
    }
  }

  hidePopover() {
    this.popover.style.display = 'none';
    this.currentSessionId = null;
    localStorage.removeItem('ratingRequest');
  }

  previewRating(rating) {
    this.stars.forEach((star, index) => {
      star.classList.remove('filled', 'hover');
      if (index < rating) {
        star.classList.add('hover');
      }
    });
  }

  selectRating(rating) {
    this.stars.forEach((star, index) => {
      star.classList.remove('filled', 'hover');
      if (index < rating) {
        star.classList.add('filled');
      }
    });
  }

  resetStars() {
    this.stars.forEach(star => {
      star.classList.remove('filled', 'hover');
    });
  }

  saveRating(rating) {
    if (!this.currentSessionId) {
      console.warn('No current session ID for rating');
      return;
    }

    // Save rating to history
    const success = this.historyManager.updateRating(this.currentSessionId, rating);

    if (success) {
      console.log(`Rating ${rating} saved for session ${this.currentSessionId}`);

      // Hide popover after short delay
      setTimeout(() => {
        this.hidePopover();

        // Refresh history view if it's currently visible
        const geschiedenisView = document.getElementById('geschiedenis-view');
        if (geschiedenisView && geschiedenisView.style.display !== 'none') {
          this.historyManager.loadStoredServices();
        }
      }, 500);
    } else {
      console.error('Failed to save rating');
    }
  }

  // Manual trigger for testing
  triggerRatingForSession(sessionId) {
    this.showRatingPopover(sessionId);
  }
}