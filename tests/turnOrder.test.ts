import { describe, expect, it } from "vitest";
import { TurnOrder } from "../src/core/turnOrder";

describe("turn order", () => {
  const make = () =>
    new TurnOrder([
      { id: "spirit", interval: 4, next: 0 },
      { id: "shardA", interval: 5, next: 3 },
      { id: "shardB", interval: 6, next: 4.5 },
    ]);

  it("starts with the earliest actor", () => {
    expect(make().current().id).toBe("spirit");
  });

  it("advances by each actor's interval", () => {
    const t = make();
    const seq = [t.current().id];
    for (let i = 0; i < 5; i++) seq.push(t.endTurn().id);
    // times: spirit 0, A 3, spirit 4, B 4.5, A 8, spirit 8 (A listed later → spirit wins tie)
    expect(seq).toEqual(["spirit", "shardA", "spirit", "shardB", "spirit", "shardA"]);
  });

  it("faster actors get more turns in a preview window", () => {
    const t = make();
    const slots = t.preview(20);
    const count = (id: string) => slots.filter((s) => s.id === id).length;
    expect(count("spirit")).toBeGreaterThan(count("shardB"));
    expect(slots.map((s) => s.time)).toEqual([...slots.map((s) => s.time)].sort((a, b) => a - b));
  });

  it("drops removed actors", () => {
    const t = make();
    t.remove("shardA");
    expect(t.preview(10).some((s) => s.id === "shardA")).toBe(false);
  });
});
