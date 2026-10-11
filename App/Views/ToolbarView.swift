import SwiftUI
import KartographCore

struct ToolbarView: View {
    let model: GameViewModel
    let state: GameState
    let onEndSeason: () -> Void
    let onShowScores: () -> Void
    let onNewGame: () -> Void

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 10) {
                ToolButton(title: "Zeichnen", symbol: "pencil.tip", isSelected: model.tool == .draw) {
                    model.select(.draw)
                }
                ToolButton(title: "Radierer", symbol: "eraser", isSelected: model.tool == .erase) {
                    model.select(.erase)
                }

                Divider().padding(.horizontal, 12)

                ToolButton(title: "Zurück", symbol: "arrow.uturn.backward") {
                    model.undo()
                }
                .disabled(!model.canUndo)

                Divider().padding(.horizontal, 12)

                GoldCounter(gold: state.gold) { model.adjustGold(by: $0) }

                Divider().padding(.horizontal, 12)

                ToolButton(title: "Werten", symbol: "checkmark.seal", action: onEndSeason)
                    .disabled(state.isFinished)
                ToolButton(title: "Wertung", symbol: "list.number", action: onShowScores)
                ToolButton(title: "Neu", symbol: "plus.square.on.square", action: onNewGame)
            }
            .padding(.vertical, 16)
        }
        .frame(width: 92)
        .background(Color(.secondarySystemBackground))
    }
}

private struct ToolButton: View {
    let title: String
    let symbol: String
    var isSelected = false
    let action: () -> Void

    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: symbol)
                    .font(.title2)
                    .frame(height: 28)
                Text(title)
                    .font(.caption)
            }
            .frame(width: 72, height: 62)
            .foregroundStyle(isSelected ? Color.white : Color.primary)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.accentColor : Color.clear)
            )
            .opacity(isEnabled ? 1 : 0.35)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private struct GoldCounter: View {
    let gold: Int
    let onChange: (Int) -> Void

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "dollarsign.circle.fill")
                .font(.title2)
                .foregroundStyle(.yellow)
            Text("\(gold)")
                .font(.title2.monospacedDigit().bold())
            Text("Gold")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack(spacing: 8) {
                stepButton("minus", delta: -1)
                    .disabled(gold == 0)
                stepButton("plus", delta: 1)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Gold: \(gold)")
    }

    private func stepButton(_ symbol: String, delta: Int) -> some View {
        Button { onChange(delta) } label: {
            Image(systemName: symbol)
                .font(.headline)
                .frame(width: 32, height: 32)
                .background(Circle().fill(Color(.tertiarySystemBackground)))
        }
        .buttonStyle(.plain)
    }
}
