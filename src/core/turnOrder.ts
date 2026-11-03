// Speed-based turn order. Every actor acts once per `interval` time units;
// a smaller interval means more frequent turns. Pure TypeScript, no Phaser.

export interface Actor {
  id: string;
  interval: number;
  next: number; // time of this actor's next turn
}

export interface TurnSlot {
  id: string;
  time: number;
}

export class TurnOrder {
  private actors: Actor[];

  constructor(actors: Actor[]) {
    this.actors = actors.map((a) => ({ ...a }));
  }

  /** The actor whose turn it is. Ties go to the earlier actor in the list. */
  current(): Actor {
    if (!this.actors.length) throw new Error("TurnOrder has no actors");
    return this.actors.reduce((best, a) => (a.next < best.next ? a : best));
  }

  /** Current time on the turn axis. */
  now(): number {
    return this.current().next;
  }

  /** Ends the current actor's turn and returns the next actor. */
  endTurn(): Actor {
    const a = this.current();
    a.next += a.interval;
    return this.current();
  }

  remove(id: string): void {
    this.actors = this.actors.filter((a) => a.id !== id);
  }

  setInterval(id: string, interval: number): void {
    const a = this.actors.find((x) => x.id === id);
    if (a) a.interval = interval;
  }

  /** Upcoming turns from now until now + window, in order. */
  preview(window: number): TurnSlot[] {
    const end = this.now() + window;
    const slots: (TurnSlot & { order: number })[] = [];
    this.actors.forEach((a, order) => {
      for (let t = a.next; t <= end; t += a.interval) slots.push({ id: a.id, time: t, order });
    });
    return slots
      .sort((x, y) => x.time - y.time || x.order - y.order)
      .map(({ id, time }) => ({ id, time }));
  }
}
