@testable import KartographCore

/// Leeres 11 × 11 Raster ohne vorgedruckte Felder – für übersichtliche Tests.
let emptyLayout = MapLayout(id: "test", name: "Test", mountains: [], ruins: [])

func c(_ row: Int, _ column: Int) -> Coordinate { Coordinate(row: row, column: column) }

func grid(
    _ layout: MapLayout = emptyLayout,
    _ painted: [Terrain: [Coordinate]] = [:]
) -> MapGrid {
    var g = MapGrid(layout: layout)
    for (terrain, coords) in painted {
        g.paint(coords, with: terrain)
    }
    return g
}

let sampleDecrees = DecreeAssignment(a: .sentinelWood, b: .canalLake, c: .wildholds, d: .borderlands)
