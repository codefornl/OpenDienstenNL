---
layout: default
title: OpenDiensten
---

<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-logo">
      <img src="https://codefor.nl/img/Logo-orange-01.png" alt="Code for NL" class="codefor-logo">
    </div>
    <header class="sidebar-header">
      <h1>Open Diensten</h1>
      <h2>Open & gratis publiek toegankelijke SaaS omgevingen voor community organisatie</h2>
    </header>
    
    <nav class="filter-menu">
      <h3>Categorieën</h3>
      <div class="category-filters"></div>
    </nav>
  </aside>
  
  <main class="content-area">
    <div class="quick-actions">
      <a href="/videobellen" class="action-button random-button" target="_blank">Start videogesprek</a>
      <a href="/samen-schrijven" class="action-button random-button" target="_blank">Start samen schrijven</a>
    </div>
    
    <div id="rating-popover" class="rating-popover" style="display: none;">
      <div class="popover-content">
        <h3>Hoe was de kwaliteit?</h3>
        <div class="star-rating">
          <span class="star" data-rating="1">☆</span>
          <span class="star" data-rating="2">☆</span>
          <span class="star" data-rating="3">☆</span>
          <span class="star" data-rating="4">☆</span>
          <span class="star" data-rating="5">☆</span>
        </div>
        <button class="close-popover">×</button>
      </div>
    </div>
    <div class="services-grid">
      {% assign diensten = site.data.diensten | where: 'status', 'live' %}
      {% for dienst in diensten %}
          <a href="{{ dienst.url }}" class="service-card" target="_blank" data-category="{{ dienst.categorie | slugify }}">
              <div class="favicon-container">
                  <img src="{{ dienst.favicon }}" alt="{{ dienst.naam }}" class="service-favicon">
                  {% if dienst.aanbieder_favicon %}
                  <img src="{{ dienst.aanbieder_favicon }}" alt="{{ dienst.aanbieder }}" class="provider-favicon">
                  {% endif %}
              </div>
              <div class="service-info">
                <h4>{{ dienst.naam }}</h4>
                <p class="service-description">{{ dienst.beschrijving }}</p>
                <div class="service-meta">
                  <span class="category-badge">{{ dienst.categorie }}</span>
                  <div class="provider-info">
                    {% if dienst.eu_hosting %}
                        <span class="eu-flag">🇪🇺</span>
                    {% else %}
                        <span class="non-eu-flag" title="Niet in EU gehost">
                        <span class="eu-flag-base">🇪🇺</span>
                        <span class="prohibited-symbol">✘</span>
                        </span>
                    {% endif %}
                    <span class="provider-name">{{ dienst.aanbieder }}</span>
                  </div>
                </div>
              </div>
          </a>
      {% endfor %}
    </div>
  </main>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Rating popover functionality
    var popover = document.getElementById('rating-popover');
    var randomButtons = document.querySelectorAll('.random-button');
    var stars = document.querySelectorAll('.star');
    var closeBtn = document.querySelector('.close-popover');
    
    // Show popover when random button is clicked
    randomButtons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        // Show popover
        popover.style.display = 'flex';
        
        // Store which service was clicked
        popover.dataset.service = e.target.textContent;
      });
    });
    
    // Handle star clicks
    stars.forEach(function(star, index) {
      star.addEventListener('click', function() {
        var rating = parseInt(star.dataset.rating);
        
        // Fill stars up to clicked rating
        stars.forEach(function(s, i) {
          if (i < rating) {
            s.textContent = '★';
            s.classList.add('filled');
          } else {
            s.textContent = '☆';
            s.classList.remove('filled');
          }
        });
        
        // Store rating (could be sent to an API or stored locally)
        console.log('Service:', popover.dataset.service, 'Rating:', rating);
        
        // Hide popover after rating
        setTimeout(function() {
          popover.style.display = 'none';
          // Reset stars
          stars.forEach(function(s) {
            s.textContent = '☆';
            s.classList.remove('filled');
          });
        }, 1000);
      });
      
      // Hover effect
      star.addEventListener('mouseenter', function() {
        var hoverRating = parseInt(star.dataset.rating);
        stars.forEach(function(s, i) {
          if (i < hoverRating) {
            s.classList.add('hover');
          } else {
            s.classList.remove('hover');
          }
        });
      });
    });
    
    // Reset hover on mouse leave
    document.querySelector('.star-rating').addEventListener('mouseleave', function() {
      stars.forEach(function(s) {
        s.classList.remove('hover');
      });
    });
    
    // Close button
    closeBtn.addEventListener('click', function() {
      popover.style.display = 'none';
      // Reset stars
      stars.forEach(function(s) {
        s.textContent = '☆';
        s.classList.remove('filled');
      });
    });
    
    // Close on background click
    popover.addEventListener('click', function(e) {
      if (e.target === popover) {
        popover.style.display = 'none';
        // Reset stars
        stars.forEach(function(s) {
          s.textContent = '☆';
          s.classList.remove('filled');
        });
      }
    });
    
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
    
    // Add "All" filter
    var allButton = document.createElement('button');
    allButton.innerText = 'Alle';
    allButton.classList.add('filter-button', 'active');
    allButton.addEventListener('click', function() {
      document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      allServices.forEach(function(service) {
        service.style.display = 'flex';
      });
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
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        allServices.forEach(function(service) {
          service.style.display = 'none';
        });
        categories[selectedCategory].forEach(function(service) {
          service.style.display = 'flex';
        });
      });
      document.querySelector('.category-filters').appendChild(button);
    }
  });
</script>