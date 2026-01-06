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
      <p>{{ site.description }} (<a href="#" onclick="document.getElementById('credits-modal').style.display='block'">credits</a>)</p>
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
        <div class="geschiedenis-actions">
          <button id="export-history-btn" class="history-action-btn" style="display: none;">Exporteer</button>
          <button id="import-history-btn" class="history-action-btn" style="display: none;">Importeer</button>
          <input type="file" id="import-file-input" accept=".json" style="display: none;">
          <button id="clear-history-btn" class="history-action-btn danger" style="display: none;">Wis alles</button>
        </div>
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

    <div class="services-grid" id="services-grid">
      <!-- Services will be rendered here by JavaScript -->
    </div>
  </main>
</div>

<script type="module" src="/js/opendienstenapp.js"></script>

{% include credits-modal.html %}