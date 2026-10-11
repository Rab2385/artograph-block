import Foundation

/// Mehrstufiges Undo über Schnappschüsse eines Werttyps.
public struct UndoHistory<Value: Equatable> {
    public let limit: Int
    private var snapshots: [Value] = []

    public init(limit: Int = 200) {
        precondition(limit > 0)
        self.limit = limit
    }

    public var canUndo: Bool { !snapshots.isEmpty }
    public var count: Int { snapshots.count }

    /// Merkt sich `value` als Zustand *vor* einer Änderung.
    public mutating func record(_ value: Value) {
        if snapshots.last == value { return }
        snapshots.append(value)
        if snapshots.count > limit {
            snapshots.removeFirst(snapshots.count - limit)
        }
    }

    /// Liefert den zuletzt gemerkten Zustand und entfernt ihn.
    public mutating func popLast() -> Value? {
        snapshots.popLast()
    }

    public mutating func removeAll() {
        snapshots.removeAll()
    }
}
