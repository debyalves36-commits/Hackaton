import type { Data, Seller, Product, Client, Order } from "./types";
export const DEMO_DATE = "2026-10-23";
export const sellers: Seller[] = [
  {
    id: "victoria",
    name: "Victoria Adorno",
    avatar: "VA",
    createdAt: "2025-01-01",
  },
  {
    id: "rafael",
    name: "Rafael Oliveira",
    avatar: "RO",
    createdAt: "2025-01-01",
  },
];
export const products: Product[] = [
  ["Frango inteiro", "Frango", "chicken"],
  ["Peito de frango", "Frango", "chicken"],
  ["Lombo suíno", "Suínos", "pork"],
  ["Coxa de frango", "Frango", "chicken-leg"],
  ["Pernil suíno", "Suínos", "pork"],
  ["Filé de peito de frango", "Frango", "chicken"],
  ["Costela suína", "Suínos", "pork-ribs"],
  ["Asa de frango", "Frango", "chicken-wing"],
  ["Bisteca suína", "Suínos", "pork"],
  ["Coxinha da asa de frango", "Frango", "chicken-wing"],
  ["Copa lombo suíno", "Suínos", "pork"],
  ["Paleta suína", "Suínos", "pork"],
  ["Sassami de frango", "Frango", "chicken"],
  ["Sobrecoxa de frango", "Frango", "chicken-leg"],
  ["Barriga suína", "Suínos", "pork-ribs"],
].map(([name, category, illustration], i) => ({
  id: `p${i + 1}`,
  sku: `AC-${String(i + 1).padStart(3, "0")}`,
  name,
  category,
  image: `./products/${illustration}.svg`,
  active: true,
}));
const names = [
  "Mercado Vila Esperança",
  "Padaria Pão Nobre",
  "Açougue Bom Corte",
  "Restaurante Sabor Caseiro",
  "Minimercado Oliveira",
  "Mercearia Central",
  "Supermercado Bela Vista",
  "Lanchonete Estação",
  "Mercado Santa Clara",
  "Empório Nova Era",
  "Padaria Trigo Dourado",
  "Restaurante Dona Maria",
  "Mercado Jardim Sul",
  "Padaria Flor do Campo",
  "Empório São Bento",
];
const types = [
  "Mercado",
  "Padaria",
  "Açougue",
  "Restaurante",
  "Minimercado",
  "Mercearia",
  "Supermercado",
  "Lanchonete",
  "Mercado",
  "Empório",
  "Padaria",
  "Restaurante",
  "Mercado",
  "Padaria",
  "Empório",
];
export function seedData(): Data {
  const clients: Client[] = names.map((name, i) => ({
    id: `c${i + 1}`,
    sellerId: i < 12 ? "victoria" : "rafael",
    name,
    businessType: types[i],
    contactName: ["Ana Martins", "Pedro Lima", "Carlos Costa", "Maria Dias"][
      i % 4
    ],
    phone: `(11) 9${String(82000000 + i * 1234)}`,
    address: `Rua das Flores, ${120 + i * 47}`,
    city: i % 4 === 2 ? "Osasco" : "São Paulo",
    neighborhood: [
      "Vila Esperança",
      "Santana",
      "Centro",
      "Vila Mariana",
      "Lapa",
      "Pinheiros",
    ][i % 6],
    createdAt: "2025-01-01",
  }));
  const orders: Order[] = [];
  clients.forEach((c, i) => {
    for (let year = 2025; year <= 2026; year++)
      for (let month = 1; month <= (year === 2026 ? 10 : 12); month++) {
        if (year === 2026 && month >= 9 && [4, 8].includes(i)) continue;
        const count =
          i === 6 && year === 2026 && month === 10 ? 8 : 3 + ((i + month) % 5);
        const items = Array.from({ length: count }, (_, j) => ({
          productId: `p${1 + ((i * 2 + j + (month % 4 === 0 ? 2 : 0)) % 12)}`,
          boxes: Math.max(
            2,
            Math.round(
              (12 + i * 2 + ((month * 7 + i) % 13)) *
                (year === 2026
                  ? [1, 3, 6, 9].includes(i)
                    ? 1.32
                    : [2, 5, 10].includes(i)
                      ? 0.58
                      : 1.08
                  : 1),
            ),
          ),
        }));
        const date = `${year}-${String(month).padStart(2, "0")}-12`;
        orders.push({
          id: `PED-${year}-${month}-${i + 1}`,
          clientId: c.id,
          sellerId: c.sellerId,
          placedAt: date,
          items,
          status:
            year === 2026 && month === 10
              ? i % 3 === 0
                ? "Em transporte"
                : i % 3 === 1
                  ? "Em preparação"
                  : "Entregue"
              : "Entregue",
          expectedDeliveryAt: date.slice(0, 8) + "24",
          ...(year === 2025 || month < 10
            ? { deliveredAt: date.slice(0, 8) + "15" }
            : {}),
        });
      }
  });
  return {
    version: 2,
    clients,
    orders,
    visits: [
      {
        id: "visit-demo",
        sellerId: "victoria",
        clientId: "c1",
        scheduledAt: "2026-10-22T09:00",
        checkInAt: "2026-10-22T09:02:00",
        checkOutAt: "2026-10-22T09:31:00",
        status: "Concluída",
        result: "Apresentação de mix",
        notes: "Cliente demonstrou interesse em cortes de frango e suíno.",
      },
      {
        id: "visit-next",
        sellerId: "victoria",
        clientId: "c2",
        scheduledAt: "2026-10-26T10:00",
        status: "Agendada",
        result: "",
        notes: "Revisar oportunidades de mix.",
      },
    ],
    issues: [
      {
        id: "issue-demo",
        sellerId: "victoria",
        clientId: "c3",
        orderId: "PED-2026-10-3",
        type: "Divergência de quantidade",
        description:
          "Cliente relata duas caixas faltantes. Conferência demonstrativa em andamento.",
        status: "Aberto",
        createdAt: "2026-10-20",
        resolution: "",
      },
    ],
    events: [],
  };
}
