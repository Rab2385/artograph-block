import SwiftUI
import KartographCore

/// Hauptbildschirm: Werkzeugleiste links, Wertung oben, Raster in der Mitte.
struct GameScreen: View {
    /// Gemeinsamer Koordinatenraum für Raster und Ring-Menü.
    static let space = "GameScreen"

    let model: GameViewModel
    let state: GameState
    let onNewGame: () -> Void

    @State private var showScores = false
    @State private var confirmSeasonEnd = false
    @State private var showNewGameDialog = false

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                HStack(spacing: 0) {
                    ToolbarView(
                        model: model,
                        state: state,
                        onEndSeason: { confirmSeasonEnd = true },
                        onShowScores: { showScores = true },
                        onNewGame: { showNewGameDialog = true }
                    )
                    Divider()
                    VStack(spacing: 16) {
                        ScoreHeaderView(state: state) { showScores = true }
                        GridBoardView(model: model, grid: state.grid)
                    }
                    .padding(20)
                }

                if let pending = model.pending {
                    // Tipp außerhalb des Menüs bricht ab.
                    Color.black.opacity(0.06)
                        .contentShape(Rectangle())
                        .onTapGesture { model.cancelPending() }

                    RadialMenu(
                        cellCount: pending.cells.count,
                        onSelect: { model.paintPending(with: $0) },
                        onCancel: { model.cancelPending() }
                    )
                    .position(clamped(pending.anchor, in: proxy.size))
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
            .coordinateSpace(name: Self.space)
        }
        .sheet(isPresented: $showScores) {
            ScoreSheet(state: state)
        }
        .alert(seasonAlertTitle, isPresented: $confirmSeasonEnd) {
            Button("Werten") {
                if model.endCurrentSeason() != nil { showScores = true }
            }
            Button("Abbrechen", role: .cancel) {}
        } message: {
            if let preview = state.currentSeasonPreview {
                Text("Diese Jahreszeit bringt \(preview.total) Punkte. Danach geht es weiter mit \(state.currentSeason?.next?.displayName ?? "dem Spielende").")
            }
        }
        .confirmationDialog("Neues Spiel", isPresented: $showNewGameDialog, titleVisibility: .visible) {
            Button("Neues Spiel – Wertungskarten neu wählen") { onNewGame() }
            Button("Blatt leeren – gleiche Wertungskarten", role: .destructive) { model.resetSheet() }
            Button("Abbrechen", role: .cancel) {}
        } message: {
            Text("Das aktuelle Blatt wird dabei verworfen.")
        }
    }

    private var seasonAlertTitle: String {
        "\(state.currentSeason?.displayName ?? "Jahreszeit") werten?"
    }

    /// Hält das Ring-Menü vollständig auf dem Bildschirm.
    private func clamped(_ point: CGPoint, in size: CGSize) -> CGPoint {
        let r = RadialMenu.outerRadius
        return CGPoint(
            x: min(max(point.x, r), max(r, size.width - r)),
            y: min(max(point.y, r), max(r, size.height - r))
        )
    }
}
