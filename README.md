# Kartograph-Block

iPad-App (SwiftUI, iPadOS 17+) als digitaler Ersatz für den Eintrageblock von
**„Der Kartograph" / „Die Kartographin"** (Pegasus Spiele).
Erkundungskarten, Jahreszeiten und Monster werden weiter mit den echten Karten
am Tisch gespielt; die App ersetzt nur das Blatt Papier. Ein iPad entspricht einem
Spieler. Es gibt keinen Server.

## Worum es geht

Ein digitaler Eintrageblock für „Der Kartograph“: Jeder Spieler trägt seine
Karte auf dem iPad ein, statt mit Buntstift auf Papier. Die App rechnet die
Wertung jeder Jahreszeit selbst aus (Dekrete, Gold, Monster) und lässt sich
jederzeit rückgängig machen. Geplant ist eine Web-App im Stil des Spielblocks,
die auf jedem iPad im Browser läuft (siehe Issues).

## So soll es aussehen

Entwürfe im Kartograph-Stil, Quelle in [`docs/mockups/`](docs/mockups/).

**Spielbildschirm (Querformat)** mit geöffnetem Kompass zur Geländewahl:

![Spielbildschirm Querformat](docs/mockups/landscape.jpg)

**Formen eintragen:** Felder ziehen, Gelände im Kompass wählen, fertig.

![Ablauf Auswahlring](docs/mockups/ring.jpg)

**Hochformat** und **Wertung:**

<p>
  <img src="docs/mockups/portrait.jpg" alt="Spielbildschirm Hochformat" width="38%">
  <img src="docs/mockups/score.jpg" alt="Wertung" width="58%">
</p>

**Gold für eingekreiste Berge** wird automatisch erkannt:

![Gold für eingekreisten Berg](docs/mockups/gold.jpg)

## Loslegen

```bash
brew install xcodegen
xcodegen generate          # erzeugt KartographBlock.xcodeproj aus project.yml
open KartographBlock.xcodeproj
```

Tests der Wertungslogik:

```bash
cd KartographCore && swift test     # oder in Xcode: Cmd+U
```

Die GitHub-Action `.github/workflows/ci.yml` führt bei jedem Push die Tests aus
und baut die App für den iOS-Simulator.

### Web-App (im Aufbau, siehe #14)

Spiellogik in `src/core/`, Oberfläche in `src/ui/` (Karte als SVG, Kompass zur Geländewahl).
Jeder Push auf `main` veröffentlicht die App unter
**https://rab2385.github.io/artograph-block/** (`.github/workflows/pages.yml`).

**Auf dem iPad installieren:** Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“.
Danach startet die App im Vollbild und funktioniert auch ohne Internet. Den Spielstand
speichert Safari nur dauerhaft, wenn die App auf dem Home-Bildschirm liegt.

```bash
npm install
npm test          # Vitest
npm run dev       # lokaler Server
npm run build     # Typprüfung + Build nach dist/
```

## Projektstruktur

```
project.yml                     XcodeGen-Beschreibung des App-Targets
KartographCore/                 Swift Package: reine Spiellogik, ohne UI, testbar
  Sources/KartographCore/
    Model/
      Terrain.swift             Geländearten, vorgedruckte Felder, Cell
      Coordinate.swift          (row, column) + Nachbarn
      MapLayout.swift           Berg-/Ruinen-/Ödland-Positionen je Blockseite
      MapGrid.swift             11×11 Raster, Bemalbarkeit, paint/erase
      Season.swift              Dekrete A–D, Jahreszeiten → Dekrete
      GameState.swift           kompletter Spielstand (Codable)
      UndoHistory.swift         mehrstufiges Undo über Schnappschüsse
      GridGeometry.swift        Punkt ↔ Feld, Einrasten von Strichen
    Scoring/
      ScoringCard.swift         Protokoll für Wertungskarten
      ScoringCardID.swift       alle 16 Karten (stabile IDs)
      ScoringCardCatalog.swift  Zuordnung ID → Regel-Objekt
      ScoringEngine.swift       Jahreszeitenwertung, Monster-Minuspunkte
      Cards/
        SentinelWood.swift      ✅ 1 Punkt je Waldfeld am Rand
        PlaceholderCard.swift   ⚠️ Platzhalter für die übrigen 15 Karten
    Persistence/GameStore.swift JSON-Speicherung im Application-Support-Ordner
  Tests/KartographCoreTests/    Unit-Tests (Wertung, Raster, Undo, Geometrie)
App/                            SwiftUI-App
  KartographApp.swift
  ViewModels/GameViewModel.swift   Undo, Autospeichern, Ring-Menü-Zustand
  Views/
    GameScreen.swift            Layout: Werkzeuge links, Wertung oben, Raster Mitte
    GridBoardView.swift         Raster zeichnen + Tippen/Freihand-Eingabe
    RadialMenu.swift            Ring-Menü mit den Geländearten
    ToolbarView.swift           Zeichnen/Radierer, Zurück, Gold, Werten, Neu
    ScoreHeaderView.swift       Wertungsleiste
    ScoreSheet.swift            Übersicht pro Jahreszeit + Karten
    SetupView.swift             Blockseite + Wertungskarten A–D wählen
```

