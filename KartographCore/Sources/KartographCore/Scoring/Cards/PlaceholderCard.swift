import Foundation

/// ⚠️ PLATZHALTER – Regel noch nicht umgesetzt, liefert immer 0 Punkte.
///
/// Zum Umsetzen einer Karte: eigenen Typ nach dem Muster von `SentinelWood`
/// anlegen und in `ScoringCardCatalog.cards` statt des Platzhalters eintragen.
public struct PlaceholderCard: ScoringCard {
    public let id: ScoringCardID
    public let category: ScoringCategory
    public let isImplemented = false

    public var ruleText: String { "Platzhalter – Regel folgt." }

    public init(id: ScoringCardID, category: ScoringCategory) {
        self.id = id
        self.category = category
    }

    public func score(_ grid: MapGrid) -> Int { 0 }
}
