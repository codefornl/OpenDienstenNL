---
layout: default
title: OpenDiensten
---

<div class="app-container">
  <aside class="sidebar">
    <header class="sidebar-header">
      <h1><img src="./open-diensten-title-logo.svg" alt="OpenDiensten" style="width: 80%; margin-top: 20px;"></h1>
    </header>
    <div class="sidebar-logo">
      <img src="https://codefor.nl/img/Logo-orange-01.png" alt="Code for NL" class="codefor-logo">
    </div>
    <div>
      <p>Open & gratis publiek toegankelijke SaaS omgevingen voor community organisatie</p>
      {% include github-logo.html %}
      <nav class="main-nav">
        <ul>
          <li><a href="/" class="nav-link active">Overzicht</a></li>
          <li><a href="#" class="nav-link" id="mijn-diensten-link">Geschiedenis</a></li>
        </ul>
      </nav>
    </div>
    <nav class="filter-menu">
      <h3>Categorieën</h3>
      <div class="category-filters"></div>
    </nav>
  </aside>
  
  <main class="content-area">
    <div class="quick-actions">
      <a href="/start-videogesprek" class="action-button random-button" target="_blank">Start videogesprek</a>
      <a href="/start-samen-schrijven" class="action-button random-button" target="_blank">Start samen schrijven</a>
    </div>

    <div id="geschiedenis-view" class="geschiedenis-view" style="display: none;">
      <div class="geschiedenis-header">
        <h2>Geschiedenis</h2>
        <button id="clear-history-btn" class="clear-history-btn" style="display: none;">Wis geschiedenis</button>
      </div>
      <div id="diensten-lijst" class="diensten-lijst">
        <p class="empty-state">Je hebt nog geen diensten gegenereerd. Klik op "Start videogesprek" of "Start samen schrijven" om te beginnen!</p>
      </div>
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

<script type="module" src="/js/opendienstenapp.js"></script>