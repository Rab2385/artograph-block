import Foundation

/// Speichert den Spielstand lokal als JSON-Datei.
public struct GameStore: Sendable {
    public let fileURL: URL

    public init(fileURL: URL) {
        self.fileURL = fileURL
    }

    /// Standardablage im Application-Support-Verzeichnis der App.
    public static func standard(fileName: String = "current-game.json") -> GameStore {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        return GameStore(fileURL: base.appendingPathComponent("Kartograph", isDirectory: true)
            .appendingPathComponent(fileName))
    }

    public func load() throws -> GameState? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        let data = try Data(contentsOf: fileURL)
        return try JSONDecoder().decode(GameState.self, from: data)
    }

    public func save(_ state: GameState) throws {
        try FileManager.default.createDirectory(
            at: fileURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        try encoder.encode(state).write(to: fileURL, options: .atomic)
    }

    public func delete() throws {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return }
        try FileManager.default.removeItem(at: fileURL)
    }
}
