# Interactieve kaart met Google Drive data

Dit is een eenvoudig voorbeeld van een websitekaart met Leaflet. De data staat in een CSV-bestand dat je vanuit Google Sheets of Google Drive kunt publiceren.

## Standalone testen

Je kunt `index.html` direct openen in een browser. De demo gebruikt dan ingebouwde voorbeelddata.

Wil je toch via een lokale server testen, dan kan dat ook:

```bash
python3 -m http.server 8080
```

Open daarna:

```text
http://127.0.0.1:8080/
```

De demo gebruikt standaard `data/initiatieven.csv`.

Omdat Leaflet via een CDN wordt geladen, heb je internet nodig om de kaartbibliotheek en de rustige CARTO-kaartlaag te zien. Voor `.xlsx`-bestanden gebruikt de demo SheetJS via een CDN. CSV-bestanden kunnen zonder die Excel-bibliotheek gelezen worden.

De kaartlaag staat in `app.js`:

```js
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", ...)
```

Wil je juist de gedetailleerdere standaardkaart, dan kun je die vervangen door:

```js
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", ...)
```

## Lokale Excel- of CSV-data

Gebruik de knop `Lokaal databestand` om een `.xlsx`, `.xls` of `.csv` te kiezen. Het bestand blijft lokaal in de browser; er wordt niets geüpload.

Het eerste tabblad van het Excel-bestand moet deze kolommen bevatten:

```text
titel, omschrijving, provincie, plaats, thema, lat, lng, url, zichtbaar
```

`zichtbaar` mag `ja` of `nee` zijn. Rijen met `nee` worden niet getoond.

De markerkleur wordt automatisch bepaald op basis van de waarde in de kolom `thema`. De standaardkleuren staan in `app.js` bij `THEME_COLORS`.

## Delen met iemand anders

Je kunt deze map als zipbestand delen. De ontvanger kan `index.html` direct openen.

Eventueel kan de ontvanger de demo ook lokaal draaien met:

```bash
python3 -m http.server 8080
```

en daarna openen op:

```text
http://127.0.0.1:8080/
```

Voor een klikbare online demo kun je dezelfde bestanden ook uploaden naar bijvoorbeeld GitHub Pages, Netlify, Vercel of een gewone webserver. Let erop dat de Google Sheet als CSV publiek gepubliceerd moet zijn als je live data uit Google Drive wilt gebruiken.

## Wit vlak in plaats van kaart

Als filters en legenda zichtbaar zijn maar de kaart wit blijft, draait de demo wel, maar laden de kaarttegels waarschijnlijk niet. Mogelijke oorzaken:

- `basemaps.cartocdn.com` wordt geblokkeerd door browser, adblocker, privacyfilter of bedrijfsnetwerk.
- De browser blokkeert externe bronnen vanaf een lokaal geopend `file://` bestand.
- Een CDN of tile-server is tijdelijk niet bereikbaar.

Deze demo probeert automatisch terug te vallen van CARTO naar de standaard OpenStreetMap-tegels. Blijft de kaart toch wit, open dan de demo via een simpele lokale server of host hem op GitHub Pages/Netlify.

## Google Sheet als backend

1. Maak een Google Sheet met deze kolommen:

   ```text
   titel, omschrijving, provincie, plaats, thema, lat, lng, url, zichtbaar
   ```

2. Vul per initiatief een rij in.

   `zichtbaar` mag `ja` of `nee` zijn. Rijen met `nee` worden niet getoond.

3. Publiceer de sheet:

   `Bestand` -> `Delen` -> `Publiceren op internet` -> kies het juiste tabblad -> kies `Door komma's gescheiden waarden (.csv)`.

4. Kopieer de CSV-link.

5. Zet die link in `app.js` bij:

   ```js
   googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
   ```

Je kunt ook tijdelijk testen zonder code te wijzigen:

```text
index.html?data=https://docs.google.com/spreadsheets/d/e/.../pub?output=csv
```

## Coördinaten invullen

Leaflet heeft latitude en longitude nodig. Voor beheerders zijn er drie gangbare opties:

- Handmatig invullen via Google Maps of OpenStreetMap.
- In de beheeromgeving een kaartprikker gebruiken.
- Automatisch geocoden vanaf een adres via een aparte serverfunctie.

Voor productie zou ik niet vanuit de browser bulk-geocoding doen. Dat is kwetsbaar voor quota, privacy en misbruik.

## Productie-opmerkingen

- Gebruik hover plus klik/tap; hover werkt niet op mobiel.
- Ontsnap HTML in pop-ups. Dit voorbeeld doet dat in `escapeHtml`.
- Publiceer alleen data die openbaar mag zijn. Een gepubliceerde Google Sheet is publiek leesbaar.
- Als de dataset groter of gevoeliger wordt, stap dan over op een echte CMS/API-laag zoals Directus, Strapi, WordPress, Supabase of een eigen backend.
