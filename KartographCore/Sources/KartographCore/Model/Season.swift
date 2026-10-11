import Foundation

/// Die vier Dekrete (Wertungsplätze) A–D.
public enum Decree: String, Codable, CodingKeyRepresentable, CaseIterable, Identifiable, Sendable, Comparable {
    case a = "A", b = "B", c = "C", d = "D"

    public var id: String { rawValue }

    public static func < (lhs: Decree, rhs: Decree) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

/// Die vier Jahreszeiten in Spielreihenfolge.
public enum Season: Int, Codable, CaseIterable, Identifiable, Sendable {
    case spring, summer, autumn, winter

    public var id: Int { rawValue }

    public var displayName: String {
        switch self {
        case .spring: return "Frühling"
        case .summer: return "Sommer"
        case .autumn: return "Herbst"
        case .winter: return "Winter"
        }
    }

    /// Welche zwei Dekrete am Ende dieser Jahreszeit gewertet werden.
    public var decrees: [Decree] {
        switch self {
        case .spring: return [.a, .b]
        case .summer: return [.b, .c]
        case .autumn: return [.c, .d]
        case .winter: return [.d, .a]
        }
    }

    /// Zeitlimit laut Jahreszeitenkarte (nur zur Anzeige).
    public var timeLimit: Int {
        switch self {
        case .spring, .summer: return 8
        case .autumn:          return 7
        case .winter:          return 6
        }
    }

    public var next: Season? {
        Season(rawValue: rawValue + 1)
    }
}
