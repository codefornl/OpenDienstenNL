# Architectuur

## Concepten

Diensten: Open Diensten zijn SaaS-omgevingen die gratis en publiek toegankelijk zijn. Ze worden gehost door verschillende aanbieders, maar zijn geselecteerd op basis van hun openheid, gebruiksvriendelijkheid en geschiktheid voor community-organisatie.

## Overzicht

Op de overzichtspagina worden alle beschikbare Open Diensten weergegeven in een overzichtelijke grid. Elke dienst wordt gepresenteerd met een favicon, naam, korte beschrijving, categorie en aanbieder, met een indicator of de aanbieder EU is of niet. Gebruikers kunnen snel toegang krijgen tot de diensten door op de kaart te klikken.

## "Doe maar een dienst"

Bovenin staan twee prominente knoppen: "Start videogesprek" en "Start samen schrijven" (later meer). Deze knoppen leiden gebruikers direct naar een willekeurige dienst binnen de respectieve categorie, waardoor ze snel kunnen beginnen zonder door de lijst te hoeven bladeren.

De manier waarop dit werkt is als volgt:
- Wanneer een gebruiker op een van de knoppen klikt wordt deze doorgestuurd naar de betreffende redirect pagina (bijv. `/videobellen`).
- De redirect pagina kiest willekeurig een dienst uit de betreffende categorie (bijv. `videobellen`) uit de dataset van Open Diensten en maakt daarvoor een unieke dienst URL aan (bijv. `https://jitsi.voorbeeld.com/vergadering123`) volgens de instructies die bij die dienst horen (bijv. "voeg een willekeurige vergadernaam toe aan de basis URL").
- De gebruiker wordt vervolgens doorgestuurd naar de URL van de gekozen dienst.

## Geschiedenis

Bij het aanmaken van een unieke dienst URL wordt deze URL samen met de naam van de dienst, de categorie en een timestamp opgeslagen in de lokale opslag van de browser. Dit stelt gebruikers in staat om hun gegenereerde diensten te bekijken in het "Geschiedenis" gedeelte van de pagina.
- De geschiedenis is alleen zichtbaar voor de gebruiker die de diensten heeft gegenereerd en wordt niet gedeeld met anderen.
- De geschiedenis wordt bewaard in de browser, zodat deze beschikbaar blijft bij het herladen van de pagina of bij een volgend bezoek.
- Gebruikers kunnen hun geschiedenis wissen via een knop in het geschiedenisgedeelte.
- Elke gegenereerde dienst in de geschiedenis toont de naam van de dienst, de categorie, de datum en tijd van creatie, en een link om direct naar de dienst te gaan.

## Rating

Bij het drukken op een van de "Doe maar een dienst" knoppen wordt direct een rating popover getoond (voor als de gebruiker terugkomt van de dienst die in een nieuw tabblad is geopend). In deze popover kan de gebruiker een sterwaardering geven van 1 tot 5 sterren voor de kwaliteit van de dienst die ze zojuist hebben gebruikt.
- Om deze rating aan de dienst te koppelen, wordt een unieke ratingID gegenereerd en meegegeven aan de redirect pagina.
- De redirect pagina neemt deze ratingID mee in de lokale opslag samen met de gegenereerde dienst URL.

In het dienstenoverzicht worden de gemiddelde waardering over alle beoordelingen van een bepaalde dienst getoond met behulp van (halve) stericonen.
- De gemiddelde waardering wordt berekend door alle individuele beoordelingen van die dienst op te halen uit de database en het gemiddelde te berekenen.