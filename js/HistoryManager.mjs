export class HistoryManager {
  constructor() {
    this.storageKey = 'opendienstenStoredUrls';
  }

  // Generate session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  // Store generated URL in localStorage
  storeGeneratedUrl(sessionId, service, category, url) {
    const storedUrls = this.getStoredUrls();
    const timestamp = new Date().toISOString();

    storedUrls.unshift({
      sessionId: sessionId,
      service: {
        naam: service.naam,
        categorie: service.categorie,
        aanbieder: service.aanbieder,
        favicon: service.favicon,
        aanbieder_favicon: service.aanbieder_favicon
      },
      category: category,
      url: url,
      timestamp: timestamp,
      rating: null // Will be set later via rating popover
    });

    // Keep only last 50 entries
    if (storedUrls.length > 50) {
      storedUrls.splice(50);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(storedUrls));
  }

  // Get stored URLs from localStorage
  getStoredUrls() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Clear all stored URLs
  clearStoredUrls() {
    localStorage.removeItem(this.storageKey);
  }

  // Delete a specific entry by session ID
  deleteEntry(sessionId) {
    const storedUrls = this.getStoredUrls();
    const filteredUrls = storedUrls.filter(entry => entry.sessionId !== sessionId);
    localStorage.setItem(this.storageKey, JSON.stringify(filteredUrls));
    return true;
  }

  // Export data as JSON file
  exportData() {
    const data = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      application: "OpenDiensten",
      services: this.getStoredUrls()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opendiensten-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import data from JSON file
  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          // Validate data structure
          if (!data.services || !Array.isArray(data.services)) {
            reject(new Error('Ongeldig bestandsformaat'));
            return;
          }

          // Validate version (future-proofing)
          if (data.version && data.version !== "1.0") {
            console.warn('Verschillende versie gedetecteerd:', data.version);
          }

          // Get existing data
          const existingUrls = this.getStoredUrls();
          const existingSessionIds = new Set(existingUrls.map(entry => entry.sessionId));

          // Merge: add new entries, update existing ones if imported is newer
          const mergedUrls = [...existingUrls];
          let importedCount = 0;
          let updatedCount = 0;

          data.services.forEach(importedEntry => {
            // Validate entry structure
            if (!importedEntry.sessionId || !importedEntry.service || !importedEntry.url) {
              console.warn('Ongeldige entry geskipt:', importedEntry);
              return;
            }

            if (existingSessionIds.has(importedEntry.sessionId)) {
              // Update existing entry if imported is newer
              const existingIndex = mergedUrls.findIndex(e => e.sessionId === importedEntry.sessionId);
              const existingTimestamp = new Date(mergedUrls[existingIndex].timestamp);
              const importedTimestamp = new Date(importedEntry.timestamp);

              if (importedTimestamp > existingTimestamp) {
                mergedUrls[existingIndex] = importedEntry;
                updatedCount++;
              }
            } else {
              // Add new entry
              mergedUrls.push(importedEntry);
              importedCount++;
            }
          });

          // Sort by timestamp (newest first)
          mergedUrls.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          // Keep only last 100 entries after import
          if (mergedUrls.length > 100) {
            mergedUrls.splice(100);
          }

          // Save merged data
          localStorage.setItem(this.storageKey, JSON.stringify(mergedUrls));

          resolve({
            imported: importedCount,
            updated: updatedCount,
            total: mergedUrls.length
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Fout bij het lezen van het bestand'));
      reader.readAsText(file);
    });
  }

  // Update rating for a specific session
  updateRating(sessionId, rating) {
    const storedUrls = this.getStoredUrls();
    const entryIndex = storedUrls.findIndex(entry => entry.sessionId === sessionId);

    if (entryIndex !== -1) {
      storedUrls[entryIndex].rating = rating;
      localStorage.setItem(this.storageKey, JSON.stringify(storedUrls));
      return true;
    }
    return false;
  }

  // Get entry by session ID
  getEntryBySessionId(sessionId) {
    const storedUrls = this.getStoredUrls();
    return storedUrls.find(entry => entry.sessionId === sessionId);
  }

  // Load and display stored services in the history view
  loadStoredServices(activeCategory = null) {
    const storedUrls = this.getStoredUrls();
    const dienstenLijst = document.getElementById('diensten-lijst');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const exportHistoryBtn = document.getElementById('export-history-btn');
    const importHistoryBtn = document.getElementById('import-history-btn');

    if (!dienstenLijst) {
      console.error('Diensten lijst container not found');
      return;
    }

    // Filter by active category if provided
    let filteredUrls = storedUrls;
    if (activeCategory && activeCategory !== 'alle') {
      filteredUrls = storedUrls.filter(entry => {
        const entryCategory = this.slugify(entry.service.categorie);
        return entryCategory === activeCategory;
      });
    }

    if (storedUrls.length === 0) {
      // No history at all - show only import button
      const message = 'Je hebt nog geen diensten gegenereerd. Klik op "Start videogesprek" of "Start samen schrijven" om te beginnen!';
      dienstenLijst.innerHTML = `<p class="empty-state">${message}</p>`;
      if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
      if (exportHistoryBtn) exportHistoryBtn.style.display = 'none';
      if (importHistoryBtn) importHistoryBtn.style.display = 'inline-block'; // Always show import
      return;
    }

    // Show all action buttons when there's history
    if (clearHistoryBtn) clearHistoryBtn.style.display = 'inline-block';
    if (exportHistoryBtn) exportHistoryBtn.style.display = 'inline-block';
    if (importHistoryBtn) importHistoryBtn.style.display = 'inline-block';

    if (filteredUrls.length === 0) {
      const message = `Je hebt nog geen diensten uit de categorie "${this.getCategoryDisplayName(activeCategory)}" gegenereerd.`;
      dienstenLijst.innerHTML = `<p class="empty-state">${message}</p>`;
      return;
    }

    // Group by date
    const groupedByDate = this.groupByDate(filteredUrls);

    dienstenLijst.innerHTML = '';

    Object.keys(groupedByDate).forEach(dateKey => {
      const dateHeader = document.createElement('h3');
      dateHeader.className = 'date-header';
      dateHeader.textContent = this.formatDateHeader(dateKey);
      dienstenLijst.appendChild(dateHeader);

      const dateGroup = document.createElement('div');
      dateGroup.className = 'date-group';

      groupedByDate[dateKey].forEach(entry => {
        const serviceCard = this.createHistoryServiceCard(entry);
        dateGroup.appendChild(serviceCard);
      });

      dienstenLijst.appendChild(dateGroup);
    });
  }

  // Create a service card for history view (same style as service cards)
  createHistoryServiceCard(entry) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'history-card-wrapper';

    const card = document.createElement('a');
    card.href = entry.url;
    card.className = 'service-card history-variant';
    card.target = '_blank';

    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'favicon-container';

    const serviceFavicon = document.createElement('img');
    serviceFavicon.src = entry.service.favicon;
    serviceFavicon.alt = entry.service.naam;
    serviceFavicon.className = 'service-favicon';
    faviconContainer.appendChild(serviceFavicon);

    if (entry.service.aanbieder_favicon) {
      const providerFavicon = document.createElement('img');
      providerFavicon.src = entry.service.aanbieder_favicon;
      providerFavicon.alt = entry.service.aanbieder;
      providerFavicon.className = 'provider-favicon';
      faviconContainer.appendChild(providerFavicon);
    }

    const serviceInfo = document.createElement('div');
    serviceInfo.className = 'service-info';

    const title = document.createElement('h4');
    title.textContent = entry.service.naam;

    const description = document.createElement('p');
    description.className = 'service-description';
    description.textContent = entry.service.beschrijving || '';

    // Generated URL display (replacing description for history)
    const urlDisplay = document.createElement('p');
    urlDisplay.className = 'history-url';
    urlDisplay.textContent = this.truncateUrl(entry.url);
    urlDisplay.title = entry.url; // Full URL on hover

    // Timestamp display
    const timestampDisplay = document.createElement('p');
    timestampDisplay.className = 'history-timestamp';
    timestampDisplay.textContent = this.formatTimestamp(entry.timestamp);

    const serviceMeta = document.createElement('div');
    serviceMeta.className = 'service-meta';

    // First row: category and provider info
    const metaRow = document.createElement('div');
    metaRow.className = 'service-meta-row';

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = entry.service.categorie;

    const providerInfo = document.createElement('div');
    providerInfo.className = 'provider-info';

    const euFlag = document.createElement('span');
    if (entry.service.eu_hosting) {
      euFlag.className = 'eu-flag';
      euFlag.textContent = '🇪🇺';
    } else {
      euFlag.className = 'non-eu-flag';
      euFlag.title = 'Niet in EU gehost';
      euFlag.innerHTML = '<span class="eu-flag-base">🇪🇺</span><span class="prohibited-symbol">✘</span>';
    }

    const providerName = document.createElement('span');
    providerName.className = 'provider-name';
    providerName.textContent = entry.service.aanbieder || '';

    providerInfo.appendChild(euFlag);
    providerInfo.appendChild(providerName);

    metaRow.appendChild(categoryBadge);
    metaRow.appendChild(providerInfo);
    serviceMeta.appendChild(metaRow);

    // Second row: rating display (if available)
    if (entry.rating) {
      const ratingDisplay = document.createElement('div');
      ratingDisplay.className = 'service-rating-history';

      const stars = document.createElement('span');
      stars.className = 'rating-stars';
      stars.textContent = '★'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating);

      const ratingText = document.createElement('span');
      ratingText.className = 'rating-text';
      ratingText.textContent = `${entry.rating}/5`;

      ratingDisplay.appendChild(stars);
      ratingDisplay.appendChild(ratingText);
      serviceMeta.appendChild(ratingDisplay);
    }

    serviceInfo.appendChild(title);
    serviceInfo.appendChild(timestampDisplay);
    serviceInfo.appendChild(urlDisplay);
    serviceInfo.appendChild(serviceMeta);

    card.appendChild(faviconContainer);
    card.appendChild(serviceInfo);

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-history-item';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Verwijder deze entry';
    deleteBtn.setAttribute('aria-label', 'Verwijder');

    // Prevent navigation when clicking delete button
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (confirm(`Weet je zeker dat je "${entry.service.naam}" wilt verwijderen uit de geschiedenis?`)) {
        this.deleteEntry(entry.sessionId);
        // Refresh the view
        const activeCategory = this.getCurrentActiveCategory();
        this.loadStoredServices(activeCategory);
      }
    });

    cardWrapper.appendChild(card);
    cardWrapper.appendChild(deleteBtn);

    return cardWrapper;
  }

  // Get current active category from the UI
  getCurrentActiveCategory() {
    const activeFilter = document.querySelector('.category-filters .filter-btn.active');
    return activeFilter ? activeFilter.dataset.category : null;
  }

  // Truncate URL for display
  truncateUrl(url) {
    if (url.length <= 50) return url;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname + urlObj.search;

      if (path.length <= 30) {
        return domain + path;
      } else {
        return domain + path.substring(0, 27) + '...';
      }
    } catch (e) {
      // Fallback for invalid URLs
      return url.length > 50 ? url.substring(0, 47) + '...' : url;
    }
  }

  // Group entries by date
  groupByDate(entries) {
    const grouped = {};

    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const dateKey = date.toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });

    return grouped;
  }

  // Format date header
  formatDateHeader(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Vandaag';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gisteren';
    } else {
      return date.toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // Format timestamp
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Setup clear history button handler
  setupClearHistoryHandler() {
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je alle geschiedenis wilt wissen?')) {
          this.clearStoredUrls();
          this.loadStoredServices();
        }
      });
    }
  }

  // Setup export/import handlers
  setupExportImportHandlers() {
    const exportHistoryBtn = document.getElementById('export-history-btn');
    const importHistoryBtn = document.getElementById('import-history-btn');
    const importFileInput = document.getElementById('import-file-input');

    if (exportHistoryBtn) {
      exportHistoryBtn.addEventListener('click', () => {
        this.exportData();
      });
    }

    if (importHistoryBtn && importFileInput) {
      importHistoryBtn.addEventListener('click', () => {
        importFileInput.click();
      });

      importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const result = await this.importData(file);
          alert(`Import geslaagd!\n\n${result.imported} nieuwe items toegevoegd\n${result.updated} items bijgewerkt\nTotaal: ${result.total} items`);

          // Refresh the view
          const activeCategory = this.getCurrentActiveCategory();
          this.loadStoredServices(activeCategory);
        } catch (error) {
          alert(`Import mislukt: ${error.message}`);
          console.error('Import error:', error);
        } finally {
          // Reset file input
          importFileInput.value = '';
        }
      });
    }
  }

  // Handle action button clicks (for quick actions)
  handleActionButtonClick(category) {
    // This would be called by the main app when action buttons are clicked
    // The main app would use ServicesManager to get a random service
    // and then use this HistoryManager to store the generated URL
  }

  // Utility function to slugify category names (same as ServicesManager)
  slugify(text) {
    return text.toLowerCase().replace(/\s+/g, '-');
  }

  // Get display name for category
  getCategoryDisplayName(categorySlug) {
    // Simple reverse mapping - capitalize and replace dashes with spaces
    return categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Log stored data for debugging
  logStoredUrls() {
    const storedUrls = this.getStoredUrls();
    console.log('Stored URLs:', storedUrls);
  }
}