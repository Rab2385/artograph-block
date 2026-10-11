import XCTest
@testable import KartographCore

final class GameStateTests: XCTestCase {

    func testFullGameAccumulatesFourSeasons() {
        var state = GameState(layout: emptyLayout, decrees: sampleDecrees)
        XCTAssertEqual(state.currentSeason, .spring)

        state.grid.paint([c(0, 0), c(0, 1)], with: .forest)   // A: 2 Punkte
        state.adjustGold(by: 1)
        XCTAssertEqual(state.endCurrentSeason()?.total, 2 + 1)  // Frühling A+B
        XCTAssertEqual(state.currentSeason, .summer)

        XCTAssertEqual(state.endCurrentSeason()?.total, 1)      // Sommer B+C (Platzhalter) + Gold
        state.grid.paint([c(10, 10)], with: .monster)            // -2
        XCTAssertEqual(state.endCurrentSeason()?.total, 1 - 2)  // Herbst C+D
        XCTAssertEqual(state.endCurrentSeason()?.total, 2 + 1 - 2) // Winter D+A

        XCTAssertTrue(state.isFinished)
        XCTAssertNil(state.currentSeason)
        XCTAssertNil(state.endCurrentSeason())
        XCTAssertEqual(state.totalScore, 3 + 1 - 1 + 1)
        XCTAssertEqual(state.seasonScores.map(\.season), Season.allCases)
    }

    func testGoldNeverNegative() {
        var state = GameState(layout: emptyLayout, decrees: sampleDecrees)
        state.adjustGold(by: -3)
        XCTAssertEqual(state.gold, 0)
    }

    func testCodableRoundTrip() throws {
        var state = GameState(layout: .standard, decrees: sampleDecrees, playerName: "Robert")
        state.grid.paint([c(0, 0)], with: .forest)
        state.adjustGold(by: 2)
        state.endCurrentSeason()

        let data = try JSONEncoder().encode(state)
        let decoded = try JSONDecoder().decode(GameState.self, from: data)
        XCTAssertEqual(decoded, state)
    }

    func testStoreSavesAndLoads() throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathComponent("game.json")
        let store = GameStore(fileURL: url)
        XCTAssertNil(try store.load())

        let state = GameState(decrees: sampleDecrees)
        try store.save(state)
        XCTAssertEqual(try store.load(), state)

        try store.delete()
        XCTAssertNil(try store.load())
    }
}

final class MapGridTests: XCTestCase {

    func testStandardLayoutHasMountainsAndRuins() {
        let g = MapGrid(layout: .standard)
        XCTAssertEqual(g.size, 11)
        XCTAssertEqual(g.allCoordinates.filter { g[$0].printed == .mountain }.count, 5)
        XCTAssertEqual(g.allCoordinates.filter { g[$0].printed == .ruins }.count, 6)
    }

    func testMountainsAreNotPaintable() {
        var g = MapGrid(layout: .standard)
        let mountain = MapLayout.standard.mountains[0]
        XCTAssertFalse(g.isPaintable(mountain))
        XCTAssertFalse(g.paint([mountain], with: .forest))
        XCTAssertNil(g[mountain].terrain)
    }

    func testRuinsPaintabilityIsConfigurable() {
        let ruin = c(3, 3)
        var paintable = MapGrid(layout: MapLayout(id: "a", name: "a", mountains: [], ruins: [ruin]))
        XCTAssertTrue(paintable.paint([ruin], with: .village))

        var blocked = MapGrid(layout: MapLayout(id: "b", name: "b", mountains: [], ruins: [ruin], ruinsArePaintable: false))
        XCTAssertFalse(blocked.paint([ruin], with: .village))
    }

    func testWastelandIsNotPaintable() {
        let g = MapGrid(layout: MapLayout(id: "w", name: "w", mountains: [], ruins: [], wasteland: [c(5, 5)]))
        XCTAssertFalse(g.isPaintable(c(5, 5)))
    }

    func testPaintSkipsBlockedCellsButPaintsOthers() {
        var g = MapGrid(layout: MapLayout(id: "m", name: "m", mountains: [c(0, 1)], ruins: []))
        g.paint([c(0, 0), c(0, 1), c(0, 2)], with: .water)
        XCTAssertEqual(g.coordinates(of: .water), [c(0, 0), c(0, 2)])
    }

    func testEraseClearsTerrain() {
        var g = grid(emptyLayout, [.farm: [c(2, 2)]])
        XCTAssertTrue(g.erase([c(2, 2)]))
        XCTAssertTrue(g.isEmpty(c(2, 2)))
        XCTAssertFalse(g.erase([c(2, 2)]))
    }

    func testOutOfBoundsIsNotPaintable() {
        let g = grid()
        XCTAssertFalse(g.isPaintable(c(-1, 0)))
        XCTAssertFalse(g.isPaintable(c(0, 11)))
    }
}

final class UndoHistoryTests: XCTestCase {
    func testUndoReturnsSnapshotsInReverseOrder() {
        var history = UndoHistory<Int>()
        history.record(1)
        history.record(2)
        XCTAssertEqual(history.popLast(), 2)
        XCTAssertEqual(history.popLast(), 1)
        XCTAssertNil(history.popLast())
    }

    func testLimitDropsOldest() {
        var history = UndoHistory<Int>(limit: 2)
        (1...3).forEach { history.record($0) }
        XCTAssertEqual(history.count, 2)
        XCTAssertEqual(history.popLast(), 3)
        XCTAssertEqual(history.popLast(), 2)
    }

    func testIdenticalConsecutiveSnapshotsAreMerged() {
        var history = UndoHistory<Int>()
        history.record(1)
        history.record(1)
        XCTAssertEqual(history.count, 1)
    }
}

final class GridGeometryTests: XCTestCase {
    let geometry = GridGeometry(size: 11, sideLength: 1100) // 100 pt pro Feld

    func testPointToCoordinate() {
        XCTAssertEqual(geometry.coordinate(at: CGPoint(x: 0, y: 0)), c(0, 0))
        XCTAssertEqual(geometry.coordinate(at: CGPoint(x: 250, y: 120)), c(1, 2))
        XCTAssertNil(geometry.coordinate(at: CGPoint(x: 1100, y: 5)))
        XCTAssertNil(geometry.coordinate(at: CGPoint(x: -1, y: 5)))
    }

    func testFastStrokeDoesNotSkipCells() {
        var stroke = StrokeCollector()
        stroke.add(CGPoint(x: 50, y: 50), geometry: geometry) { _ in true }
        stroke.add(CGPoint(x: 450, y: 50), geometry: geometry) { _ in true }
        XCTAssertEqual(stroke.coordinates, (0...4).map { c(0, $0) })
    }

    func testStrokeIgnoresRejectedAndDuplicateCells() {
        var stroke = StrokeCollector()
        let accept: (Coordinate) -> Bool = { $0 != c(0, 1) }
        stroke.add(CGPoint(x: 50, y: 50), geometry: geometry, accept: accept)
        stroke.add(CGPoint(x: 250, y: 50), geometry: geometry, accept: accept)
        stroke.add(CGPoint(x: 50, y: 50), geometry: geometry, accept: accept)
        XCTAssertEqual(stroke.coordinates, [c(0, 0), c(0, 2)])
    }
}
