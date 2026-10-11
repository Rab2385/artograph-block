import SwiftUI
import Observation
import KartographCore

enum DrawingTool: Equatable {
    case draw
    case erase
}

/// Vorläufig markierte Felder, für die gerade das Ring-Menü offen ist.
struct PendingSelection: Equatable {
    var cells: [Coordinate]
    /// Mittelpunkt des Ring-Menüs im Koordinatenraum `GameScreen.space`.
    var anchor: CGPoint
}

/// Verbindet den reinen Spielzustand mit der Oberfläche:
/// jede Änderung läuft über `apply`, das Undo und Speichern übernimmt.
@Observable
@MainActor
final class GameViewModel {
    private(set) var state: GameState?
    private(set) var tool: DrawingTool = .draw
    var pending: PendingSelection?
    var errorMessage: String?

    private var history = UndoHistory<GameState>()
    private let store: GameStore

    init(store: GameStore = .standard()) {
        self.store = store
        do {
            state = try store.load()
        } catch {
            errorMessage = "Gespeicherter Spielstand konnte nicht geladen werden: \(error.localizedDescription)"
        }
    }

    var canUndo: Bool { history.canUndo }

    func select(_ tool: DrawingTool) {
        self.tool = tool
        pending = nil
    }

    // MARK: Spielverwaltung

    func startNewGame(layout: MapLayout, decrees: DecreeAssignment, playerName: String) {
        state = GameState(layout: layout, decrees: decrees, playerName: playerName)
        history.removeAll()
        pending = nil
        save()
    }

    /// Leeres Blatt mit gleicher Karte und gleichen Wertungskarten.
    func resetSheet() {
        guard let state else { return }
        let layout = MapLayout.layout(id: state.layoutID) ?? .standard
        startNewGame(layout: layout, decrees: state.decrees, playerName: state.playerName)
    }

    // MARK: Eintragen

    func paintPending(with terrain: Terrain) {
        guard let pending else { return }
        apply { $0.grid.paint(pending.cells, with: terrain) }
        self.pending = nil
    }

    func cancelPending() {
        pending = nil
    }

    func erase(_ cells: [Coordinate]) {
        apply { $0.grid.erase(cells) }
    }

    func adjustGold(by delta: Int) {
        pending = nil
        apply { $0.adjustGold(by: delta) }
    }

    @discardableResult
    func endCurrentSeason() -> SeasonScore? {
        pending = nil
        var result: SeasonScore?
        apply { result = $0.endCurrentSeason() }
        return result
    }

    func undo() {
        pending = nil
        guard let previous = history.popLast() else { return }
        state = previous
        save()
    }

    // MARK: Intern

    private func apply(_ change: (inout GameState) -> Void) {
        guard var newState = state else { return }
        let before = newState
        change(&newState)
        guard newState != before else { return }
        history.record(before)
        state = newState
        save()
    }

    private func save() {
        guard let state else { return }
        do {
            try store.save(state)
        } catch {
            errorMessage = "Spielstand konnte nicht gespeichert werden: \(error.localizedDescription)"
        }
    }
}
