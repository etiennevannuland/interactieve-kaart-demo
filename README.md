# Interactieve kaartdemo

Deze demo toont initiatieven in Friesland, Groningen en Drenthe op een interactieve Leaflet-kaart.

De data komt uit `data/initiatieven.csv`. De kaart toont markers, filters voor provincie en thema, pop-ups met meer informatie en een legenda met themakleuren.

## Demo openen

Open `index.html` in een browser.

Internet is nodig voor Leaflet en de kaarttegels. De demo gebruikt CARTO en valt automatisch terug op OpenStreetMap als CARTO niet laadt.

## Data aanpassen

Pas `data/initiatieven.csv` aan met deze kolommen:

`titel, omschrijving, provincie, plaats, thema, lat, lng, url, zichtbaar`

`zichtbaar` mag `ja` of `nee` zijn.

## Themakleuren

De marker-kleur komt uit de kolom `thema`. Kleuren staan in `app.js` bij `THEME_COLORS`.

## Wit vlak in plaats van kaart

Als filters en legenda zichtbaar zijn maar de kaart wit blijft, worden kaarttegels waarschijnlijk geblokkeerd. Test:

- `https://basemaps.cartocdn.com/light_all/8/132/83.png`
- `https://tile.openstreetmap.org/8/132/83.png`

