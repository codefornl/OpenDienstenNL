# OpenDiensten

Een overzicht van open diensten voor community-organisatie: online diensten die iedereen gratis en zonder verplichte login kan gebruiken. Te zien op [opendiensten.nl](https://opendiensten.nl).

OpenDiensten is een initiatief van [Apitecture](https://www.apitecture.nl). De gegevens zijn CC0: vrij te gebruiken, zonder garantie dat ze kloppen.

## Productvisie

Er zijn genoeg overzichten van open source tools voor community-organisatie. Maar de meeste mensen kunnen die tools niet zelf ergens hosten. Tegelijk zijn er organisaties die open source software gratis aanbieden als dienst, vaak zonder dat je een account nodig hebt: je krijgt een unieke link naar je eigen gesprek of document, en die deel je. Dat is de facto vrij toegankelijke publieke ruimte, die iedereen kan gebruiken zonder technische drempels. Wij noemen dat **open diensten**.

OpenDiensten brengt die ruimtes in beeld. Per open dienst laten we zien:

- **welke software** eronder zit; bij voorkeur open source of open standaarden, voor digitale autonomie en onafhankelijkheid van leveranciers;
- **wie de aanbieder is**, en of dat een Europese partij is, voor soevereiniteit en privacy;
- **hoe goed** de dienst werkt, op basis van beoordelingen van gebruikers.

Daarnaast kun je met één klik meteen beginnen: "Start videogesprek" of "Start samen schrijven" kiest een goed beoordeelde open dienst en opent een nieuw gesprek of document. Na afloop beoordeel je de dienst, zodat de beste diensten vaker gekozen worden.

Zo willen we een startpagina zijn voor wie goede publieke tech zoekt voor een vereniging, buurt of initiatief.

Later willen we ook laten zien of een aanbieder meeinvesteert in de software die hij aanbiedt, als indicator voor duurzaamheid.

De begrippen, de werking van de startknoppen en de plannen voor een API staan in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

<img src="assets/images/screenshot.png" alt="Screenshot van OpenDiensten" style="width: 90%; max-width: 150px; margin: auto">

## Zelf draaien

De site is gemaakt met Jekyll en draait op GitHub Pages.

```bash
jekyll serve
```

Open daarna http://localhost:4000. Het design system staat op `/design-system/`.

## Bijdragen

Een open dienst toevoegen of aanpassen doe je in [`_data/profielen/open-diensten.json`](_data/profielen/open-diensten.json); controleer daarna met `ruby scripts/profielen.rb controleer`. Een organisatie kan ook een eigen profiel publiceren, volgens [het schema](_data/schemas/profiel.json); zie [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Kijk in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) hoe je kunt bijdragen.

Zie ook [european-alternatives.eu](https://european-alternatives.eu/).

## Licentie

De code valt onder de [EUPL-1.2](LICENSE.md). De gegevens in [`_data/`](_data/) zijn [CC0](_data/LICENSE.md): vrij te gebruiken, zonder garantie dat ze kloppen.
