---
permalink: /profielen/
layout: default
title: Profielen
description: Welke diensten gebruiken andere organisaties, en hoeveel daarvan zijn open diensten? Een wegwijzer voor leden en de weg naar digitale autonomie.
---
<div class="app-container">
  {% include organisms/sidebar.html active="profielen" %}

  <main class="content-area">
    <section class="view" aria-labelledby="profielen-title">
      <div class="page-content">
        {% include atoms/kicker.html text="Profielen" hex=true %}
        <h2 id="profielen-title">Welke diensten kiezen anderen?</h2>
        <p class="page-lead">Een profiel laat zien welke diensten een organisatie gebruikt om te videobellen, samen te schrijven of te plannen, en hoeveel daarvan open diensten zijn. Voor de mensen in die organisatie is het een wegwijzer: waarvoor moet ik waar zijn? Voor anderen is het inspiratie. En samen laten de profielen zien hoe ver we zijn op weg naar digitale autonomie.</p>
      </div>

      <div class="profile-grid">
        {%- assign profielen = "" | split: "" -%}
        {%- for r in site.data.profielregister.profielen -%}
          {%- unless r.id == site.data.profielregister.standaard -%}{%- assign profielen = profielen | push: site.data.profielen[r.id] -%}{%- endunless -%}
        {%- endfor -%}
        {%- assign profielen = profielen | sort: "naam" -%}
        {%- for profiel in profielen %}
        {% include organisms/profile-card.html profiel=profiel.id %}
        {%- endfor %}
      </div>

      <div class="profile-add">
        <h3>Ook een profiel voor je organisatie?</h3>
        <p>Laat zien wat jullie gebruiken en hoe ver je bent met digitale autonomie. Wij zetten het erop, of je publiceert het zelf op je eigen website.</p>
        {% include atoms/button.html text="Profiel toevoegen" href="/profielen/toevoegen" variant="secondary" %}
      </div>
    </section>

    {% include organisms/site-footer.html %}
  </main>
</div>
