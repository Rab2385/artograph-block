import SwiftUI
import KartographCore

extension Terrain {
    var color: Color {
        switch self {
        case .forest:  return Color(red: 0.25, green: 0.55, blue: 0.27)
        case .village: return Color(red: 0.80, green: 0.30, blue: 0.25)
        case .water:   return Color(red: 0.25, green: 0.55, blue: 0.85)
        case .farm:    return Color(red: 0.93, green: 0.76, blue: 0.27)
        case .monster: return Color(red: 0.55, green: 0.30, blue: 0.65)
        }
    }

    var symbolName: String {
        switch self {
        case .forest:  return "tree.fill"
        case .village: return "house.fill"
        case .water:   return "drop.fill"
        case .farm:    return "leaf.fill"
        case .monster: return "pawprint.fill"
        }
    }
}

enum BoardStyle {
    static let paper = Color(red: 0.97, green: 0.94, blue: 0.86)
    static let gridLine = Color(red: 0.55, green: 0.48, blue: 0.38)
    static let mountain = Color(red: 0.45, green: 0.40, blue: 0.35)
    static let highlight = Color.orange
}
