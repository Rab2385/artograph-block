import XCTest
@testable import KartographCore

final class SentinelWoodTests: XCTestCase {
    let card = SentinelWood()

    func testEmptyGridScoresZero() {
        XCTAssertEqual(card.score(grid()), 0)
    }

    func testForestInEveryCornerAndEdgeCounts() {
        let g = grid(emptyLayout, [.forest: [c(0, 0), c(0, 10), c(10, 0), c(10, 10), c(0, 5), c(5, 0), c(10, 5), c(5, 10)]])
        XCTAssertEqual(card.score(g), 8)
    }

    func testInteriorForestDoesNotCount() {
        let g = grid(emptyLayout, [.forest: [c(1, 1), c(5, 5), c(9, 9), c(1, 9)]])
        XCTAssertEqual(card.score(g), 0)
    }

    func testOtherTerrainOnEdgeDoesNotCount() {
        let g = grid(emptyLayout, [
            .forest: [c(0, 1)],
            .village: [c(0, 2)],
            .water: [c(10, 3)],
            .farm: [c(4, 0)],
            .monster: [c(6, 10)]
        ])
        XCTAssertEqual(card.score(g), 1)
    }

    func testFullEdgeOfForestScoresForty() {
        let edge = (0..<11).flatMap { i in [c(0, i), c(10, i), c(i, 0), c(i, 10)] }
        XCTAssertEqual(card.score(grid(emptyLayout, [.forest: edge])), 40)
    }

    func testMetadata() {
        XCTAssertEqual(card.category, .forest)
        XCTAssertTrue(card.isImplemented)
    }
}
