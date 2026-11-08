---
permalink: /over
layout: default
title: Wat is een open dienst?
description: Wat een open dienst is, waarom open source en Europese aanbieders ertoe doen, wie er achter OpenDiensten zit en hoe je meedoet.
---
<div class="app-container">
  {% include organisms/sidebar.html active="over" %}

  <main class="content-area">
    <article class="view page-content">
      {% include atoms/kicker.html text="Over OpenDiensten" hex=true %}
      <h2>Wat is een open dienst?</h2>
      <p class="page-lead">Een open dienst is een online dienst die je meteen kunt gebruiken: gratis, en zonder dat je eerst een account moet maken. Je hoeft niets te installeren of zelf te hosten. Dat maakt het vrij toegankelijke publieke ruimte, voor iedereen.</p>

      <ul class="hex-list">
        <li>{% include atoms/hex.html %}<div><strong>Gratis en zonder account</strong><p>Je kunt meteen beginnen. Wie meedoet, hoeft ook nergens in te loggen.</p></div></li>
        <li>{% include atoms/hex.html %}<div><strong>Een eigen, geheime link</strong><p>Vaak krijg je een unieke link naar je eigen gesprek of document. Wie de link heeft, doet mee; wie hem niet heeft, kan hem niet vinden. Die link deel je gewoon.</p></div></li>
        <li>{% include atoms/hex.html %}<div><strong>Bij voorkeur open source</strong><p>De meeste open diensten draaien op open source software, zoals Jitsi Meet of Etherpad. Stopt een aanbieder, of bevalt hij niet, dan stap je over naar een andere aanbieder met dezelfde software. Of je host het zelf. Zo blijf je onafhankelijk.</p></div></li>
        <li>{% include atoms/hex.html %}<div><strong>Altijd een aanbieder</strong><p>Iemand host de dienst: een stichting, een coöperatie, een bedrijf. Dezelfde software wordt vaak door meerdere aanbieders aangeboden. Op OpenDiensten zie je bij elke dienst wie dat is.</p></div></li>
        <li>{% include atoms/hex.html %}<div><strong>Europees of niet</strong><p>Is de aanbieder een Europese partij, dan vallen je gegevens onder Europese wetgeving. Dat zie je aan het label <span class="tag tag-goed">europees</span>; <span class="tag tag-niet">niet europees</span> betekent een aanbieder buiten Europa. Zo staan er bij elke dienst labels: open source of closed source, europees of niet, open dienst of login vereist, en voor iedereen of een beperkte doelgroep.</p></div></li>
      </ul>

      <h3>Wat gebeurt er als je op Start klikt?</h3>
      <p>We kiezen een open dienst voor je, en maken daar een eigen gespreksruimte of document. Dat kiezen is eenvoudig: op basis van jouw eigen sterren, en verder willekeurig. Diensten die jij goed beoordeelt, komen vaker aan de beurt, maar ook nieuwe diensten krijgen een kans. Na afloop vragen we hoe het ging.</p>
      <p>We controleren de diensten niet en geven geen garantie: niet dat ze werken, niet dat ze veilig zijn, en niet dat alles op deze site klopt. Twijfel je, kijk dan bij de aanbieder zelf.</p>

      <h3 id="privacy">Wat we bewaren</h3>
      <p>Er gaat niets naar een server: alles blijft in je eigen browser. En ook daar bewaren we standaard zo weinig mogelijk.</p>
      <ul class="hex-list">
        <li>{% include atoms/hex.html %}<div><strong>Geschiedenis staat standaard uit</strong><p>De links naar je gesprekken en documenten zijn geheim: wie ze heeft, kan meedoen. Daarom bewaren we ze niet, tenzij je zelf <em>Geschiedenis bijhouden</em> aanzet. Dat doe je in de zijbalk.</p></div></li>
        <li>{% include atoms/hex.html %}<div><strong>Met geschiedenis</strong><p>Dan bewaren we op dit apparaat welke dienst je startte, de link en wanneer. Zo vind je een gesprek of document terug. Zet je het weer uit, dan wissen we die geschiedenis.</p></div></li>
        <li>{% include atoms/hex.html %}<div><strong>Beoordelingen</strong><p>Je beoordelingen tellen altijd mee, zodat goede diensten vaker aan de beurt komen. Zonder geschiedenis bewaren we alleen een telling per dienst, zonder links en zonder tijden.</p></div></li>
      </ul>

      <h3>Wie zit erachter?</h3>
      <p>OpenDiensten is een initiatief van <a href="https://www.apitecture.nl">Apitecture</a>. OpenDiensten heeft geen relatie met de aanbieders die erop staan.</p>
      {% include molecules/partners.html %}

      <h3>Open data</h3>
      <p>Alle gegevens over diensten, software, aanbieders en profielen zijn open data onder <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.nl">CC0</a>: je mag ze vrij gebruiken, zonder bronvermelding. Ze kloppen misschien niet allemaal. Zie <a href="/ontwikkelaars">Voor ontwikkelaars</a>.</p>

      <h3>Meedoen</h3>
      <p>Ken je een open dienst die hier hoort, klopt er iets niet, of wil je meebouwen? Mail naar <a href="mailto:{{ site.email }}">{{ site.email }}</a> of maak een issue aan op <a href="{{ site.github.repository_url | default: 'https://github.com/Apitecture/OpenDienstenNL' }}">GitHub</a>. Bespreek een idee eerst even in een issue voordat je begint met code.</p>

      <h3 id="colofon">Colofon</h3>
      <p>Deze website wordt aangeboden door {{ site.uitgever.naam }}, {{ site.uitgever.adres }}, {{ site.uitgever.postcode }} {{ site.uitgever.plaats }}. KvK {{ site.uitgever.kvk }}. E-mail: <a href="mailto:{{ site.uitgever.email }}">{{ site.uitgever.email }}</a>.</p>

      <h3>Met dank aan</h3>
      <dl class="credits">
        <dt>Concept en ontwerp</dt>
        <dd><a href="https://johangroenen.nl/">Johan Groenen</a></dd>
        <dt>Bijdragen</dt>
        <dd><a href="https://johangroenen.nl/">Johan Groenen</a>, <a href="https://tiltshift.nl/">Tiltshift</a></dd>
        <dt>Inspiratie</dt>
        <dd>
          <a href="https://switching.software/">Switching.Software</a>,
          <a href="https://alt.framasoft.org/en/">Alternatives to Framasoft</a>,
          <a href="https://european-alternatives.eu/">European Alternatives</a>,
          <a href="https://civictech.guide/">Civic Tech Guide</a>,
          <a href="https://oecd-opsi.org/toolkits/ogp-toolbox/">OGP Toolbox</a>,
          <a href="https://github.com/GeiserX/awesome-europe">Awesome Europe</a> en
          <a href="https://foss-privacy-bigtech.nl/">FOSS, Privacy en minder Big Tech</a>
        </dd>
      </dl>
    </article>

    {% include organisms/site-footer.html %}
  </main>
</div>
