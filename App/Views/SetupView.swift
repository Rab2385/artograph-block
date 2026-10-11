import SwiftUI
import KartographCore

/// Spielbeginn: Karte (Blockseite) wählen und die vier aktiven
/// Wertungskarten den Dekreten A–D zuordnen – so wie sie am Tisch liegen.
struct SetupView: View {
    let onStart: (MapLayout, DecreeAssignment, String) -> Void
    let onCancel: (() -> Void)?

    @State private var playerName: String
    @State private var layoutID: String
    @State private var assignment: [Decree: ScoringCardID]

    init(
        previous: GameState? = nil,
        onStart: @escaping (MapLayout, DecreeAssignment, String) -> Void,
        onCancel: (() -> Void)? = nil
    ) {
        self.onStart = onStart
        self.onCancel = onCancel
        _playerName = State(initialValue: previous?.playerName ?? "")
        _layoutID = State(initialValue: previous?.layoutID ?? MapLayout.standard.id)
        _assignment = State(initialValue: previous?.decrees.cards ?? [
            .a: .sentinelWood, .b: .canalLake, .c: .wildholds, .d: .borderlands
        ])
    }

    private var decrees: DecreeAssignment { DecreeAssignment(cards: assignment) }

    var body: some View {
        NavigationStack {
            Form {
                Section("Spieler") {
                    TextField("Name (optional)", text: $playerName)
                }

                Section("Karte") {
                    Picker("Blockseite", selection: $layoutID) {
                        ForEach(MapLayout.all) { layout in
                            Text(layout.name).tag(layout.id)
                        }
                    }
                }

                Section {
                    ForEach(Decree.allCases) { decree in
                        Picker("Dekret \(decree.rawValue)", selection: binding(for: decree)) {
                            ForEach(ScoringCategory.allCases, id: \.self) { category in
                                Section(category.displayName) {
                                    ForEach(ScoringCardCatalog.cards(in: category), id: \.id) { card in
                                        Text(card.isImplemented ? card.name : "\(card.name) (Platzhalter)")
                                            .tag(card.id)
                                    }
                                }
                            }
                        }
                    }
                    Button("Zufällig ziehen (je eine Karte pro Kategorie)", systemImage: "shuffle") {
                        drawRandomly()
                    }
                } header: {
                    Text("Wertungskarten")
                } footer: {
                    if !decrees.isComplete {
                        Text("Jede Wertungskarte darf nur einmal vorkommen.")
                            .foregroundStyle(.red)
                    } else {
                        Text("Frühling wertet A+B, Sommer B+C, Herbst C+D, Winter D+A.")
                    }
                }
            }
            .navigationTitle("Neues Spiel")
            .toolbar {
                if let onCancel {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Abbrechen", action: onCancel)
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Spiel starten") {
                        onStart(MapLayout.layout(id: layoutID) ?? .standard, decrees, playerName)
                    }
                    .disabled(!decrees.isComplete)
                }
            }
        }
    }

    private func binding(for decree: Decree) -> Binding<ScoringCardID> {
        Binding(
            get: { assignment[decree] ?? .sentinelWood },
            set: { assignment[decree] = $0 }
        )
    }

    private func drawRandomly() {
        let drawn = ScoringCategory.allCases.compactMap { ScoringCardCatalog.cards(in: $0).randomElement()?.id }
        assignment = Dictionary(uniqueKeysWithValues: zip(Decree.allCases, drawn.shuffled()))
    }
}
