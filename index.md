---
layout: default
description: Open en gratis online diensten voor je vereniging, buurt of initiatief. Videobellen, samen schrijven, plannen en meer, bij aanbieders die je kunt vertrouwen.
---
{%- comment -%}
  Diensten: alle live diensten per categorie.
  Met ?profiel=<slug> een filter: alleen de keuze van die organisatie (js/opendienstenapp.js).
  De profielkoppen staan hier al klaar en worden zichtbaar als hun profiel actief is.
{%- endcomment -%}
<div class="app-container">
  {% include organisms/sidebar.html active="diensten" %}

  <main class="content-area">
    <section class="view" aria-label="Diensten">
      {%- for r in site.data.profielregister.profielen %}
      {%- unless r.id == site.data.profielregister.standaard %}
      <div class="profile-filter-header" data-profiel="{{ r.id }}" hidden>
        {% include organisms/profile-header.html profiel=r.id %}
      </div>
      {%- endunless %}
      {%- endfor %}

      {% include organisms/services-by-category.html %}
    </section>

    {% include organisms/site-footer.html %}
  </main>
</div>

<script type="module" src="/js/opendienstenapp.js"></script>
