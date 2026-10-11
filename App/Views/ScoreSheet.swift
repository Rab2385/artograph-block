import SwiftUI
import KartographCore

/// Übersicht wie der Wertungsbereich auf dem Papierblock:
/// eine Zeile pro Jahreszeit plus Gesamtsumme, darunter die aktiven Karten.
struct ScoreSheet: View {
    let state: GameState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Jahreszeiten") {
                    Grid(alignment: .trailing, horizontalSpacing: 16, verticalSpacing: 10) {
                        GridRow {
                            Text("Jahreszeit").gridColumnAlignment(.leading)
                            Text("Dekret 1")
                            Text("Dekret 2")
                            Text("Gold")
                            Text("Monster")
                            Text("Summe")
                        }
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)

                        Divider().gridCellUnsizedAxes(.horizontal)

                        ForEach(Season.allCases) { season in
                            row(for: season)
                        }

                        Divider().gridCellUnsizedAxes(.horizontal)

                        GridRow {
                            Text("Gesamt").font(.headline)
                            Color.clear.gridCellColumns(4)
                            Text("\(state.totalScore)")
                                .font(.title2.bold().monospacedDigit())
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Wertungskarten") {
                    ForEach(Decree.allCases) { decree in
                        if let id = state.decrees[decree] {
                            let card = ScoringCardCatalog.card(for: id)
                            HStack(alignment: .top, spacing: 12) {
                                Text(decree.rawValue)
                                    .font(.title2.bold())
                                    .frame(width: 32)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(card.name).font(.headline)
                                    Text(card.category.displayName)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                    Text(card.ruleText).font(.callout)
                                    if !card.isImplemented {
                                        Label("Platzhalter – zählt vorerst 0 Punkte", systemImage: "exclamationmark.triangle.fill")
                                            .font(.caption)
                                            .foregroundStyle(.orange)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Wertung")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fertig") { dismiss() }
                }
            }
        }
    }

    @ViewBuilder
    private func row(for season: Season) -> some View {
        let isCurrent = season == state.currentSeason
        if let score = state.score(for: season) ?? (isCurrent ? state.currentSeasonPreview : nil) {
            GridRow {
                VStack(alignment: .leading, spacing: 0) {
                    Text(season.displayName)
                    if isCurrent {
                        Text("vorläufig").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                ForEach(score.decreeScores, id: \.decree) { decreeScore in
                    Text("\(decreeScore.decree.rawValue): \(decreeScore.points)")
                }
                Text("\(score.gold)")
                Text("\(score.monsterPenalty)")
                Text("\(score.total)").bold()
            }
            .monospacedDigit()
            .foregroundStyle(isCurrent ? Color.secondary : Color.primary)
        } else {
            GridRow {
                Text(season.displayName)
                Text(season.decrees[0].rawValue)
                Text(season.decrees[1].rawValue)
                Text("–")
                Text("–")
                Text("–")
            }
            .foregroundStyle(.tertiary)
        }
    }
}
