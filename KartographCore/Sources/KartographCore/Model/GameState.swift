import Foundation

/// Kompletter Spielstand eines Spielers (= ein Blatt des Eintrageblocks).
///
/// Bewusst ein reiner, `Codable` Werttyp ohne UI-Abhängigkeit:
/// - Undo = vorherigen Wert wiederherstellen,
/// - Speichern = JSON schreiben,
/// - spätere Mehrspieler-Verlinkung = diesen Wert (oder `GameAction`s) übertragen.
public struct GameState: Codable, Equatable, Sendable {
    public static let currentFormatVersion = 1

    public var formatVersion: Int
    public var id: UUID
    public var playerName: String
    public var layoutID: String
    public var grid: MapGrid
    public var decrees: DecreeAssignment
    /// Aktuelle Anzahl gesammelter Goldmünzen (Zähler).
    public var gold: Int
    /// Abgeschlossene Jahreszeitenwertungen in Spielreihenfolge.
    public private(set) var seasonScores: [SeasonScore]

    public init(
        layout: MapLayout = .standard,
        decrees: DecreeAssignment,
        playerName: String = ""
    ) {
        formatVersion = Self.currentFormatVersion
        id = UUID()
        self.playerName = playerName
        layoutID = layout.id
        grid = MapGrid(layout: layout)
        self.decrees = decrees
        gold = 0
        seasonScores = []
    }

    // MARK: Jahreszeiten

    /// Die laufende Jahreszeit, `nil` wenn alle vier gewertet sind.
    public var currentSeason: Season? {
        Season(rawValue: seasonScores.count)
    }

    public var isFinished: Bool { currentSeason == nil }

    public var totalScore: Int {
        seasonScores.reduce(0) { $0 + $1.total }
    }

    public func score(for season: Season) -> SeasonScore? {
        seasonScores.first { $0.season == season }
    }

    /// Vorschau: Was brächte die laufende Jahreszeit, wenn sie jetzt endete?
    public var currentSeasonPreview: SeasonScore? {
        currentSeason.map { ScoringEngine.score(season: $0, grid: grid, decrees: decrees, gold: gold) }
    }

    /// Wertet die laufende Jahreszeit und schaltet zur nächsten weiter.
    @discardableResult
    public mutating func endCurrentSeason() -> SeasonScore? {
        guard let result = currentSeasonPreview else { return nil }
        seasonScores.append(result)
        return result
    }

    // MARK: Gold

    public mutating func adjustGold(by delta: Int) {
        gold = max(0, gold + delta)
    }
}
