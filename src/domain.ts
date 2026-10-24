import type { Client, Data, Order, GamificationEvent } from "./types";
import { products } from "./data";
export const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
export const valid = (o: Order) => o.status !== "Cancelado";
export const total = (orders: Order[]) =>
  orders
    .filter(valid)
    .reduce((sum, o) => sum + o.items.reduce((n, i) => n + i.boxes, 0), 0);
/** IPC = distinct SKUs in valid orders, independent of boxes or repeat purchases. */
export const ipc = (orders: Order[]) =>
  new Set(
    orders
      .filter(valid)
      .flatMap((o) =>
        o.items.filter((i) => i.boxes > 0).map((i) => i.productId),
      ),
  ).size;
export const period = (orders: Order[], key: string) =>
  orders.filter((o) => valid(o) && o.placedAt.startsWith(key));
export const previous = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
};
export const change = (now: number, before: number): number | null =>
  before === 0 ? null : ((now - before) / before) * 100;
export const trendLabel = (n: number | null) =>
  n === null
    ? "Sem base anterior"
    : `${n > 0 ? "+" : ""}${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
export const dateLabel = (s?: string) =>
  s
    ? new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString(
        "pt-BR",
      )
    : "Sem registro";
export const dateTimeLabel = (s: string) =>
  new Date(s).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export function metrics(orders: Order[], key: string) {
  const all = orders.filter(valid);
  const keys = [...new Set(all.map((o) => o.placedAt.slice(0, 7)))].sort();
  const history = keys.map((key) => ({
    key,
    volume: total(period(all, key)),
    ipc: ipc(period(all, key)),
  }));
  const bench = history.reduce((a, b) => (b.volume > a.volume ? b : a), {
    key: "",
    volume: 0,
    ipc: 0,
  });
  const maxIpc = history.reduce((a, b) => (b.ipc > a.ipc ? b : a), {
    key: "",
    volume: 0,
    ipc: 0,
  });
  const current = period(all, key),
    before = period(all, previous(key));
  const volume = total(current);
  return {
    current,
    volume,
    ipc: ipc(current),
    bench,
    maxIpc,
    previousIpc: ipc(before),
    growth: change(volume, total(before)),
    yearTotal: total(period(all, key.slice(0, 4))),
    bestYear: Math.max(
      0,
      ...history
        .filter((h) => h.key.startsWith(key.slice(0, 4)))
        .map((h) => h.volume),
    ),
    achievement: bench.volume ? (volume / bench.volume) * 100 : 0,
    history,
  };
}
export function situation(orders: Order[], key: string) {
  const m = metrics(orders, key);
  return m.volume === 0
    ? "Sem compra"
    : m.growth !== null && m.growth < -10
      ? "Em queda"
      : m.growth !== null && m.growth > 0
        ? "Em crescimento"
        : "Estável";
}
export function recommendations(orders: Order[], key: string) {
  const m = metrics(orders, key),
    now = new Set(m.current.flatMap((o) => o.items.map((i) => i.productId))),
    last = new Set(
      period(orders, previous(key)).flatMap((o) =>
        o.items.map((i) => i.productId),
      ),
    ),
    ever = new Set(
      orders
        .filter(valid)
        .filter((o) => o.placedAt.slice(0, 7) <= key)
        .flatMap((o) => o.items.map((i) => i.productId)),
    );
  const lost = products.filter((p) => last.has(p.id) && !now.has(p.id)),
    fresh = products.filter((p) => !ever.has(p.id));
  const text: string[] = [];
  if (lost.length)
    text.push(
      `Recupere o mix: ${lost.map((p) => p.name).join(", ")} estava${lost.length > 1 ? "m" : ""} no mês anterior e não aparece${lost.length > 1 ? "m" : ""} neste período.`,
    );
  if (fresh.length)
    text.push(
      `Explore novos produtos: ${fresh
        .slice(0, 2)
        .map((p) => p.name)
        .join(
          " e ",
        )} ainda não fazem parte do histórico até este período. Consulte o interesse do cliente.`,
    );
  if (m.volume < m.bench.volume)
    text.push(
      `Potencial de recuperação: faltam ${m.bench.volume - m.volume} caixas para igualar o bench de ${m.bench.volume}. Planeje a próxima abordagem.`,
    );
  const prevKeys = [1, 2, 3].reduce<string[]>(
    (a) => [...a, previous(a.at(-1) ?? key)],
    [],
  );
  const avg = prevKeys.reduce((n, k) => n + total(period(orders, k)), 0) / 3;
  if (avg > 0 && m.volume < avg)
    text.push(
      `Volume ${Math.round((1 - m.volume / avg) * 100)}% abaixo da média dos três meses anteriores. Verifique frequência e necessidades; o mês selecionado pode estar incompleto.`,
    );
  if (!text.length)
    text.push(
      "Mix e volume sustentados. Confirme a satisfação do cliente e planeje a reposição dos produtos recorrentes.",
    );
  return { text, lost, fresh };
}
export function portfolio(clients: Client[], orders: Order[], key: string) {
  const ids = new Set(clients.map((c) => c.id)),
    own = orders.filter((o) => ids.has(o.clientId)),
    current = period(own, key);
  const positive = clients.filter((c) =>
    current.some((o) => o.clientId === c.id),
  ).length;
  return {
    volume: total(current),
    orders: current.length,
    positive,
    rate: clients.length ? (positive / clients.length) * 100 : 0,
    ipc: clients.length
      ? clients.reduce(
          (n, c) => n + ipc(current.filter((o) => o.clientId === c.id)),
          0,
        ) / clients.length
      : 0,
    attention: clients.filter((c) =>
      ["Sem compra", "Em queda"].includes(
        situation(
          own.filter((o) => o.clientId === c.id),
          key,
        ),
      ),
    ).length,
  };
}
/** Recompute order rewards from valid persisted orders, so cancellation reverses XP. */
export function xpEvents(data: Data, sellerId: string): GamificationEvent[] {
  const events = data.events.filter((e) => e.sellerId === sellerId),
    orders = data.orders.filter((o) => o.sellerId === sellerId && valid(o));
  orders
    .filter((o) => o.id.startsWith("local-"))
    .forEach((o) => {
      const before = orders.filter(
        (b) =>
          b.clientId === o.clientId &&
          b.id !== o.id &&
          (b.placedAt < o.placedAt ||
            (b.placedAt === o.placedAt && b.id < o.id)),
      );
      const key = o.placedAt.slice(0, 7),
        a = metrics(before, key),
        b = metrics([...before, o], key);
      const rewards: [string, number][] = [["Pedido válido", 3]];
      if (o.status === "Entregue" && b.ipc > a.ipc)
        rewards.push(["Ampliação do IPC", 4]);
      if (b.volume > a.bench.volume && a.bench.volume > 0)
        rewards.push(["Novo bench", 5]);
      rewards.forEach(([type, xp]) =>
        events.push({
          id: `${o.id}-${type}`,
          sellerId,
          eventKey: `${o.id}-${type}`,
          type,
          xp,
          createdAt: o.placedAt,
        }),
      );
    });
  data.visits
    .filter(
      (v) =>
        v.sellerId === sellerId &&
        v.status === "Concluída" &&
        v.id !== "visit-demo",
    )
    .forEach((v) =>
      events.push({
        id: v.id,
        sellerId,
        eventKey: v.id,
        type: "Visita concluída",
        xp: 2,
        createdAt: v.checkOutAt!,
      }),
    );
  data.issues
    .filter((i) => i.sellerId === sellerId && i.status !== "Aberto")
    .forEach((i) =>
      events.push({
        id: i.id,
        sellerId,
        eventKey: i.id,
        type: "Acompanhamento de ocorrência",
        xp: 2,
        createdAt: i.createdAt,
      }),
    );
  return events;
}
export function productStats(orders: Order[], key: string) {
  return products.map((p) => {
    const boxes = (key: string) =>
      period(orders, key).reduce(
        (sum, o) =>
          sum +
          o.items
            .filter((i) => i.productId === p.id)
            .reduce((n, i) => n + i.boxes, 0),
        0,
      );
    const last = orders
      .filter(valid)
      .filter((o) => o.items.some((i) => i.productId === p.id))
      .map((o) => o.placedAt)
      .sort()
      .at(-1);
    return {
      p,
      current: boxes(key),
      prior: boxes(previous(key)),
      annual: boxes(key.slice(0, 4)),
      last,
    };
  });
}
