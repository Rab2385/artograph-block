import Foundation

/// Punkte eines Dekrets innerhalb einer Jahreszeitenwertung.
public struct DecreeScore: Codable, Equatable, Sendable {
    public let decree: Decree
    public let card: ScoringCardID
    public let points: Int

    public init(decree: Decree, card: ScoringCardID, points: Int) {
        self.decree = decree
        self.card = card
        self.points = points
    }
}

/// Ergebnis einer Jahreszeit (eine Zeile im Wertungsbereich des Blocks).
public struct SeasonScore: Codable, Equatable, Sendable {
    public let season: Season
    public let decreeScores: [DecreeScore]
    public let gold: Int
    /// Bereits negativ (z. B. -3).
    public let monsterPenalty: Int

    public init(season: Season, decreeScores: [DecreeScore], gold: Int, monsterPenalty: Int) {
        self.season = season
        self.decreeScores = decreeScores
        self.gold = gold
        self.monsterPenalty = monsterPenalty
    }

    public var total: Int {
        decreeScores.reduce(0) { $0 + $1.points } + gold + monsterPenalty
    }
}

/// Zuordnung der vier aktiven Wertungskarten zu den Dekreten A–D.
public struct DecreeAssignment: Codable, Equatable, Sendable {
    public var cards: [Decree: ScoringCardID]

    public init(cards: [Decree: ScoringCardID]) {
        self.cards = cards
    }

    public init(a: ScoringCardID, b: ScoringCardID, c: ScoringCardID, d: ScoringCardID) {
        self.cards = [.a: a, .b: b, .c: c, .d: d]
    }

    public subscript(_ decree: Decree) -> ScoringCardID? {
        cards[decree]
    }

    /// Alle vier Dekrete belegt, keine Karte doppelt.
    public var isComplete: Bool {
        Decree.allCases.allSatisfy { cards[$0] != nil } && Set(cards.values).count == Decree.allCases.count
    }
}

/// Berechnet die Wertung rein aus dem Raster – ohne Zustand.
public enum ScoringEngine {
    /// Minuspunkte: -1 für jedes leere Feld, das orthogonal an mindestens
    /// ein Monsterfeld grenzt. Jedes leere Feld zählt nur einmal.
    public static func monsterPenalty(_ grid: MapGrid) -> Int {
        var emptyNextToMonster = Set<Coordinate>()
        for monster in grid.coordinates(of: .monster) {
            for n in grid.neighbors(of: monster) where grid.isEmpty(n) {
                emptyNextToMonster.insert(n)
            }
        }
        return -emptyNextToMonster.count
    }

    public static func score(
        season: Season,
        grid: MapGrid,
        decrees: DecreeAssignment,
        gold: Int,
        catalog: (ScoringCardID) -> any ScoringCard = ScoringCardCatalog.card(for:)
    ) -> SeasonScore {
        let decreeScores: [DecreeScore] = season.decrees.compactMap { decree in
            guard let id = decrees[decree] else { return nil }
            return DecreeScore(decree: decree, card: id, points: catalog(id).score(grid))
        }
        return SeasonScore(
            season: season,
            decreeScores: decreeScores,
            gold: gold,
            monsterPenalty: monsterPenalty(grid)
        )
    }
}
