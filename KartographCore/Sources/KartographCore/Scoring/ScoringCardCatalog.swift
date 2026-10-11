import Foundation

/// Verzeichnis aller Wertungskarten. Hier wird festgelegt, welches
/// Regel-Objekt zu welcher Karte gehört.
public enum ScoringCardCatalog {
    public static let cards: [any ScoringCard] = [
        // Wald
        SentinelWood(),
        PlaceholderCard(id: .greenbough, category: .forest),
        PlaceholderCard(id: .treetower, category: .forest),
        PlaceholderCard(id: .stonesideForest, category: .forest),
        // Wasser & Acker
        PlaceholderCard(id: .canalLake, category: .waterFarm),
        PlaceholderCard(id: .magesValley, category: .waterFarm),
        PlaceholderCard(id: .goldenGranary, category: .waterFarm),
        PlaceholderCard(id: .shoresideExpanse, category: .waterFarm),
        // Dorf
        PlaceholderCard(id: .wildholds, category: .village),
        PlaceholderCard(id: .greatCity, category: .village),
        PlaceholderCard(id: .greengoldPlains, category: .village),
        PlaceholderCard(id: .shieldgate, category: .village),
        // Anordnung
        PlaceholderCard(id: .borderlands, category: .spatial),
        PlaceholderCard(id: .lostBarony, category: .spatial),
        PlaceholderCard(id: .brokenRoad, category: .spatial),
        PlaceholderCard(id: .cauldrons, category: .spatial)
    ]

    public static func card(for id: ScoringCardID) -> any ScoringCard {
        guard let card = cards.first(where: { $0.id == id }) else {
            preconditionFailure("Keine Wertungskarte für \(id) im Katalog")
        }
        return card
    }

    public static func cards(in category: ScoringCategory) -> [any ScoringCard] {
        cards.filter { $0.category == category }
    }
}
