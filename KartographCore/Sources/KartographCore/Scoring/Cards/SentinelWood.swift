import Foundation

/// „1 Punkt je Waldfeld am Rand des Rasters."
public struct SentinelWood: ScoringCard {
    public let id = ScoringCardID.sentinelWood
    public let category = ScoringCategory.forest
    public let ruleText = "1 Punkt je Waldfeld am Rand des Rasters."

    public init() {}

    public func score(_ grid: MapGrid) -> Int {
        grid.coordinates(of: .forest).filter(grid.isOnEdge).count
    }
}
