import Foundation

/// Umrechnung zwischen Bildschirmpunkten und Rasterfeldern.
/// Liegt im Kern (statt in der View), damit das Einrasten testbar ist.
public struct GridGeometry: Equatable, Sendable {
    public let size: Int
    public let cellLength: CGFloat

    public init(size: Int, sideLength: CGFloat) {
        self.size = size
        self.cellLength = sideLength / CGFloat(size)
    }

    public var sideLength: CGFloat { cellLength * CGFloat(size) }

    public func coordinate(at point: CGPoint) -> Coordinate? {
        guard point.x >= 0, point.y >= 0, point.x < sideLength, point.y < sideLength else { return nil }
        return Coordinate(row: Int(point.y / cellLength), column: Int(point.x / cellLength))
    }

    public func center(of c: Coordinate) -> CGPoint {
        CGPoint(x: (CGFloat(c.column) + 0.5) * cellLength, y: (CGFloat(c.row) + 0.5) * cellLength)
    }

    public func frame(of c: Coordinate) -> CGRect {
        CGRect(x: CGFloat(c.column) * cellLength, y: CGFloat(c.row) * cellLength,
               width: cellLength, height: cellLength)
    }

    /// Alle Felder, die eine gerade Strecke überstreicht – damit bei schnellen
    /// Strichen keine Felder übersprungen werden.
    public func coordinates(from start: CGPoint, to end: CGPoint) -> [Coordinate] {
        let dx = end.x - start.x
        let dy = end.y - start.y
        let distance = (dx * dx + dy * dy).squareRoot()
        let steps = max(1, Int((distance / (cellLength / 4)).rounded(.up)))
        var result: [Coordinate] = []
        for i in 0...steps {
            let t = CGFloat(i) / CGFloat(steps)
            let p = CGPoint(x: start.x + dx * t, y: start.y + dy * t)
            if let c = coordinate(at: p), result.last != c {
                result.append(c)
            }
        }
        return result
    }
}

/// Sammelt die Felder eines Freihandstrichs (eingerastet, ohne Duplikate,
/// in Zeichenreihenfolge).
public struct StrokeCollector: Sendable {
    public private(set) var coordinates: [Coordinate] = []
    private var seen = Set<Coordinate>()
    private var lastPoint: CGPoint?

    public init() {}

    public mutating func add(_ point: CGPoint, geometry: GridGeometry, accept: (Coordinate) -> Bool) {
        let touched = lastPoint.map { geometry.coordinates(from: $0, to: point) }
            ?? geometry.coordinate(at: point).map { [$0] } ?? []
        lastPoint = point
        for c in touched where !seen.contains(c) && accept(c) {
            seen.insert(c)
            coordinates.append(c)
        }
    }

    public var isEmpty: Bool { coordinates.isEmpty }
}
