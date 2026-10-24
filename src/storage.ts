import { seedData } from "./data";
import type { Data } from "./types";
const KEY = "ac-data-v1";
export function loadData(): { data: Data; error: string } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { data: seedData(), error: "" };
    const data = JSON.parse(raw);
    if (
      data.version !== 1 ||
      !["clients", "orders", "visits", "issues", "events"].every((k) =>
        Array.isArray(data[k]),
      ) ||
      !data.clients.every(
        (c: any) => typeof c.id === "string" && typeof c.sellerId === "string",
      ) ||
      !data.orders.every(
        (o: any) =>
          Array.isArray(o.items) &&
          typeof o.placedAt === "string" &&
          o.items.every((i: any) => Number.isFinite(i.boxes) && i.boxes > 0),
      )
    )
      throw Error();
    return { data, error: "" };
  } catch {
    return {
      data: seedData(),
      error:
        "Os dados locais não puderam ser lidos. A demonstração foi recuperada; use Restaurar dados para gravar uma nova base.",
    };
  }
}
export function saveData(data: Data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
