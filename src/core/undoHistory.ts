/** Mehrstufiges Undo über Schnappschüsse unveränderlicher Werte. */
export class UndoHistory<T> {
  private snapshots: T[] = [];

  constructor(
    readonly limit = 200,
    private readonly equals: (a: T, b: T) => boolean = Object.is,
  ) {
    if (limit <= 0) throw new RangeError('limit muss größer als 0 sein');
  }

  get canUndo(): boolean {
    return this.snapshots.length > 0;
  }

  get count(): number {
    return this.snapshots.length;
  }

  /** Merkt sich `value` als Zustand *vor* einer Änderung. */
  record(value: T): void {
    const last = this.snapshots[this.snapshots.length - 1];
    if (last !== undefined && this.equals(last, value)) return;
    this.snapshots.push(value);
    if (this.snapshots.length > this.limit) {
      this.snapshots.splice(0, this.snapshots.length - this.limit);
    }
  }

  /** Liefert den zuletzt gemerkten Zustand und entfernt ihn. */
  popLast(): T | undefined {
    return this.snapshots.pop();
  }

  clear(): void {
    this.snapshots = [];
  }
}
