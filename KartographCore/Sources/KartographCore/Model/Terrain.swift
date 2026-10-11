import Foundation

/// Geländeart, die der Spieler in ein Feld einträgt.
public enum Terrain: String, Codable, CaseIterable, Identifiable, Sendable {
    case forest
    case village
    case water
    case farm
    case monster

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .forest:  return "Wald"
        case .village: return "Dorf"
        case .water:   return "Wasser"
        case .farm:    return "Acker"
        case .monster: return "Monster"
        }
    }
}

/// Was auf dem Block an einer Stelle vorgedruckt ist.
public enum PrintedFeature: String, Codable, Sendable {
    /// Leeres Feld.
    case free
    /// Berg: nie bemalbar.
    case mountain
    /// Ruine: Markierung. Im Original wird auf Ruinen normal gezeichnet –
    /// ob sie bemalbar sind, legt `MapLayout.ruinsArePaintable` fest.
    case ruins
    /// Ödland/Schlucht (Rückseite des Blocks): nie bemalbar.
    case wasteland
}

/// Ein einzelnes Feld des Rasters.
public struct Cell: Codable, Equatable, Sendable {
    public var printed: PrintedFeature
    public var terrain: Terrain?

    public init(printed: PrintedFeature = .free, terrain: Terrain? = nil) {
        self.printed = printed
        self.terrain = terrain
    }
}
