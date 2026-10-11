import XCTest
@testable import KartographCore

final class ScoringEngineTests: XCTestCase {

    // MARK: Jahreszeiten → Dekrete

    func testSeasonDecreeMapping() {
        XCTAssertEqual(Season.spring.decrees, [.a, .b])
        XCTAssertEqual(Season.summer.decrees, [.b, .c])
        XCTAssertEqual(Season.autumn.decrees, [.c, .d])
        XCTAssertEqual(Season.winter.decrees, [.d, .a])
    }

    func testEachDecreeIsScoredExactlyTwicePerGame() {
        let all = Season.allCases.flatMap(\.decrees)
        for decree in Decree.allCases {
            XCTAssertEqual(all.filter { $0 == decree }.count, 2, "Dekret \(decree)")
        }
    }

    // MARK: Monster

    func testMonsterPenaltyCountsEmptyNeighbors() {
        // Monster in der Mitte: 4 leere Nachbarn.
        XCTAssertEqual(ScoringEngine.monsterPenalty(grid(emptyLayout, [.monster: [c(5, 5)]])), -4)
    }

    func testMonsterInCornerHasTwoNeighbors() {
        XCTAssertEqual(ScoringEngine.monsterPenalty(grid(emptyLayout, [.monster: [c(0, 0)]])), -2)
    }

    func testFilledNeighborsDoNotCount() {
        let g = grid(emptyLayout, [.monster: [c(5, 5)], .forest: [c(4, 5), c(6, 5)], .water: [c(5, 4)]])
        XCTAssertEqual(ScoringEngine.monsterPenalty(g), -1)
    }

    func testSharedEmptyNeighborCountsOnce() {
        // (5,5) ist leer und grenzt an beide Monster.
        let g = grid(emptyLayout, [.monster: [c(5, 4), c(5, 6)]])
        // Nachbarn von (5,4): (4,4) (6,4) (5,3) (5,5); von (5,6): (4,6) (6,6) (5,5) (5,7) → 7 verschiedene.
        XCTAssertEqual(ScoringEngine.monsterPenalty(g), -7)
    }

    func testAdjacentMonstersDoNotPenalizeEachOther() {
        let g = grid(emptyLayout, [.monster: [c(0, 0), c(0, 1)]])
        // (1,0), (1,1), (0,2)
        XCTAssertEqual(ScoringEngine.monsterPenalty(g), -3)
    }

    func testMountainNextToMonsterIsNotEmpty() {
        let layout = MapLayout(id: "m", name: "m", mountains: [c(5, 6)], ruins: [])
        let g = grid(layout, [.monster: [c(5, 5)]])
        XCTAssertEqual(ScoringEngine.monsterPenalty(g), -3)
    }

    func testEmptyRuinNextToMonsterCounts() {
        let layout = MapLayout(id: "r", name: "r", mountains: [], ruins: [c(5, 6)])
        let g = grid(layout, [.monster: [c(5, 5)]])
        XCTAssertEqual(ScoringEngine.monsterPenalty(g), -4)
    }

    func testNoMonstersNoPenalty() {
        XCTAssertEqual(ScoringEngine.monsterPenalty(grid()), 0)
    }

    // MARK: Jahreszeitenwertung

    func testSpringScoresDecreesAAndBPlusGoldAndMonsters() {
        let g = grid(emptyLayout, [.forest: [c(0, 0), c(0, 1), c(5, 5)], .monster: [c(10, 10)]])
        let score = ScoringEngine.score(season: .spring, grid: g, decrees: sampleDecrees, gold: 3)

        XCTAssertEqual(score.decreeScores.map(\.decree), [.a, .b])
        XCTAssertEqual(score.decreeScores[0].card, .sentinelWood)
        XCTAssertEqual(score.decreeScores[0].points, 2)
        XCTAssertEqual(score.decreeScores[1].points, 0) // Platzhalter
        XCTAssertEqual(score.gold, 3)
        XCTAssertEqual(score.monsterPenalty, -2)
        XCTAssertEqual(score.total, 2 + 0 + 3 - 2)
    }

    func testSummerDoesNotScoreDecreeA() {
        let g = grid(emptyLayout, [.forest: [c(0, 0)]])
        let score = ScoringEngine.score(season: .summer, grid: g, decrees: sampleDecrees, gold: 0)
        XCTAssertEqual(score.decreeScores.map(\.decree), [.b, .c])
        XCTAssertEqual(score.total, 0)
    }

    func testWinterScoresDThenA() {
        let g = grid(emptyLayout, [.forest: [c(0, 0)]])
        let score = ScoringEngine.score(season: .winter, grid: g, decrees: sampleDecrees, gold: 0)
        XCTAssertEqual(score.decreeScores.map(\.decree), [.d, .a])
        XCTAssertEqual(score.total, 1)
    }

    func testCustomCatalogIsUsed() {
        struct Fixed: ScoringCard {
            let id: ScoringCardID
            let category = ScoringCategory.spatial
            let ruleText = "fix"
            func score(_ grid: MapGrid) -> Int { 5 }
        }
        let score = ScoringEngine.score(season: .autumn, grid: grid(), decrees: sampleDecrees, gold: 0) { Fixed(id: $0) }
        XCTAssertEqual(score.total, 10)
    }

    func testTotalCanBeNegative() {
        let g = grid(emptyLayout, [.monster: [c(5, 5)]])
        let score = ScoringEngine.score(season: .summer, grid: g, decrees: sampleDecrees, gold: 1)
        XCTAssertEqual(score.total, -3)
    }

    // MARK: Katalog & Platzhalter

    func testCatalogContainsEveryCardExactlyOnce() {
        XCTAssertEqual(ScoringCardCatalog.cards.count, ScoringCardID.allCases.count)
        XCTAssertEqual(Set(ScoringCardCatalog.cards.map(\.id)), Set(ScoringCardID.allCases))
    }

    func testFourCardsPerCategory() {
        for category in ScoringCategory.allCases {
            XCTAssertEqual(ScoringCardCatalog.cards(in: category).count, 4, "\(category)")
        }
    }

    func testPlaceholdersAreMarkedAndScoreZero() {
        let full = grid(emptyLayout, [.forest: grid().allCoordinates])
        for card in ScoringCardCatalog.cards where !card.isImplemented {
            XCTAssertEqual(card.score(full), 0, card.name)
            XCTAssertTrue(card.ruleText.contains("Platzhalter"), card.name)
        }
    }

    // MARK: Dekret-Zuordnung

    func testDecreeAssignmentCompleteness() {
        XCTAssertTrue(sampleDecrees.isComplete)
        XCTAssertFalse(DecreeAssignment(cards: [.a: .sentinelWood]).isComplete)
        XCTAssertFalse(DecreeAssignment(a: .sentinelWood, b: .sentinelWood, c: .wildholds, d: .borderlands).isComplete)
    }
}
