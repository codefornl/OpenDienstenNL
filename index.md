---
layout: default
title: OpenDiensten
---

<div class="app-container">
  <aside class="sidebar">
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