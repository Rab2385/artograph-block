import SwiftUI
import KartographCore

/// Das Spielraster. Nimmt Tippen und Freihandstriche (Stift oder Finger)
/// entgegen und rastet sie auf Felder ein.
///
/// - Tippen auf ein Feld → Feld wird markiert, Ring-Menü öffnet sich.
/// - Ziehen über mehrere Felder → alle überstrichenen Felder werden markiert,
///   nach dem Loslassen öffnet sich das Ring-Menü.
/// - Im Radierer-Modus werden die Felder nach dem Loslassen direkt geleert.
struct GridBoardView: View {
    let model: GameViewModel
    let grid: MapGrid

    @State private var stroke = StrokeCollector()
    @State private var strokePoints: [CGPoint] = []
    @State private var isTracking = false
    /// Wird erst wahr, wenn sich der Finger/Stift spürbar bewegt hat –
    /// vorher gilt die Berührung als Tippen.
    @State private var isStroking = false

    var body: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)
            let geometry = GridGeometry(size: grid.size, sideLength: side)
            let frameInGame = proxy.frame(in: .named(GameScreen.space))
            let boardOrigin = CGPoint(
                x: frameInGame.minX + (proxy.size.width - side) / 2,
                y: frameInGame.minY + (proxy.size.height - side) / 2
            )

            canvas(geometry: geometry)
                .frame(width: side, height: side)
                .contentShape(Rectangle())
                .gesture(dragGesture(geometry: geometry, boardOrigin: boardOrigin))
                .position(x: proxy.size.width / 2, y: proxy.size.height / 2)
                .accessibilityLabel("Spielraster \(grid.size) mal \(grid.size)")
        }
    }

    // MARK: Zeichnen

    private var highlightedCells: [Coordinate] {
        if isTracking { return stroke.coordinates }
        return model.pending?.cells ?? []
    }

    private var highlightColor: Color {
        model.tool == .erase ? .red : BoardStyle.highlight
    }

    private func canvas(geometry: GridGeometry) -> some View {
        let grid = grid
        let highlighted = highlightedCells
        let highlightColor = highlightColor
        let strokePoints = isStroking ? strokePoints : []

        return Canvas { ctx, size in
            ctx.fill(Path(CGRect(origin: .zero, size: size)), with: .color(BoardStyle.paper))

            for c in grid.allCoordinates {
                let rect = geometry.frame(of: c)
                let cell = grid[c]
                let symbolRect = rect.insetBy(dx: rect.width * 0.2, dy: rect.height * 0.2)

                switch cell.printed {
                case .mountain:
                    ctx.fill(Path(rect), with: .color(BoardStyle.mountain))
                    drawSymbol("mountain.2.fill", in: symbolRect, color: .white, ctx: ctx)
                case .wasteland:
                    ctx.fill(Path(rect), with: .color(.gray.opacity(0.5)))
                    drawSymbol("xmark", in: symbolRect, color: .white.opacity(0.7), ctx: ctx)
                case .free, .ruins:
                    break
                }

                if let terrain = cell.terrain {
                    ctx.fill(Path(rect), with: .color(terrain.color))
                    drawSymbol(terrain.symbolName, in: symbolRect, color: .white.opacity(0.9), ctx: ctx)
                }

                if cell.printed == .ruins {
                    let badge = CGRect(x: rect.minX + 2, y: rect.minY + 2, width: rect.width * 0.38, height: rect.height * 0.38)
                    let ruinColor: Color = cell.terrain == nil ? BoardStyle.gridLine : .white
                    drawSymbol("building.columns.fill", in: badge, color: ruinColor, ctx: ctx)
                }
            }

            for c in highlighted {
                let rect = geometry.frame(of: c)
                ctx.fill(Path(rect), with: .color(highlightColor.opacity(0.3)))
                ctx.stroke(Path(rect.insetBy(dx: 2, dy: 2)), with: .color(highlightColor), lineWidth: 3)
            }

            var lines = Path()
            for i in 0...grid.size {
                let offset = CGFloat(i) * geometry.cellLength
                lines.move(to: CGPoint(x: offset, y: 0))
                lines.addLine(to: CGPoint(x: offset, y: size.height))
                lines.move(to: CGPoint(x: 0, y: offset))
                lines.addLine(to: CGPoint(x: size.width, y: offset))
            }
            ctx.stroke(lines, with: .color(BoardStyle.gridLine.opacity(0.6)), lineWidth: 1)
            ctx.stroke(Path(CGRect(origin: .zero, size: size)), with: .color(BoardStyle.gridLine), lineWidth: 3)

            if strokePoints.count > 1 {
                var path = Path()
                path.addLines(strokePoints)
                ctx.stroke(path, with: .color(highlightColor.opacity(0.8)),
                           style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
            }
        }
    }

    private func drawSymbol(_ name: String, in rect: CGRect, color: Color, ctx: GraphicsContext) {
        var image = ctx.resolve(Image(systemName: name))
        image.shading = .color(color)
        ctx.draw(image, in: rect)
    }

    // MARK: Eingabe

    private func dragGesture(geometry: GridGeometry, boardOrigin: CGPoint) -> some Gesture {
        DragGesture(minimumDistance: 0, coordinateSpace: .local)
            .onChanged { value in
                if !isTracking {
                    isTracking = true
                    isStroking = false
                    model.cancelPending()
                    stroke = StrokeCollector()
                    stroke.add(value.startLocation, geometry: geometry, accept: grid.isPaintable)
                    strokePoints = [value.startLocation]
                }
                let dx = value.location.x - value.startLocation.x
                let dy = value.location.y - value.startLocation.y
                if !isStroking, (dx * dx + dy * dy).squareRoot() > geometry.cellLength * 0.35 {
                    isStroking = true
                }
                if isStroking {
                    stroke.add(value.location, geometry: geometry, accept: grid.isPaintable)
                    strokePoints.append(value.location)
                }
            }
            .onEnded { _ in
                let cells = stroke.coordinates
                isTracking = false
                isStroking = false
                strokePoints = []
                stroke = StrokeCollector()
                guard let last = cells.last else { return }

                switch model.tool {
                case .erase:
                    model.erase(cells)
                case .draw:
                    let center = geometry.center(of: last)
                    model.pending = PendingSelection(
                        cells: cells,
                        anchor: CGPoint(x: boardOrigin.x + center.x, y: boardOrigin.y + center.y)
                    )
                }
            }
    }
}
