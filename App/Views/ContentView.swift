import SwiftUI
import KartographCore

struct ContentView: View {
    @State private var model = GameViewModel()
    @State private var showSetup = false

    var body: some View {
        Group {
            if let state = model.state {
                GameScreen(model: model, state: state) { showSetup = true }
            } else {
                SetupView { layout, decrees, name in
                    model.startNewGame(layout: layout, decrees: decrees, playerName: name)
                }
            }
        }
        .sheet(isPresented: $showSetup) {
            SetupView(
                previous: model.state,
                onStart: { layout, decrees, name in
                    model.startNewGame(layout: layout, decrees: decrees, playerName: name)
                    showSetup = false
                },
                onCancel: { showSetup = false }
            )
        }
        .alert("Fehler", isPresented: Binding(
            get: { model.errorMessage != nil },
            set: { if !$0 { model.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(model.errorMessage ?? "")
        }
    }
}
