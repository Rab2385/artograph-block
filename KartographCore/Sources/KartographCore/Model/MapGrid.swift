import Foundation

/// Das 11 × 11 Raster eines Spielers. Reiner Werttyp – ideal für Undo,
/// Speicherung und eine spätere Übertragung an andere Geräte.
public struct MapGrid: Codable, Equatable, Sendable {
    public let size: Int
    public let ruinsArePaintable: Bool
    /// Zeilenweise abgelegt: Index = row * size + column.
    public private(set) var cells: [Cell]

    public init(layout: MapLayout) {
        size = layout.size
        ruinsArePaintable = layout.ruinsArePaintable
        var cells: [Cell] = []
        cells.reserveCapacity(layout.size * layout.size)
        for row in 0..<layout.size {
            for column in 0..<layout.size {
                cells.append(Cell(printed: layout.printedFeature(at: Coordinate(row: row, column: column))))
            }
        }
        self.cells = cells
    }

    // MARK: Zugriff

    public func contains(_ c: Coordinate) -> Bool {
        c.row >= 0 && c.row < size && c.column >= 0 && c.column < size
    }

    public subscript(_ c: Coordinate) -> Cell {
        precondition(contains(c), "Koordinate \(c) außerhalb des Rasters")
        return cells[c.row * size + c.column]
    }

    public func terrain(at c: Coordinate) -> Terrain? {
        contains(c) ? self[c].terrain : nil
    }

    public var allCoordinates: [Coordinate] {
        (0..<size).flatMap { row in (0..<size).map { Coordinate(row: row, column: $0) } }
    }

    public func coordinates(of terrain: Terrain) -> [Coordinate] {
        allCoordinates.filter { self[$0].terrain == terrain }
    }

    /// Liegt das Feld in der äußersten Zeile oder Spalte?
    public func isOnEdge(_ c: Coordinate) -> Bool {
        c.row == 0 || c.column == 0 || c.row == size - 1 || c.column == size - 1
    }

    public func neighbors(of c: Coordinate) -> [Coordinate] {
        c.orthogonalNeighbors.filter(contains)
    }

    // MARK: Regeln für das Bemalen

    /// Darf hier überhaupt eine Geländeart eingetragen werden?
    public func isPaintable(_ c: Coordinate) -> Bool {
        guard contains(c) else { return false }
        switch self[c].printed {
        case .free:                 return true
        case .ruins:                return ruinsArePaintable
        case .mountain, .wasteland: return false
        }
    }

    /// Bemalbar und noch ohne Geländeart.
    public func isEmpty(_ c: Coordinate) -> Bool {
        isPaintable(c) && self[c].terrain == nil
    }

    // MARK: Ändern

    /// Trägt `terrain` in alle bemalbaren Felder ein (nil = radieren).
    /// Nicht bemalbare Felder werden stillschweigend übersprungen.
    /// - Returns: `true`, wenn sich mindestens ein Feld geändert hat.
    @discardableResult
    public mutating func paint(_ coordinates: some Sequence<Coordinate>, with terrain: Terrain?) -> Bool {
        var changed = false
        for c in coordinates where isPaintable(c) {
            let index = c.row * size + c.column
            if cells[index].terrain != terrain {
                cells[index].terrain = terrain
                changed = true
            }
        }
        return changed
    }

    @discardableResult
    public mutating func erase(_ coordinates: some Sequence<Coordinate>) -> Bool {
        paint(coordinates, with: nil)
    }
}
