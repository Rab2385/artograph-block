import Foundation

/// Konfiguration der vorgedruckten Felder einer Blockseite.
///
/// Positionen sind 0-basiert als (Zeile, Spalte), Zeile 0 = oben.
/// Neue Varianten lassen sich hier ergänzen, ohne Raster- oder Wertungscode anzufassen.
public struct MapLayout: Codable, Equatable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let size: Int
    public let mountains: [Coordinate]
    public let ruins: [Coordinate]
    public let wasteland: [Coordinate]
    /// Im Original wird auf Ruinenfelder ganz normal gezeichnet.
    public let ruinsArePaintable: Bool

    public init(
        id: String,
        name: String,
        size: Int = 11,
        mountains: [Coordinate],
        ruins: [Coordinate],
        wasteland: [Coordinate] = [],
        ruinsArePaintable: Bool = true
    ) {
        self.id = id
        self.name = name
        self.size = size
        self.mountains = mountains
        self.ruins = ruins
        self.wasteland = wasteland
        self.ruinsArePaintable = ruinsArePaintable
    }

    public func printedFeature(at c: Coordinate) -> PrintedFeature {
        if mountains.contains(c) { return .mountain }
        if wasteland.contains(c) { return .wasteland }
        if ruins.contains(c) { return .ruins }
        return .free
    }
}

public extension MapLayout {
    private static func c(_ row: Int, _ column: Int) -> Coordinate { Coordinate(row: row, column: column) }

    /// Vorderseite des Blocks (Standardkarte).
    /// TODO: Positionen bitte einmal mit dem echten Block abgleichen.
    static let standard = MapLayout(
        id: "standard",
        name: "Vorderseite (Standard)",
        mountains: [c(1, 3), c(2, 8), c(5, 5), c(8, 2), c(9, 7)],
        ruins: [c(1, 5), c(2, 1), c(2, 9), c(8, 1), c(8, 9), c(9, 5)]
    )

    /// Rückseite des Blocks (Ödland-Variante mit Schlucht).
    /// PLATZHALTER: Positionen sind noch NICHT vom Original übernommen –
    /// bitte nachliefern und hier eintragen.
    static let wastelandPlaceholder = MapLayout(
        id: "wasteland",
        name: "Rückseite (Ödland) – Platzhalter",
        mountains: [c(1, 8), c(2, 3), c(7, 5), c(8, 9), c(9, 2)],
        ruins: [c(1, 2), c(1, 6), c(5, 1), c(5, 9), c(9, 4), c(9, 8)],
        wasteland: [c(3, 5), c(4, 5), c(5, 5), c(5, 6), c(6, 5)]
    )

    static let all: [MapLayout] = [.standard, .wastelandPlaceholder]

    static func layout(id: String) -> MapLayout? {
        all.first { $0.id == id }
    }
}
