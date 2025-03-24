---
layout: default
title: OpenDiensten
---

<div class="desktop">
  <header>
    <h1>Open Diensten</h1>
    <h2>Open & gratis publiek toegankelijke SaaS omgevingen voor community organisatie</h2>
  </header>
  
  <main class="icons-container">
    {% assign diensten = site.data.diensten | where: 'status', 'live' %}
    {% for dienst in diensten %}
      <a href="{{ dienst.url }}" class="icon" target="_blank">
        <img src="{{ dienst.favicon }}" alt="{{ dienst.naam }}">
        <span>{{ dienst.naam }}</span>
      </a>
    {% endfor %}
  </main>
</div>