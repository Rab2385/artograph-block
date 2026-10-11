import SwiftUI
import KartographCore

/// Kompakte Wertungsleiste über dem Raster.
struct ScoreHeaderView: View {
    let state: GameState
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 10) {
                currentSeasonInfo
                Spacer(minLength: 8)
                ForEach(Season.allCases) { season in
                    seasonPill(season)
                }
                pill(title: "Gesamt", value: "\(state.totalScore)", emphasized: true, isCurrent: false)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 14).fill(Color(.secondarySystemBackground)))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var currentSeasonInfo: some View {
        if let season = state.currentSeason {
            VStack(alignment: .leading, spacing: 2) {
                Text("\(season.displayName) · Zeit \(season.timeLimit)")
                    .font(.headline)
                Text(season.decrees.map { decreeLabel($0) }.joined(separator: "  ·  "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        } else {
            Text("Spiel beendet")
                .font(.headline)
        }
    }

    private func decreeLabel(_ decree: Decree) -> String {
        guard let id = state.decrees[decree] else { return "\(decree.rawValue): –" }
        return "\(decree.rawValue): \(id.displayName)"
    }

    @ViewBuilder
    private func seasonPill(_ season: Season) -> some View {
        if let score = state.score(for: season) {
            pill(title: season.displayName, value: "\(score.total)", emphasized: false, isCurrent: false)
        } else if season == state.currentSeason, let preview = state.currentSeasonPreview {
            pill(title: season.displayName, value: "≈\(preview.total)", emphasized: false, isCurrent: true)
        } else {
            pill(title: season.displayName, value: "–", emphasized: false, isCurrent: false)
        }
    }

    private func pill(title: String, value: String, emphasized: Bool, isCurrent: Bool) -> some View {
        VStack(spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Text(value)
                .font(emphasized ? .title2.bold().monospacedDigit() : .title3.monospacedDigit())
                .foregroundStyle(isCurrent ? Color.secondary : Color.primary)
        }
        .frame(minWidth: 58)
        .padding(.vertical, 6)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isCurrent ? Color.accentColor : Color.clear, lineWidth: 2)
        )
    }
}
