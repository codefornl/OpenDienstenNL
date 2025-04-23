---
layout: default
title: OpenDiensten
---

<div class="desktop">
  <header>
    <h1>Open Diensten</h1>
    <h2>Open & gratis publiek toegankelijke SaaS omgevingen voor community organisatie</h2>
    <div class="category-filters"></div>
  </header>
  
  <main class="icons-container">
    {% assign diensten = site.data.diensten | where: 'status', 'live' %}
    {% for dienst in diensten %}
        <a href="{{ dienst.url }}" class="icon" target="_blank" data-category="{{ dienst.categorie | slugify }}">
            <!-- <img src="{{ dienst.favicon }}" alt="{{ dienst.naam }}"> -->
            <div class="favicon-container">
                <img src="{{ dienst.favicon }}" alt="{{ dienst.naam }}" class="service-favicon">
                {% if dienst.aanbieder_favicon %}
                <img src="{{ dienst.aanbieder_favicon }}" alt="{{ dienst.aanbieder }}" class="provider-favicon">
                {% endif %}
            </div>
            <span>{{ dienst.naam }}</span>
            <div class="icon-label">{{ dienst.categorie }}</div>
            <div class="by">aangeboden door</div>
            <div class="provider">
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
        </a>
    {% endfor %}
  </main>
</div>

<script>
  var categories = {};
  document.querySelectorAll('[data-category]').forEach(function(el) {
    var category = el.getAttribute('data-category');
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(el);
  });
  for (var category in categories) {
    var a = document.createElement('a');
    a.href = '#' + category;
    a.innerText = category;
    a.classList.add('icon-label');
    a.addEventListener('click', function(e) {
      var selectedCategory = e.target.getAttribute('href').substring(1);
      document.querySelectorAll('.icon').forEach(function(icon) {
        icon.style.display = 'none';
      });
      categories[selectedCategory].forEach(function(icon) {
        icon.style.display = 'flex';
      });
    });
    document.querySelector('.category-filters').appendChild(a);
  }
</script>