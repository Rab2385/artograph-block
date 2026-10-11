import Foundation

/// Position im Raster, 0-basiert. `row` 0 ist oben, `column` 0 ist links.
public struct Coordinate: Hashable, Codable, Sendable, CustomStringConvertible {
    public let row: Int
    public let column: Int

    public init(row: Int, column: Int) {
        self.row = row
        self.column = column
    }

    /// Die vier orthogonalen Nachbarn (können außerhalb des Rasters liegen).
    public var orthogonalNeighbors: [Coordinate] {
        [
            Coordinate(row: row - 1, column: column),
            Coordinate(row: row + 1, column: column),
            Coordinate(row: row, column: column - 1),
            Coordinate(row: row, column: column + 1)
        ]
    }

    public var description: String { "(\(row),\(column))" }
}
