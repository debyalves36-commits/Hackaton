import { describe, it, expect } from "vitest";
import { seedData, products } from "./data";
import {
  total,
  ipc,
  metrics,
  period,
  portfolio,
  previous,
  recommendations,
  xpEvents,
  change,
} from "./domain";
import type { Order } from "./types";
const order = (
  id: string,
  date: string,
  boxes: number,
  productId = "p1",
  status: Order["status"] = "Entregue",
): Order => ({
  id,
  clientId: "c1",
  sellerId: "victoria",
  placedAt: date,
  items: [{ productId, boxes }],
  status,
  expectedDeliveryAt: date,
});
describe("Definições comerciais", () => {
  it("soma caixas, deduplica SKUs e exclui pedidos cancelados", () => {
    const rows = [
      order("a", "2026-01-01", 10),
      order("b", "2026-01-02", 15),
      order("c", "2026-01-03", 8, "p2"),
      order("d", "2026-01-04", 100, "p3", "Cancelado"),
    ];
    expect(total(rows)).toBe(33);
    expect(ipc(rows)).toBe(2);
  });
  it("mantém o bench histórico ao trocar o período", () => {
    const rows = [order("a", "2025-12-01", 120), order("b", "2026-01-01", 90)];
    expect(metrics(rows, "2026-01").bench).toMatchObject({
      volume: 120,
      key: "2025-12",
    });
    expect(metrics(rows, "2025-12").bench.volume).toBe(120);
    expect(metrics(rows, "2026-01").achievement).toBe(75);
    expect(metrics(rows, "2026-01").yearTotal).toBe(90);
  });
  it("atualiza bench e maior IPC com novos pedidos válidos", () => {
    const rows = [
      order("a", "2026-01-01", 120),
      order("b", "2026-02-01", 90),
      order("c", "2026-02-02", 40, "p2"),
    ];
    expect(metrics(rows, "2026-02").bench.volume).toBe(130);
    expect(metrics(rows, "2026-02").maxIpc.ipc).toBe(2);
  });
  it("inclui clientes sem compras no IPC médio e conta positivação uma vez", () => {
    const clients = seedData().clients.slice(0, 2);
    const rows = [order("a", "2026-01-01", 10), order("b", "2026-01-02", 15)];
    const p = portfolio(clients, rows, "2026-01");
    expect(p.positive).toBe(1);
    expect(p.rate).toBe(50);
    expect(p.ipc).toBe(0.5);
  });
  it("não transforma ausência de base em crescimento infinito", () => {
    expect(change(10, 0)).toBeNull();
    expect(previous("2026-01")).toBe("2025-12");
    expect(metrics([], "2026-01")).toMatchObject({
      volume: 0,
      ipc: 0,
      achievement: 0,
      yearTotal: 0,
    });
  });
  it("compara mix anterior e identifica itens ausentes", () => {
    const rows = [
      order("a", "2026-01-01", 10, "p1"),
      order("b", "2026-02-01", 8, "p2"),
    ];
    expect(recommendations(rows, "2026-02").lost.map((p) => p.id)).toEqual([
      "p1",
    ]);
    expect(
      recommendations(rows, "2026-02").fresh.some((p) => p.id === "p3"),
    ).toBe(true);
  });
  it("gera histórico coerente, catálogo local e carteiras isoladas", () => {
    const d = seedData();
    expect(d.clients.filter((c) => c.sellerId === "victoria")).toHaveLength(12);
    expect(d.clients.filter((c) => c.sellerId === "rafael")).toHaveLength(3);
    expect(
      d.clients.some((c) => {
        const m = metrics(
          d.orders.filter((o) => o.clientId === c.id),
          "2026-10",
        );
        return m.volume > 0 && m.volume === m.bench.volume;
      }),
    ).toBe(true);
    expect(products.length).toBeGreaterThanOrEqual(12);
    expect(d.orders.every((o) => o.placedAt <= "2026-10-23")).toBe(true);
    for (const c of d.clients) {
      const orders = d.orders.filter((o) => o.clientId === c.id);
      const m = metrics(orders, "2026-10");
      expect(m.bench.volume).toBe(total(period(orders, m.bench.key)));
      for (const h of m.history) {
        expect(h.volume).toBe(total(period(orders, h.key)));
        expect(h.ipc).toBe(ipc(period(orders, h.key)));
      }
      expect(orders.every((o) => o.sellerId === c.sellerId)).toBe(true);
    }
  });
  it("concede XP uma vez por evento e reverte recompensas de pedidos cancelados", () => {
    const d = seedData();
    d.orders.push(order("local-1", "2026-10-23", 10, "p15", "Registrado"));
    const xp = xpEvents(d, "victoria").reduce((n, e) => n + e.xp, 0);
    expect(xp).toBeGreaterThanOrEqual(3);
    expect(xpEvents(d, "victoria").reduce((n, e) => n + e.xp, 0)).toBe(xp);
    d.orders.at(-1)!.status = "Cancelado";
    expect(xpEvents(d, "victoria")).toHaveLength(0);
  });
});
