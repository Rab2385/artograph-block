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
                let angle = Double(index) / Double(Terrain.allCases.count) * 2 * .pi - .pi / 2
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
                .offset(x: CGFloat(cos(angle)) * Self.radius, y: CGFloat(sin(angle)) * Self.radius)
                .accessibilityLabel(terrain.displayName)
            }

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
        .frame(width: Self.outerRadius * 2, height: Self.outerRadius * 2)
        .scaleEffect(appeared ? 1 : 0.6)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.spring(duration: 0.2)) { appeared = true }
        }
    }
}
