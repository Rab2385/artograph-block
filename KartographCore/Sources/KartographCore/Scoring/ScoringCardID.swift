import Foundation

/// Stabile Kennung jeder Wertungskarte (wird so gespeichert).
///
/// Die Anzeigenamen sind die Namen der englischen Ausgabe – die deutschen
/// Kartennamen von Pegasus können in `displayName` eingetragen werden,
/// ohne gespeicherte Spielstände zu brechen.
public enum ScoringCardID: String, Codable, CaseIterable, Identifiable, Sendable {
    // Wald
    case sentinelWood
    case greenbough
    case treetower
    case stonesideForest
    // Wasser & Acker
    case canalLake
    case magesValley
    case goldenGranary
    case shoresideExpanse
    // Dorf
    case wildholds
    case greatCity
    case greengoldPlains
    case shieldgate
    // Anordnung
    case borderlands
    case lostBarony
    case brokenRoad
    case cauldrons

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .sentinelWood:     return "Sentinel Wood"
        case .greenbough:       return "Greenbough"
        case .treetower:        return "Treetower"
        case .stonesideForest:  return "Stoneside Forest"
        case .canalLake:        return "Canal Lake"
        case .magesValley:      return "Mages Valley"
        case .goldenGranary:    return "The Golden Granary"
        case .shoresideExpanse: return "Shoreside Expanse"
        case .wildholds:        return "Wildholds"
        case .greatCity:        return "Great City"
        case .greengoldPlains:  return "Greengold Plains"
        case .shieldgate:       return "Shieldgate"
        case .borderlands:      return "Borderlands"
        case .lostBarony:       return "Lost Barony"
        case .brokenRoad:       return "The Broken Road"
        case .cauldrons:        return "The Cauldrons"
        }
    }
}
