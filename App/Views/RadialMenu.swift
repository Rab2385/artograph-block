import SwiftUI
import KartographCore

/// Ring-Menü mit den fünf Geländearten. In der Mitte: Abbrechen.
struct RadialMenu: View {
    let cellCount: Int
    let onSelect: (Terrain) -> Void
    let onCancel: () -> Void

    static let radius: CGFloat = 80
    static let buttonSize: CGFloat = 62
    static var outerRadius: CGFloat { radius + buttonSize / 2 + 6 }

    @State private var appeared = false

    var body: some View {
        ZStack {
            Circle()
                .fill(.regularMaterial)
                .shadow(color: .black.opacity(0.25), radius: 10, y: 4)

            ForEach(Array(Terrain.allCases.enumerated()), id: \.element) { index, terrain in
                terrainButton(terrain)
                    .offset(Self.offset(forIndex: index))
            }

            cancelButton
        }
        .frame(width: Self.outerRadius * 2, height: Self.outerRadius * 2)
        .scaleEffect(appeared ? 1 : 0.6)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.spring(duration: 0.2)) { appeared = true }
        }
    }

    /// Position eines Knopfes auf dem Ring; der erste sitzt oben.
    private static func offset(forIndex index: Int) -> CGSize {
        let count: Double = Double(Terrain.allCases.count)
        let angle: Double = Double(index) / count * 2 * Double.pi - Double.pi / 2
        return CGSize(width: CGFloat(cos(angle)) * radius, height: CGFloat(sin(angle)) * radius)
    }

    private func terrainButton(_ terrain: Terrain) -> some View {
        Button {
            onSelect(terrain)
        } label: {
            VStack(spacing: 2) {
                Image(systemName: terrain.symbolName)
                    .font(.title2)
                Text(terrain.displayName)
                    .font(.caption2.bold())
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .foregroundStyle(.white)
            .frame(width: Self.buttonSize, height: Self.buttonSize)
            .background(Circle().fill(terrain.color))
            .overlay(Circle().stroke(.white, lineWidth: 2))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(terrain.displayName)
    }

    private var cancelButton: some View {
        Button(action: onCancel) {
            VStack(spacing: 0) {
                Image(systemName: "xmark")
                    .font(.headline)
                Text(cellCount == 1 ? "1 Feld" : "\(cellCount) Felder")
                    .font(.caption2)
            }
            .foregroundStyle(.secondary)
            .frame(width: 56, height: 56)
            .background(Circle().fill(Color(.systemBackground)))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Abbrechen")
    }
}