## Datenmodell

| Typ | Inhalt |
|---|---|
| `Terrain` | `forest`, `village`, `water`, `farm`, `monster` |
| `PrintedFeature` | `free`, `mountain`, `ruins`, `wasteland` (vorgedruckt, unveränderlich) |
| `Cell` | `printed` + optional `terrain` |
| `MapLayout` | Konfiguration einer Blockseite: Größe, Berge, Ruinen, Ödland |
| `MapGrid` | `size` × `size` Zellen; `isPaintable`, `isEmpty`, `paint`, `erase` |
| `Decree` / `Season` | A–D; Frühling A+B, Sommer B+C, Herbst C+D, Winter D+A |
| `DecreeAssignment` | welche Wertungskarte auf welchem Dekret liegt |
| `ScoringCard` | Protokoll: `id`, `category`, `ruleText`, `isImplemented`, `score(_ grid:) -> Int` |
| `SeasonScore` | Punkte beider Dekrete, Gold, Monster-Minuspunkte, Summe |
| `GameState` | Raster, Dekrete, Gold, abgeschlossene Jahreszeiten (Codable) |

Alles im Kern sind **Werttypen**. Undo heißt deshalb: den vorherigen `GameState`
wiederherstellen. Speichern heißt: JSON schreiben.

## Bedienung

* **Antippen** eines Feldes markiert es, und um das Feld erscheint das Ring-Menü.
* **Ziehen** mit Stift oder Finger über mehrere Felder markiert alle überstrichenen
  Felder (eingerastet). Nach dem Loslassen erscheint das Ring-Menü, und die gewählte
  Geländeart füllt die ganze Form.
* Ein Tipp außerhalb des Menüs oder auf ✕ bricht ab.
* Der **Radierer** ist ein eigener Modus: Tippen oder Ziehen leert die Felder.
* **Zurück** macht die letzten Schritte rückgängig (auch Gold und Jahreszeitenwertung).
* **Werten** schließt die laufende Jahreszeit ab. Die App rechnet aus dem Raster
  Dekret 1 + Dekret 2 + Gold + Monster-Minuspunkte.

## Offene Punkte

* **15 Wertungskarten sind Platzhalter** (liefern 0 Punkte, in der App markiert).
  Zum Umsetzen: Typ nach Muster `SentinelWood` anlegen, in `ScoringCardCatalog`
  eintragen, Tests ergänzen.
* **Kartennamen:** Im Moment stehen die englischen Namen in `ScoringCardID.displayName`.
  Die deutschen Namen von Pegasus lassen sich dort eintragen; gespeicherte Spielstände
  bleiben gültig.
* **Positionen der Blockseiten:** Die Vorderseite stammt aus dem Gedächtnis und
  sollte mit dem echten Block abgeglichen werden. Die Ödland-Rückseite ist ein reiner
  Platzhalter. Beides steht in `MapLayout.swift`.
* **Ruinen** sind wie im Original bemalbar. Mit `MapLayout.ruinsArePaintable = false`
  lassen sie sich sperren.
* **Gold** ist ein manueller Zähler. Gold für eingekreiste Berge wird nicht automatisch
  erkannt.

## Später: Mehrspieler

Der Kern hängt nicht von der UI ab. `GameState` ist `Codable` und `Sendable`, und
alle Änderungen laufen zentral über `GameViewModel.apply`. Für eine spätere
Verlinkung lassen sich dort Aktionen oder Schnappschüsse abgreifen und übertragen,
zum Beispiel per MultipeerConnectivity oder SharePlay. Ein `GameState` pro Spieler
plus gemeinsame Dekrete reicht als Modell.
