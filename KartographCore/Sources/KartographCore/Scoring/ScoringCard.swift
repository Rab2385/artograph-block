import Foundation

/// Kategorie (Rückseite) einer Wertungskarte.
public enum ScoringCategory: String, Codable, CaseIterable, Sendable {
    case forest
    case waterFarm
    case village
    case spatial

    public var displayName: String {
        switch self {
        case .forest:    return "Wald"
        case .waterFarm: return "Wasser & Acker"
        case .village:   return "Dorf"
        case .spatial:   return "Anordnung"
        }
    }
}

/// Gemeinsames Protokoll aller Wertungskarten.
///
/// Jede Karte ist ein eigenes, austauschbares Regel-Objekt: Sie bekommt das
/// Raster und liefert die Punkte zurück – ohne Seiteneffekte, damit sie sich
/// isoliert testen lässt.
public protocol ScoringCard: Sendable {
    var id: ScoringCardID { get }
    var category: ScoringCategory { get }
    /// Kurzbeschreibung der Regel für die Anzeige.
    var ruleText: String { get }
    /// `false` = Regel noch nicht umgesetzt (Platzhalter, liefert 0 Punkte).
    var isImplemented: Bool { get }

    func score(_ grid: MapGrid) -> Int
}

public extension ScoringCard {
    var name: String { id.displayName }
    var isImplemented: Bool { true }
}
