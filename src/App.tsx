import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Trophy,
  Truck,
  Users,
  X,
  AlertCircle,
  RotateCcw,
  Phone,
  Menu,
  CircleHelp,
  Leaf,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DEMO_DATE, products, seedData, sellers } from "./data";
import {
  change,
  dateLabel,
  dateTimeLabel,
  ipc,
  metrics,
  months,
  period,
  portfolio,
  productStats,
  recommendations,
  situation,
  total,
  trendLabel,
  valid,
  xpEvents,
} from "./domain";
import { loadData, saveData } from "./storage";
import type { Client, Data, Order, OrderItem, OrderStatus } from "./types";

const number = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const statuses: OrderStatus[] = [
  "Registrado",
  "Em preparação",
  "Em transporte",
  "Entregue",
  "Ocorrência na entrega",
  "Cancelado",
];
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const uid = () => `local-${Date.now()}-${crypto.randomUUID()}`;
const nav = [
  { id: "carteira", label: "Minha carteira", icon: Users },
  { id: "visitas", label: "Visitas", icon: CalendarDays },
  { id: "pedidos", label: "Pedidos e entregas", icon: Truck },
  { id: "desempenho", label: "Desempenho", icon: BarChart3 },
];
function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
function Empty({
  text = "Nenhum resultado encontrado.",
  children,
}: {
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Search size={30} />
      <h3>{text}</h3>
      <p>Tente outro período ou ajuste os filtros.</p>
      {children}
    </div>
  );
}
function Metric({
  label,
  value,
  unit,
  icon: Icon = Box,
  detail,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: typeof Box;
  detail?: ReactNode;
  tone?: string;
}) {
  return (
    <article className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="metric-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}
function Chart({
  data,
  kind = "volume",
}: {
  data: {
    name: string;
    volume: number | null;
    ipc: number | null;
    prior?: number | null;
  }[];
  kind?: "volume" | "ipc";
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={
        kind === "volume"
          ? "Evolução mensal do volume em caixas"
          : "Evolução mensal dos produtos distintos"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        {kind === "volume" ? (
          <AreaChart
            data={data}
            margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#68B1D7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#68B1D7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#e8eef2"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#748994", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#748994", fontSize: 11 }}
            />
            <Tooltip
              formatter={(v) => [`${v} caixas`, "Volume"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #dce8ee" }}
            />
            <Area
              isAnimationActive={false}
              name="Ano anterior"
              dataKey="prior"
              type="monotone"
              stroke="#C1D0F5"
              strokeDasharray="4 4"
              fill="transparent"
              strokeWidth={2}
            />
            <Area
              isAnimationActive={false}
              name="Volume"
              dataKey="volume"
              type="monotone"
              stroke="#237899"
              fill="url(#volumeFill)"
              strokeWidth={3}
            />
          </AreaChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#e8eef2" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#748994", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#748994", fontSize: 11 }}
            />
            <Tooltip formatter={(v) => [`${v} produtos`, "IPC"]} />
            <Bar
              isAnimationActive={false}
              dataKey="ipc"
              fill="#A0D6D4"
              radius={[5, 5, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = document.querySelector<HTMLElement>(".modal");
    el?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = old;
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
            'button,input,select,textarea,[tabindex="0"]',
          );
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}>
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function downloadCSV(rows: string[][], filename: string) {
  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row.map((v) => '"' + v.replaceAll('"', '""') + '"').join(";"),
      )
      .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [initial] = useState(loadData);
  const [data, setData] = useState<Data>(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const [canSave, setCanSave] = useState(!initial.error);
  const [sellerId, setSellerId] = useState(() => {
    try {
      return localStorage.getItem("ac-seller") || "";
    } catch {
      return "";
    }
  });
  const [loginSeller, setLoginSeller] = useState("victoria");
  const seller = sellers.find((s) => s.id === sellerId);
  const [route, setRoute] = useState(
    () => location.hash.slice(1) || "carteira",
  );
  const [key, setKey] = useState("2026-10");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [sort, setSort] = useState("Nome");
  const [profile, setProfile] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<
    null | "order" | "visit" | "issue" | "help" | "reset"
  >(null);
  const [modalClient, setModalClient] = useState("");
  const [issueOrder, setIssueOrder] = useState("");
  const [tab, setTab] = useState("Visão geral");
  const [category, setCategory] = useState("Todas");
  const [productFilter, setProductFilter] = useState("Todos");
  const [orderFilter, setOrderFilter] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("Todos");
  const [expandedOrder, setExpandedOrder] = useState("");
  const [ranking, setRanking] = useState("Volume");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitResult, setVisitResult] = useState("Venda realizada");
  const clients = data.clients.filter((c) => c.sellerId === sellerId);
  const orders = data.orders.filter((o) => o.sellerId === sellerId);
  const summary = portfolio(clients, orders, key);
  const client = clients.find((c) => route === `cliente/${c.id}`);
  const page = client ? "carteira" : route;
  const events = xpEvents(data, sellerId);
  const xp = events.reduce((n, e) => n + e.xp, 0);
  const level = Math.floor(xp / 50) + 1;
  useEffect(() => {
    const f = () => {
      setRoute(location.hash.slice(1) || "carteira");
      setTab("Visão geral");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    if (canSave)
      try {
        saveData(data);
        setStorageError("");
      } catch {
        setStorageError(
          "Armazenamento indisponível ou cheio. As alterações desta sessão não serão preservadas.",
        );
      }
  }, [data, canSave]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const navigate = (to: string) => {
    location.hash = to;
    setRoute(to);
    setMobileMenu(false);
    setSearch("");
    setTab("Visão geral");
    window.scrollTo(0, 0);
  };
  const notify = (message: string) => setToast(message);
  const openClient = (c: Client) => {
    const eventKey = `analysis:${sellerId}:${c.id}:${localDate()}`;
    setData((d) =>
      d.events.some((e) => e.eventKey === eventKey)
        ? d
        : {
            ...d,
            events: [
              ...d.events,
              {
                id: uid(),
                eventKey,
                sellerId,
                type: "Análise de cliente",
                xp: 1,
                createdAt: new Date().toISOString(),
              },
            ],
          },
    );
    navigate(`cliente/${c.id}`);
  };
  const logout = () => {
    setSellerId("");
    try {
      localStorage.removeItem("ac-seller");
    } catch {}
    setProfile(false);
    setModal(null);
    navigate("carteira");
  };
  const scopedOrders = (c: Client) => orders.filter((o) => o.clientId === c.id);
  const visible = useMemo(
    () =>
      clients
        .filter((c) =>
          `${c.name} ${c.city} ${c.neighborhood} ${c.businessType}`
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")),
        )
        .filter((c) => {
          const o = orders.filter((o) => o.clientId === c.id),
            s = situation(o, key);
          return (
            filter === "Todos" ||
            (filter === "Positivados" && total(period(o, key)) > 0) ||
            (filter === "Sem compra" && s === "Sem compra") ||
            (filter === "Em crescimento" && s === "Em crescimento") ||
            (filter === "Em queda" && s === "Em queda")
          );
        })
        .sort((a, b) =>
          sort === "Volume"
            ? total(
                period(
                  orders.filter((o) => o.clientId === b.id),
                  key,
                ),
              ) -
              total(
                period(
                  orders.filter((o) => o.clientId === a.id),
                  key,
                ),
              )
            : a.name.localeCompare(b.name),
        ),
    [clients, orders, key, filter, sort, search],
  );
  const openForm = (
    type: "order" | "visit" | "issue",
    id = client?.id ?? clients[0]?.id ?? "",
  ) => {
    setModalClient(id);
    setIssueOrder("");
    setModal(type);
  };
  const exportClients = () => {
    downloadCSV(
      [
        ["Cliente", "Período", "Volume (caixas)", "IPC", "Bench", "Situação"],
        ...visible.map((c) => {
          const m = metrics(scopedOrders(c), key);
          return [
            c.name,
            key,
            String(m.volume),
            String(m.ipc),
            String(m.bench.volume),
            situation(scopedOrders(c), key),
          ];
        }),
      ],
      `carteira-${key}.csv`,
    );
    notify("Relatório CSV exportado.");
  };
  const currentVisits = data.visits.filter((v) => v.sellerId === sellerId);
  const activeVisit = currentVisits.find((v) => v.status === "Em andamento");
  const startVisit = (clientId: string, visitId?: string) => {
    if (activeVisit) {
      notify("Finalize a visita em andamento antes de iniciar outra.");
      return;
    }
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      visits: visitId
        ? d.visits.map((v) =>
            v.id === visitId
              ? { ...v, status: "Em andamento", checkInAt: now }
              : v,
          )
        : [
            ...d.visits,
            {
              id: uid(),
              clientId,
              sellerId,
              scheduledAt: now,
              checkInAt: now,
              status: "Em andamento",
              result: "",
              notes: "",
            },
          ],
    }));
    notify("Visita iniciada. O horário de chegada foi registrado.");
  };
  const endVisit = () => {
    if (!activeVisit) return;
    if (!visitResult.trim()) {
      notify("Informe o resultado da visita.");
      return;
    }
    setData((d) => ({
      ...d,
      visits: d.visits.map((v) =>
        v.id === activeVisit.id
          ? {
              ...v,
              status: "Concluída",
              checkOutAt: new Date().toISOString(),
              result: visitResult,
              notes: visitNotes.trim(),
            }
          : v,
      ),
    }));
    setVisitNotes("");
    notify("Visita concluída e salva.");
  };
  const setOrderStatus = (order: Order, status: OrderStatus) => {
    setData((d) => ({
      ...d,
      orders: d.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status,
              deliveredAt:
                status === "Entregue" ? new Date().toISOString() : undefined,
            }
          : o,
      ),
    }));
    notify(
      status === "Cancelado"
        ? "Pedido cancelado. Indicadores e XP recalculados."
        : "Situação do pedido atualizada.",
    );
  };
  function series(source: Order[], year = key.slice(0, 4)) {
    return months.map((name, i) => {
      const month = String(i + 1).padStart(2, "0"),
        future =
          `${year}-${month}` > DEMO_DATE.slice(0, 7) &&
          !period(source, `${year}-${month}`).length;
      return {
        name: name.slice(0, 3),
        volume: future ? null : total(period(source, `${year}-${month}`)),
        ipc: future ? null : ipc(period(source, `${year}-${month}`)),
        prior: total(period(source, `${Number(year) - 1}-${month}`)),
      };
    });
  }
  const periodSelect = (
    <div className="period-select">
      <CalendarDays size={17} />
      <label className="sr-only" htmlFor="month">
        Mês de análise
      </label>
      <select
        id="month"
        aria-label="Mês de análise"
        value={key.slice(5)}
        onChange={(e) => setKey(`${key.slice(0, 4)}-${e.target.value}`)}
      >
        {months.map((m, i) => (
          <option
            key={m}
            value={String(i + 1).padStart(2, "0")}
            disabled={key.startsWith("2026") && i > 9}
          >
            {m}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="year">
        Ano de análise
      </label>
      <select
        id="year"
        aria-label="Ano de análise"
        value={key.slice(0, 4)}
        onChange={(e) =>
          setKey(
            `${e.target.value}-${e.target.value === "2026" && Number(key.slice(5)) > 10 ? "10" : key.slice(5)}`,
          )
        }
      >
        <option>2026</option>
        <option>2025</option>
      </select>
      <ChevronDown size={14} />
    </div>
  );

  if (!seller)
    return (
      <div className="login-page">
        <div className="login-story">
          <a className="brand" href="#">
            <img src="./logo.svg" alt="Logo AC" />
            <span>
              Analise de Carreira<small>ROTA IN NATURA · SEARA</small>
            </span>
          </a>
          <div className="login-copy">
            <span className="eyebrow light">
              <span /> CADA CLIENTE, UMA POSSIBILIDADE
            </span>
            <h1>
              Conheça sua carteira.
              <br />
              <em>
                Encontre seu próximo
                <br />
                grande resultado.
              </em>
            </h1>
            <p>
              Transforme o histórico da rota de frango e suíno em oportunidades
              para a sua próxima visita.
            </p>
            <div className="login-illustration">
              <div className="illustration-chart">
                <span className="mini-eyebrow">VISÃO QUE GERA RESULTADOS</span>
                <div className="mock-bars">
                  {[35, 58, 48, 75, 67, 92, 83].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="illustration-label">
                  <span>
                    <TrendingUp size={17} /> Mais clareza para vender
                  </span>
                  <span className="lime-dot" />
                </div>
              </div>
              <div className="floating-note">
                <Sparkles size={20} />
                <div>
                  Oportunidade identificada
                  <small>Seu próximo passo começa nos dados.</small>
                </div>
              </div>
            </div>
          </div>
          <p className="login-bottom">
            Menos dados dispersos. Mais decisões inteligentes.
          </p>
        </div>
        <div className="login-panel">
          <div className="login-box">
            <span className="badge aqua">
              <ShieldCheck size={14} /> Ambiente demonstrativo
            </span>
            <h2>
              Seu próximo resultado
              <br />
              começa aqui.
            </h2>
            <p>Acesse sua carteira e descubra novas oportunidades de venda.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSellerId(loginSeller);
                try {
                  localStorage.setItem("ac-seller", loginSeller);
                } catch {
                  setStorageError("Não foi possível salvar sua sessão.");
                }
                navigate("carteira");
              }}
            >
              <label htmlFor="seller">Selecione um perfil</label>
              <div className="seller-select">
                <div className="avatar">
                  {sellers.find((s) => s.id === loginSeller)?.avatar}
                </div>
                <select
                  id="seller"
                  value={loginSeller}
                  onChange={(e) => setLoginSeller(e.target.value)}
                >
                  {sellers.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
              <button className="button primary wide" type="submit">
                Entrar na minha carteira <ArrowRight size={19} />
              </button>
            </form>
            <div className="login-disclaimer">
              <CircleHelp size={17} />
              <p>
                Acesso sem senha, com dados fictícios. Este protótipo não
                utiliza autenticação de produção.
              </p>
            </div>
          </div>
          <footer>
            AC © 2026 · Feito para conectar dados e oportunidades.
          </footer>
        </div>
      </div>
    );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <button
          className="brand brand-button"
          onClick={() => navigate("carteira")}
        >
          <img src="./logo.svg" alt="Logo AC" />
          <span>
            Analise de Carreira<small>ROTA IN NATURA · SEARA</small>
          </span>
        </button>
        <div className="workspace-label">ESPAÇO COMERCIAL</div>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={page === id ? "nav-item active" : "nav-item"}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "carteira" && <small>{clients.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-growth">
          <span className="growth-icon">
            <Sparkles size={20} />
          </span>
          <h3>
            Seu próximo nível
            <br />
            começa na próxima visita.
          </h3>
          <p>Transforme oportunidades em conquistas.</p>
          <button onClick={() => navigate("desempenho")}>
            Ver meu desempenho <ArrowUpRight size={16} />
          </button>
          <div className="decorative-orbits" />
        </div>
        <button className="sidebar-help" onClick={() => setModal("help")}>
          <CircleHelp size={19} /> Sobre a demonstração{" "}
          <ArrowUpRight size={14} />
        </button>
        <div className="sidebar-user">
          <div className="avatar">{seller.avatar}</div>
          <div>
            <strong>{seller.name}</strong>
            <span>Vendedora de rota</span>
          </div>
          <button
            className="icon-button"
            aria-label="Sair e trocar de perfil"
            onClick={logout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir navegação"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={22} />
            </button>
            <span>Meu espaço</span>
            <ChevronRight size={14} />
            <strong>
              {client
                ? "Análise do cliente"
                : (nav.find((n) => n.id === page)?.label ?? "Minha carteira")}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="demo-label">
              <span /> Dados demonstrativos
            </span>
            <button
              className="profile-button"
              onClick={() => setProfile(!profile)}
              aria-label="Menu do perfil"
              aria-expanded={profile}
            >
              <div className="avatar small">{seller.avatar}</div>
              <span>{seller.name.split(" ")[0]}</span>
              <ChevronDown size={14} />
            </button>
            {profile && (
              <div className="profile-dropdown">
                <strong>{seller.name}</strong>
                <span>Perfil demonstrativo</span>
                <button
                  onClick={() => {
                    setModal("reset");
                    setProfile(false);
                  }}
                >
                  <RotateCcw size={15} /> Restaurar dados
                </button>
                <button onClick={logout}>
                  <LogOut size={15} /> Trocar de perfil
                </button>
              </div>
            )}
          </div>
        </header>
        <main>
          {storageError && (
            <div role="alert" className="notice error">
              <AlertCircle size={18} />
              {storageError}
            </div>
          )}
          {activeVisit && (
            <div className="notice ongoing">
              <Clock3 size={18} />
              <span>
                Visita em andamento ·{" "}
                {clients.find((c) => c.id === activeVisit.clientId)?.name}
              </span>
              <button onClick={() => navigate("visitas")}>
                Continuar visita <ArrowRight size={15} />
              </button>
            </div>
          )}
          {client ? (
            renderClient(client)
          ) : page === "carteira" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    SUA VISÃO COMERCIAL, MAIS CLARA
                  </span>
                  <h1>
                    Olá, {seller.name.split(" ")[0]}{" "}
                    <span className="greeting-spark">✦</span>
                  </h1>
                  <p>
                    Sua carteira, suas oportunidades. Vamos fazer bons negócios?
                  </p>
                </div>
                <div className="heading-actions">
                  {periodSelect}
                  <button className="button secondary" onClick={exportClients}>
                    <Download size={17} />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>
              <section className="welcome-banner">
                <div className="banner-icon">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <span className="mini-eyebrow">
                    UM NOVO OLHAR PARA SUAS VENDAS
                  </span>
                  <h2>
                    Grandes resultados começam
                    <br className="desktop-break" /> com boas oportunidades.
                  </h2>
                  <p>
                    {summary.attention} clientes precisam da sua atenção neste
                    período.
                    <br />
                    Seu próximo passo pode fazer a diferença.
                  </p>
                  <button
                    onClick={() => {
                      setFilter("Em queda");
                      document
                        .getElementById("client-list")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Explorar oportunidades <ArrowRight size={16} />
                  </button>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <div className="art-ring ring-one" />
                  <div className="art-ring ring-two" />
                  <div className="art-card">
                    <span className="art-icon">
                      <BarChart3 size={25} />
                    </span>
                    <div>
                      <span>Clareza em cada decisão</span>
                      <strong>
                        Potencial para crescer <ArrowUpRight size={19} />
                      </strong>
                    </div>
                    <div className="art-bars">
                      {[32, 47, 40, 65, 58, 82, 98].map((h, i) => (
                        <i key={i} style={{ height: h }} />
                      ))}
                    </div>
                  </div>
                  <div className="art-pill">
                    <span>
                      <Check size={15} />
                    </span>{" "}
                    Uma carteira. Muitas possibilidades.
                  </div>
                  <span className="art-star">✦</span>
                </div>
              </section>
              <section className="metrics-grid">
                <Metric
                  label="Clientes na carteira"
                  value={clients.length.toString().padStart(2, "0")}
                  icon={Users}
                  detail="Relacionamentos para cultivar"
                />
                <Metric
                  label="Clientes positivados"
                  value={summary.positive.toString().padStart(2, "0")}
                  icon={CheckCircle2}
                  tone="aqua"
                  detail={
                    <>
                      <strong className="positive">
                        {number(summary.rate)}%
                      </strong>{" "}
                      da carteira no período
                    </>
                  }
                />
                <Metric
                  label="Volume vendido"
                  value={number(summary.volume)}
                  unit="caixas"
                  icon={Box}
                  tone="lavender"
                  detail={
                    <>
                      <span className="small-dot" /> Pedidos válidos no período
                    </>
                  }
                />
                <Metric
                  label="Precisam de atenção"
                  value={String(summary.attention).padStart(2, "0")}
                  icon={Target}
                  tone="lime"
                  detail="Clientes em queda ou sem compra"
                />
              </section>
              <section id="client-list" className="client-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      Minha carteira{" "}
                      <span className="count-badge">
                        {clients.length} clientes
                      </span>
                    </h2>
                    <p>Conheça cada cliente. Descubra o próximo passo.</p>
                  </div>
                  <div className="list-view-label">
                    <LayoutGrid size={17} /> Visão em cards
                  </div>
                </div>
                <div className="list-controls">
                  <div className="search-input">
                    <Search size={18} />
                    <input
                      aria-label="Buscar clientes"
                      placeholder="Buscar cliente, bairro, cidade ou segmento..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        className="icon-button"
                        aria-label="Limpar busca"
                        onClick={() => setSearch("")}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <label className="sort-select">
                    <SlidersHorizontal size={16} />
                    <span>Ordenar por:</span>
                    <select
                      aria-label="Ordenar clientes"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option>Nome</option>
                      <option>Volume</option>
                    </select>
                  </label>
                </div>
                <div className="filter-row">
                  {[
                    "Todos",
                    "Positivados",
                    "Sem compra",
                    "Em crescimento",
                    "Em queda",
                  ].map((f) => (
                    <button
                      key={f}
                      className={`filter-chip ${filter === f ? "selected" : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === "Todos" && <LayoutGrid size={14} />} {f}
                      {f === "Todos" && <span>{clients.length}</span>}
                    </button>
                  ))}
                  <span className="results-count">
                    {visible.length}{" "}
                    {visible.length === 1 ? "cliente" : "clientes"} encontrado
                    {visible.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {visible.length ? (
                  <div className="client-grid">
                    {visible.map((c) => {
                      const o = scopedOrders(c),
                        m = metrics(o, key),
                        status = situation(o, key);
                      const last = o
                        .filter(valid)
                        .map((o) => o.placedAt)
                        .sort()
                        .at(-1);
                      const warning = data.issues.some(
                        (i) => i.clientId === c.id && i.status !== "Resolvido",
                      );
                      return (
                        <article className="client-card" key={c.id}>
                          <div className="client-card-top">
                            <div
                              className={`store-icon color-${Number(c.id.slice(1)) % 4}`}
                            >
                              <Store size={23} />
                            </div>
                            <Badge
                              tone={
                                status === "Em crescimento"
                                  ? "success"
                                  : status === "Em queda"
                                    ? "danger"
                                    : status === "Sem compra"
                                      ? "warning"
                                      : "neutral"
                              }
                            >
                              {status}
                            </Badge>
                          </div>
                          <h3>{c.name}</h3>
                          <span className="business-type">
                            {c.businessType}
                          </span>
                          <p className="location">
                            <MapPin size={13} />
                            {c.neighborhood} · {c.city}
                          </p>
                          <div className="client-numbers">
                            <div>
                              <span>Volume do mês</span>
                              <strong>
                                {number(m.volume)} <small>caixas</small>
                              </strong>
                            </div>
                            <div>
                              <span>vs. mês anterior</span>
                              <strong
                                className={`trend ${m.growth === null ? "muted" : m.growth >= 0 ? "positive" : "negative"}`}
                              >
                                {m.growth !== null &&
                                  (m.growth >= 0 ? (
                                    <ArrowUpRight size={16} />
                                  ) : (
                                    <ArrowDownLeft size={16} />
                                  ))}
                                {trendLabel(m.growth)}
                              </strong>
                            </div>
                          </div>
                          <div className="last-purchase">
                            <Clock3 size={13} />
                            <span>Última compra: {dateLabel(last)}</span>
                            {warning && (
                              <span
                                title="Ocorrência de pós-venda aberta"
                                className="issue-dot"
                              >
                                <AlertCircle size={14} />
                              </span>
                            )}
                          </div>
                          <button
                            className="analysis-button"
                            onClick={() => openClient(c)}
                          >
                            Ver análise <ArrowRight size={16} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <Empty>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setSearch("");
                        setFilter("Todos");
                      }}
                    >
                      Limpar filtros
                    </button>
                  </Empty>
                )}
              </section>
              <div className="insight-foot">
                <Leaf size={16} />
                <span>
                  Cada número conta uma história. Cada visita pode mudar o
                  resultado.
                </span>
                <span>
                  Período: {months[Number(key.slice(5)) - 1]} de{" "}
                  {key.slice(0, 4)}
                </span>
              </div>
            </>
          ) : page === "visitas" ? (
            renderVisits()
          ) : page === "pedidos" ? (
            renderOrders()
          ) : page === "desempenho" ? (
            renderPerformance()
          ) : (
            <Empty text="Página não encontrada">
              <button
                className="button primary"
                onClick={() => navigate("carteira")}
              >
                Voltar à carteira
              </button>
            </Empty>
          )}
        </main>
        <footer className="app-footer">
          <span>
            Analise de Carreira <span>·</span> Inteligência para ir além.
          </span>
          <span>
            Protótipo acadêmico · Dados fictícios · Base: 23 out. 2026
          </span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            className={page === id ? "active" : ""}
            key={id}
            onClick={() => navigate(id)}
          >
            <Icon size={21} />
            <span>
              {label === "Pedidos e entregas"
                ? "Pedidos"
                : label === "Minha carteira"
                  ? "Carteira"
                  : label}
            </span>
          </button>
        ))}
      </nav>
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={20} />
          {toast}
          <button aria-label="Dispensar aviso" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          title={
            modal === "order"
              ? "Novo pedido demonstrativo"
              : modal === "visit"
                ? "Agendar visita"
                : modal === "issue"
                  ? "Registrar ocorrência"
                  : modal === "reset"
                    ? "Restaurar demonstração"
                    : "Sobre este ambiente"
          }
          onClose={() => setModal(null)}
        >
          {modal === "order" ? (
            <OrderForm
              clients={clients}
              clientId={modalClient}
              onSave={(clientId, items, delivery) => {
                const date = localDate();
                const order: Order = {
                  id: uid(),
                  sellerId,
                  clientId,
                  placedAt: date,
                  items,
                  status: "Registrado",
                  expectedDeliveryAt: delivery,
                };
                setData((d) => ({ ...d, orders: [...d.orders, order] }));
                setKey(date.slice(0, 7));
                setModal(null);
                notify("Pedido registrado. Volume, IPC e XP atualizados.");
              }}
            />
          ) : modal === "visit" ? (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget),
                  scheduled = String(fd.get("scheduled"));
                if (new Date(scheduled).getTime() < Date.now()) {
                  notify("Escolha um horário futuro para a visita.");
                  return;
                }
                if (
                  currentVisits.some(
                    (v) =>
                      v.status !== "Concluída" &&
                      Math.abs(
                        new Date(v.scheduledAt).getTime() -
                          new Date(scheduled).getTime(),
                      ) <
                        30 * 60000,
                  )
                ) {
                  notify(
                    "Já existe uma visita em até 30 minutos desse horário.",
                  );
                  return;
                }
                setData((d) => ({
                  ...d,
                  visits: [
                    ...d.visits,
                    {
                      id: uid(),
                      sellerId,
                      clientId: String(fd.get("client")),
                      scheduledAt: scheduled,
                      status: "Agendada",
                      notes: String(fd.get("notes")).trim(),
                      result: "",
                    },
                  ],
                }));
                setModal(null);
                notify("Visita agendada.");
              }}
            >
              <ClientSelect clients={clients} initial={modalClient} />
              <label>
                Data e horário
                <input
                  type="datetime-local"
                  name="scheduled"
                  required
                  min={new Date(Date.now() + 60000)
                    .toLocaleString("sv-SE")
                    .replace(" ", "T")
                    .slice(0, 16)}
                />
              </label>
              <label>
                Observações
                <textarea
                  name="notes"
                  placeholder="O que você quer conversar com o cliente?"
                  maxLength={1000}
                />
              </label>
              <button className="button primary">
                Agendar visita <CalendarDays size={17} />
              </button>
            </form>
          ) : modal === "issue" ? (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const description = String(fd.get("description")).trim();
                if (description.length < 5) {
                  notify("Descreva a ocorrência com pelo menos 5 caracteres.");
                  return;
                }
                setData((d) => ({
                  ...d,
                  issues: [
                    ...d.issues,
                    {
                      id: uid(),
                      sellerId,
                      clientId: modalClient,
                      orderId: issueOrder || undefined,
                      type: String(fd.get("type")),
                      description,
                      status: "Aberto",
                      createdAt: new Date().toISOString(),
                      resolution: "",
                    },
                  ],
                }));
                setModal(null);
                notify("Ocorrência registrada para acompanhamento.");
              }}
            >
              <label>
                Cliente
                <select
                  value={modalClient}
                  onChange={(e) => {
                    setModalClient(e.target.value);
                    setIssueOrder("");
                  }}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pedido relacionado
                <select
                  value={issueOrder}
                  onChange={(e) => setIssueOrder(e.target.value)}
                >
                  <option value="">Sem pedido vinculado</option>
                  {orders
                    .filter((o) => o.clientId === modalClient)
                    .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id.startsWith("local-") ? "Novo pedido" : o.id} ·{" "}
                        {dateLabel(o.placedAt)}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Tipo de ocorrência
                <select name="type">
                  {[
                    "Atraso de entrega",
                    "Divergência de quantidade",
                    "Produto incorreto",
                    "Reclamação",
                    "Problema de atendimento",
                    "Outra ocorrência",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Descrição
                <textarea
                  name="description"
                  required
                  minLength={5}
                  maxLength={1500}
                  placeholder="Descreva o que aconteceu..."
                />
              </label>
              <button className="button primary">Registrar ocorrência</button>
            </form>
          ) : modal === "reset" ? (
            <div className="form-stack">
              <p>
                Esta ação apaga pedidos, visitas e alterações locais de todos os
                perfis e recupera os dados fictícios iniciais. Sua sessão
                continua aberta.
              </p>
              <button
                className="button danger-button"
                onClick={() => {
                  const fresh = seedData();
                  try {
                    saveData(fresh);
                    setData(fresh);
                    setCanSave(true);
                    setStorageError("");
                    setModal(null);
                    setKey("2026-10");
                    notify("Dados demonstrativos restaurados.");
                    navigate("carteira");
                  } catch {
                    notify("Não foi possível restaurar o armazenamento local.");
                  }
                }}
              >
                Restaurar dados fictícios
              </button>
              <button
                className="button secondary"
                onClick={() => setModal(null)}
              >
                Manter meus dados
              </button>
            </div>
          ) : (
            <div className="about-content">
              <Badge tone="aqua">Protótipo acadêmico</Badge>
              <p>
                Analise de Carreira ajuda vendedores da rota in natura de frango
                e suíno a entender clientes e oportunidades. O catálogo é
                demonstrativo e não representa a lista oficial da Seara.
                Estabelecimentos, pedidos e entregas são fictícios.
              </p>
              <h3>Como interpretar seus indicadores</h3>
              <p>
                <strong>Volume:</strong> soma das caixas de pedidos válidos.
                Pedidos cancelados são excluídos.
              </p>
              <p>
                <strong>IPC:</strong> produtos distintos comprados no mês.
                Repetir um produto não aumenta o IPC.
              </p>
              <p>
                <strong>Bench:</strong> maior volume em um único mês de todo o
                histórico.
              </p>
              <p>
                O mês em andamento é parcial. Variações não representam uma
                previsão. Os dados ficam neste navegador, sem ERP,
                transportadora ou Minutinho de Ouro.
              </p>
              <p>
                Login e gamificação são demonstrativos. A integração com o
                sistema anterior depende do acesso ao código correspondente.
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );

  function renderClient(c: Client) {
    const own = scopedOrders(c),
      m = metrics(own, key),
      rec = recommendations(own, key),
      openIssues = data.issues.filter(
        (i) => i.clientId === c.id && i.status !== "Resolvido",
      );
    const shownProducts = productStats(own, key)
      .filter((row) => category === "Todas" || row.p.category === category)
      .filter(
        (row) => productFilter !== "Sem compra recente" || row.current === 0,
      )
      .sort((a, b) =>
        productFilter === "Mais vendidos" ? b.current - a.current : 0,
      );
    const year = Number(key.slice(0, 4)),
      cutoff = year === 2026 ? 10 : 12,
      annual = (y: number) =>
        own.filter(
          (o) =>
            valid(o) &&
            o.placedAt.startsWith(String(y)) &&
            Number(o.placedAt.slice(5, 7)) <= cutoff,
        );
    const annualNow = total(annual(year)),
      annualPrior = total(annual(year - 1));
    const last = own
        .filter(valid)
        .map((o) => o.placedAt)
        .sort()
        .at(-1),
      lastVisit = currentVisits
        .filter((v) => v.clientId === c.id && v.checkInAt)
        .sort((a, b) => b.checkInAt!.localeCompare(a.checkInAt!))[0];
    return (
      <>
        <button className="back-button" onClick={() => navigate("carteira")}>
          <ArrowLeft size={16} /> Voltar à carteira
        </button>
        <div className="page-heading client-title">
          <div>
            <span className="eyebrow">
              ANÁLISE DO CLIENTE · {c.id.toUpperCase().replace("C", "AC-00")}
            </span>
            <h1>{c.name}</h1>
            <p>
              {c.businessType} <span>·</span> {c.neighborhood}, {c.city}
            </p>
          </div>
          <div className="heading-actions">
            {periodSelect}
            <button
              className="button primary"
              onClick={() => openForm("order", c.id)}
            >
              <Plus size={17} /> Novo pedido
            </button>
          </div>
        </div>
        <div className="client-info">
          <span>
            <Users size={15} />
            {c.contactName}
          </span>
          <span>
            <Phone size={15} />
            {c.phone}
          </span>
          <span>
            <MapPin size={15} />
            {c.address}
          </span>
          <span>
            <Clock3 size={15} />
            Compra: {dateLabel(last)}
          </span>
          <span>
            <CalendarDays size={15} />
            Visita: {dateLabel(lastVisit?.checkInAt)}
          </span>
          <Badge tone="aqua">{situation(own, key)}</Badge>
        </div>
        {openIssues.length > 0 && (
          <div className="notice warning">
            <AlertCircle size={18} />
            <span>
              Este cliente possui {openIssues.length} ocorrência
              {openIssues.length > 1 ? "s" : ""} de pós-venda pendente
              {openIssues.length > 1 ? "s" : ""}.
            </span>
            <button onClick={() => setTab("Operação")}>
              Ver ocorrências <ArrowRight size={15} />
            </button>
          </div>
        )}
        <section className="metrics-grid client-metrics">
          <Metric
            label="Volume do mês"
            value={number(m.volume)}
            unit="caixas"
            detail={
              <span
                className={
                  m.growth !== null && m.growth < 0 ? "negative" : "positive"
                }
              >
                {trendLabel(m.growth)} vs. mês anterior
              </span>
            }
          />
          <Metric
            label="IPC do mês"
            value={m.ipc}
            unit="produtos"
            icon={Package}
            tone="aqua"
            detail={`${m.previousIpc} produtos no mês anterior`}
          />
          <Metric
            label="Bench histórico"
            value={number(m.bench.volume)}
            unit="caixas"
            icon={Trophy}
            tone="lime"
            detail={
              m.bench.key
                ? `${months[Number(m.bench.key.slice(5)) - 1]} de ${m.bench.key.slice(0, 4)}`
                : "Sem histórico"
            }
          />
          <Metric
            label="Maior IPC histórico"
            value={m.maxIpc.ipc}
            unit="produtos"
            icon={Target}
            tone="lavender"
            detail={
              m.maxIpc.key
                ? `${months[Number(m.maxIpc.key.slice(5)) - 1]} de ${m.maxIpc.key.slice(0, 4)}`
                : "Sem histórico"
            }
          />
        </section>
        <div className="tabs" role="tablist" aria-label="Seções da análise">
          {["Visão geral", "Produtos e mix", "Oportunidades", "Operação"].map(
            (t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Oportunidades" && <small>{rec.text.length}</small>}
              </button>
            ),
          )}
        </div>
        {tab === "Visão geral" ? (
          <>
            <div className="analysis-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Evolução comercial</h2>
                    <p>Volume mensal de caixas · {year}</p>
                  </div>
                  <Badge tone="aqua">
                    <span className="small-dot" />
                    {year}
                  </Badge>
                </div>
                <Chart data={series(own)} />
                <div className="chart-legend">
                  <span>
                    <i />
                    {year}
                  </span>
                  <span>
                    <i className="prior" />
                    {year - 1} · comparação
                  </span>
                </div>
                <div className="panel-note">
                  <Trophy size={17} />
                  {m.bench.key
                    ? `Recorde: ${m.bench.volume} caixas em ${months[Number(m.bench.key.slice(5)) - 1].toLowerCase()} de ${m.bench.key.slice(0, 4)}.`
                    : "Ainda não há pedidos válidos."}
                </div>
              </section>
              <section className="panel bench-panel">
                <span className="icon-tile lime">
                  <Trophy size={24} />
                </span>
                <h2>Seu próximo recorde</h2>
                <p>
                  Cada caixa aproxima você do melhor resultado deste cliente.
                </p>
                <div className="bench-percent">
                  {number(m.achievement)}
                  <span>%</span>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${Math.min(100, m.achievement)}%` }} />
                </div>
                <div className="bench-label">
                  <span>{m.volume} caixas no mês</span>
                  <strong>{m.bench.volume} de bench</strong>
                </div>
                <div className="bench-insight">
                  {m.volume >= m.bench.volume && m.volume > 0 ? (
                    <>
                      <CheckCircle2 size={19} />
                      <span>Recorde histórico alcançado!</span>
                    </>
                  ) : (
                    <>
                      <Target size={19} />
                      <span>
                        Faltam{" "}
                        <strong>{m.bench.volume - m.volume} caixas</strong> para
                        igualar o seu recorde.
                      </span>
                    </>
                  )}
                </div>
              </section>
            </div>
            <div className="analysis-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Comparação anual</h2>
                    <p>
                      Períodos equivalentes: janeiro a{" "}
                      {months[cutoff - 1].toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="annual-comparison">
                  <div>
                    <span>{year - 1}</span>
                    <strong>
                      {number(annualPrior)} <small>caixas</small>
                    </strong>
                    <p>
                      Melhor mês:{" "}
                      {Math.max(
                        0,
                        ...metrics(own, `${year - 1}-01`)
                          .history.filter((h) =>
                            h.key.startsWith(String(year - 1)),
                          )
                          .map((h) => h.volume),
                      )}{" "}
                      caixas
                    </p>
                  </div>
                  <ArrowRight size={22} />
                  <div>
                    <span>{year}</span>
                    <strong>
                      {number(annualNow)} <small>caixas</small>
                    </strong>
                    <p>Melhor mês: {m.bestYear} caixas</p>
                  </div>
                </div>
                <div className="panel-note">
                  <TrendingUp size={18} />{" "}
                  {trendLabel(change(annualNow, annualPrior))} entre os períodos
                  equivalentes. Acumulado completo de {year}: {m.yearTotal}{" "}
                  caixas.
                </div>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Evolução do mix</h2>
                    <p>IPC · produtos distintos por mês</p>
                  </div>
                  <Package size={20} />
                </div>
                <Chart data={series(own)} kind="ipc" />
                <div className="panel-note">
                  Média dos meses com pedidos:{" "}
                  {number(
                    m.history
                      .filter((h) => h.key.startsWith(String(year)))
                      .reduce((n, h) => n + h.ipc, 0) /
                      (m.history.filter((h) => h.key.startsWith(String(year)))
                        .length || 1),
                  )}{" "}
                  produtos.
                </div>
              </section>
            </div>
            <section className="panel quick-opportunity">
              <span className="icon-tile aqua">
                <Sparkles size={22} />
              </span>
              <div>
                <h3>Um bom próximo passo</h3>
                <p>{rec.text[0]}</p>
              </div>
              <button
                className="button secondary"
                onClick={() => setTab("Oportunidades")}
              >
                Ver oportunidades <ArrowRight size={17} />
              </button>
            </section>
          </>
        ) : tab === "Produtos e mix" ? (
          <>
            <div className="section-heading">
              <div>
                <h2>Os produtos contam a história</h2>
                <p>
                  Cortes de frango e suíno · imagens ilustrativas · quantidades
                  derivadas dos pedidos válidos.
                </p>
              </div>
            </div>
            <div className="list-controls">
              <label className="form-inline">
                Categoria
                <select
                  aria-label="Categoria de produtos"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["Todas", ...new Set(products.map((p) => p.category))].map(
                    (cat) => (
                      <option key={cat}>{cat}</option>
                    ),
                  )}
                </select>
              </label>
              <div className="filter-row">
                {["Todos", "Mais vendidos", "Sem compra recente"].map((f) => (
                  <button
                    className={`filter-chip ${productFilter === f ? "selected" : ""}`}
                    key={f}
                    onClick={() => setProductFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {rec.lost.length > 0 && (
              <div className="notice warning">
                <AlertCircle size={18} />
                <span>
                  Saíram do mix em relação ao mês anterior:{" "}
                  {rec.lost.map((p) => p.name).join(", ")}.
                </span>
              </div>
            )}
            {!shownProducts.length && (
              <Empty text="Nenhum produto para estes filtros." />
            )}
            <div className="product-grid">
              {shownProducts.map(({ p, current, prior, annual, last }) => (
                <article className="product-card" key={p.id}>
                  <div className="product-image">
                    <img src={p.image} alt={`Ilustração de ${p.name}`} />
                    <span>Ilustrativo</span>
                  </div>
                  <div className="product-body">
                    <span className="mini-eyebrow">
                      {p.category} · {p.sku}
                    </span>
                    <h3>{p.name}</h3>
                    <div className="product-amount">
                      <strong>
                        {current}
                        <small> caixas no mês</small>
                      </strong>
                      <span
                        className={current >= prior ? "positive" : "negative"}
                      >
                        {trendLabel(change(current, prior))}
                      </span>
                    </div>
                    <div className="product-detail">
                      <span>
                        Ano: <strong>{annual} caixas</strong>
                      </span>
                      <span>Última: {dateLabel(last)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : tab === "Oportunidades" ? (
          <>
            <div className="section-heading">
              <div>
                <h2>Oportunidades para este cliente</h2>
                <p>
                  Recomendações locais baseadas no histórico. Valide cada
                  abordagem com o cliente.
                </p>
              </div>
              <Sparkles className="accent" size={24} />
            </div>
            <div className="opportunity-grid">
              {rec.text.map((text, i) => (
                <article className="panel opportunity" key={text}>
                  <span className={`icon-tile ${i % 2 ? "aqua" : "lavender"}`}>
                    <Sparkles size={22} />
                  </span>
                  <span className="mini-eyebrow">
                    OPORTUNIDADE {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{text.split(":")[0]}</h3>
                  <p>
                    {text.includes(":")
                      ? text.split(":").slice(1).join(":")
                      : text}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => openForm("visit", c.id)}
                  >
                    Planejar uma visita <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </div>
            <section className="panel">
              <h3>
                Produtos que ainda não fazem parte do histórico até este período
              </h3>
              <div className="suggested-products">
                {rec.fresh.map((p) => (
                  <div key={p.id}>
                    <img src={p.image} alt="" />
                    <span>
                      {p.name}
                      <small>{p.category}</small>
                    </span>
                  </div>
                ))}
                {!rec.fresh.length && (
                  <p>O cliente já experimentou todo o catálogo.</p>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="operation-actions">
              <button
                className="button primary"
                disabled={!!activeVisit}
                onClick={() => startVisit(c.id)}
              >
                <MapPin size={17} /> Iniciar visita
              </button>
              <button
                className="button secondary"
                onClick={() => openForm("visit", c.id)}
              >
                <CalendarDays size={17} /> Agendar visita
              </button>
              <button
                className="button secondary"
                onClick={() => openForm("issue", c.id)}
              >
                <AlertCircle size={17} /> Registrar ocorrência
              </button>
            </div>
            {renderVisits(c.id)}
            {renderOrders(c.id)}
            {renderIssues(c.id)}
          </>
        )}
        <div className="client-switch">
          <span>Navegue pela sua carteira</span>
          <select
            aria-label="Trocar cliente em análise"
            value={c.id}
            onChange={(e) => {
              const next = clients.find((c) => c.id === e.target.value);
              if (next) openClient(next);
            }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <p className="data-note">
          Dados demonstrativos.{" "}
          {key === DEMO_DATE.slice(0, 7)
            ? "Outubro é um mês parcial; comparações com meses completos exigem contexto."
            : ""}{" "}
          Nenhuma recomendação garante resultado.
        </p>
      </>
    );
  }
  function renderVisits(clientId?: string) {
    const list = currentVisits
      .filter((v) => !clientId || v.clientId === clientId)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    return (
      <section className={clientId ? "panel operation-panel" : ""}>
        {!clientId && (
          <div className="page-heading">
            <div>
              <span className="eyebrow">PRESENÇA QUE FAZ A DIFERENÇA</span>
              <h1>Visitas</h1>
              <p>Organize sua rota e esteja mais perto de cada cliente.</p>
            </div>
            <button
              className="button primary"
              onClick={() => openForm("visit")}
            >
              <Plus size={17} /> Agendar visita
            </button>
          </div>
        )}
        {clientId && <h2>Histórico de visitas</h2>}
        {activeVisit && (!clientId || activeVisit.clientId === clientId) && (
          <section className="panel active-visit">
            <Badge tone="success">Visita em andamento</Badge>
            <h3>{clients.find((c) => c.id === activeVisit.clientId)?.name}</h3>
            <p>Chegada registrada: {dateTimeLabel(activeVisit.checkInAt!)}</p>
            <div className="form-row">
              <label>
                Resultado
                <select
                  value={visitResult}
                  onChange={(e) => setVisitResult(e.target.value)}
                >
                  {[
                    "Venda realizada",
                    "Apresentação de mix",
                    "Acompanhamento comercial",
                    "Sem venda",
                    "Cliente ausente",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Observações
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  maxLength={1000}
                  placeholder="Registre os pontos importantes..."
                />
              </label>
            </div>
            <button className="button primary" onClick={endVisit}>
              <Check size={17} /> Finalizar visita
            </button>
          </section>
        )}
        {!list.length ? (
          <Empty text="Nenhuma visita registrada." />
        ) : (
          <div className="visit-list">
            {list.map((v) => (
              <article className="visit-card" key={v.id}>
                <div className="visit-date">
                  <CalendarDays size={21} />
                  <strong>{new Date(v.scheduledAt).getDate()}</strong>
                  <span>
                    {months[new Date(v.scheduledAt).getMonth()].slice(0, 3)}
                  </span>
                </div>
                <div className="visit-main">
                  <Badge
                    tone={
                      v.status === "Concluída"
                        ? "success"
                        : v.status === "Em andamento"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {v.status}
                  </Badge>
                  <h3>{clients.find((c) => c.id === v.clientId)?.name}</h3>
                  <p>
                    {dateTimeLabel(v.scheduledAt)}
                    {v.checkInAt && ` · Chegada: ${dateTimeLabel(v.checkInAt)}`}
                  </p>
                  {v.checkOutAt && (
                    <p>
                      Saída: {dateTimeLabel(v.checkOutAt)} · Duração:{" "}
                      {number(
                        Math.max(
                          0,
                          (new Date(v.checkOutAt).getTime() -
                            new Date(v.checkInAt!).getTime()) /
                            60000,
                        ),
                      )}{" "}
                      min
                    </p>
                  )}
                  {v.result && (
                    <p>
                      <strong>{v.result}</strong>
                    </p>
                  )}
                  {v.notes && <p>{v.notes}</p>}
                </div>
                {v.status === "Agendada" && (
                  <button
                    className="button secondary"
                    disabled={!!activeVisit}
                    onClick={() => startVisit(v.clientId, v.id)}
                  >
                    Iniciar visita <ArrowRight size={16} />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
        {!clientId && (
          <p className="data-note">
            Horários de chegada e saída são registrados em tempo real. Uma
            visita por vez para cada vendedor.
          </p>
        )}
      </section>
    );
  }
  function renderOrders(clientId?: string) {
    const list = orders
      .filter(
        (o) =>
          (!clientId || o.clientId === clientId) &&
          (!orderFilter || !!clientId || o.clientId === orderFilter) &&
          (orderStatusFilter === "Todos" || o.status === orderStatusFilter),
      )
      .sort(
        (a, b) =>
          b.placedAt.localeCompare(a.placedAt) || b.id.localeCompare(a.id),
      );
    return (
      <section className={clientId ? "panel operation-panel" : ""}>
        {!clientId ? (
          <div className="page-heading">
            <div>
              <span className="eyebrow">DO PEDIDO À ENTREGA</span>
              <h1>Pedidos e entregas</h1>
              <p>Acompanhe cada venda e cuide da experiência do cliente.</p>
            </div>
            <div className="heading-actions">
              <button
                className="button secondary"
                onClick={() => openForm("issue")}
              >
                <AlertCircle size={17} /> Ocorrência
              </button>
              <button
                className="button primary"
                onClick={() => openForm("order")}
              >
                <Plus size={17} /> Novo pedido
              </button>
            </div>
          </div>
        ) : (
          <h2>Pedidos deste cliente</h2>
        )}
        <div className="list-controls order-controls">
          {!clientId && (
            <label>
              Cliente
              <select
                aria-label="Filtrar pedidos por cliente"
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
              >
                <option value="">Todos os clientes</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Situação
            <select
              aria-label="Filtrar pedidos por situação"
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
            >
              {["Todos", ...statuses].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <span className="muted">
            {list.length} pedidos · histórico completo
          </span>
        </div>
        {!list.length ? (
          <Empty text="Nenhum pedido para estes filtros." />
        ) : (
          <div className="orders-list">
            {list.map((o) => (
              <article className="order-card" key={o.id}>
                <button
                  className="order-summary"
                  aria-expanded={expandedOrder === o.id}
                  onClick={() =>
                    setExpandedOrder(expandedOrder === o.id ? "" : o.id)
                  }
                >
                  <span className="order-box">
                    <Package size={22} />
                  </span>
                  <span className="order-name">
                    <strong>
                      {clients.find((c) => c.id === o.clientId)?.name}
                    </strong>
                    <small>
                      {o.id.startsWith("local-")
                        ? `PED-${o.id.slice(6, 19)}`
                        : o.id}{" "}
                      · {dateLabel(o.placedAt)}
                    </small>
                  </span>
                  <span className="order-volume">
                    {total([{ ...o, status: "Registrado" }])}
                    <small> caixas</small>
                  </span>
                  <Badge
                    tone={
                      o.status === "Entregue"
                        ? "success"
                        : o.status === "Cancelado"
                          ? "danger"
                          : o.status === "Ocorrência na entrega"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {o.status}
                  </Badge>
                  <ChevronDown size={18} />
                </button>
                {expandedOrder === o.id && (
                  <div className="order-details">
                    <div className="order-items">
                      {o.items.map((item) => (
                        <div key={item.productId}>
                          <img
                            src={
                              products.find((p) => p.id === item.productId)
                                ?.image
                            }
                            alt=""
                          />
                          <span>
                            {
                              products.find((p) => p.id === item.productId)
                                ?.name
                            }
                          </span>
                          <strong>{item.boxes} caixas</strong>
                        </div>
                      ))}
                    </div>
                    <p>
                      Previsão de entrega: {dateLabel(o.expectedDeliveryAt)}
                      {o.deliveredAt &&
                        ` · Entrega confirmada: ${dateLabel(o.deliveredAt)}`}
                    </p>
                    {o.status === "Cancelado" && (
                      <p className="negative">
                        Pedido excluído dos indicadores e recompensas.
                      </p>
                    )}
                    <div className="order-actions">
                      <label>
                        Atualizar situação
                        <select
                          aria-label={`Situação ${o.id}`}
                          value={o.status}
                          onChange={(e) =>
                            setOrderStatus(o, e.target.value as OrderStatus)
                          }
                        >
                          {statuses.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="button secondary"
                        onClick={() => {
                          setModalClient(o.clientId);
                          setIssueOrder(o.id);
                          setModal("issue");
                        }}
                      >
                        Registrar ocorrência
                      </button>
                      {o.status !== "Entregue" && o.status !== "Cancelado" && (
                        <button
                          className="button primary"
                          onClick={() => setOrderStatus(o, "Entregue")}
                        >
                          <Check size={16} /> Confirmar entrega
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {!clientId && renderIssues()}
      </section>
    );
  }
  function renderIssues(clientId?: string) {
    const issues = data.issues.filter(
      (i) => i.sellerId === sellerId && (!clientId || i.clientId === clientId),
    );
    return (
      <section className="issues-section">
        <div className="section-heading">
          <div>
            <h2>Pós-venda</h2>
            <p>Pequenos cuidados que fortalecem relacionamentos.</p>
          </div>
          <button
            className="button secondary"
            onClick={() => openForm("issue", clientId)}
          >
            <Plus size={16} /> Ocorrência
          </button>
        </div>
        {!issues.length ? (
          <div className="panel no-issues">
            <CheckCircle2 size={23} />
            <span>Nenhuma ocorrência registrada para esta carteira.</span>
          </div>
        ) : (
          issues.map((issue) => (
            <article className="panel issue-card" key={issue.id}>
              <div className="section-heading">
                <div>
                  <Badge
                    tone={issue.status === "Resolvido" ? "success" : "warning"}
                  >
                    {issue.status}
                  </Badge>
                  <h3>{issue.type}</h3>
                  <p>
                    {clients.find((c) => c.id === issue.clientId)?.name} ·{" "}
                    {dateLabel(issue.createdAt)}
                    {issue.orderId &&
                      ` · Pedido ${issue.orderId.startsWith("local-") ? issue.orderId.slice(6, 19) : issue.orderId}`}
                  </p>
                </div>
                <AlertCircle size={22} />
              </div>
              <p>{issue.description}</p>
              <form
                className="issue-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget),
                    status = String(fd.get("status")) as typeof issue.status,
                    resolution = String(fd.get("resolution")).trim();
                  if (status === "Resolvido" && resolution.length < 5) {
                    notify("Descreva a resolução com pelo menos 5 caracteres.");
                    return;
                  }
                  setData((d) => ({
                    ...d,
                    issues: d.issues.map((i) =>
                      i.id === issue.id
                        ? {
                            ...i,
                            status,
                            resolution,
                            resolvedAt:
                              status === "Resolvido"
                                ? new Date().toISOString()
                                : undefined,
                          }
                        : i,
                    ),
                  }));
                  notify("Acompanhamento atualizado.");
                }}
              >
                <label>
                  Status
                  <select
                    name="status"
                    defaultValue={issue.status}
                    aria-label={`Status ocorrência ${issue.id}`}
                  >
                    {["Aberto", "Em acompanhamento", "Resolvido"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Resolução / acompanhamento
                  <input
                    name="resolution"
                    defaultValue={issue.resolution}
                    placeholder="Descreva o próximo passo ou a solução"
                    maxLength={1500}
                  />
                </label>
                <button className="button secondary" type="submit">
                  Salvar
                </button>
              </form>
            </article>
          ))
        )}
      </section>
    );
  }
  function renderPerformance() {
    const rankingRows = clients
      .map((c) => ({ c, m: metrics(scopedOrders(c), key) }))
      .sort((a, b) =>
        ranking === "IPC"
          ? b.m.ipc - a.m.ipc
          : ranking === "Crescimento"
            ? (b.m.growth ?? -Infinity) - (a.m.growth ?? -Infinity)
            : ranking === "Distância do bench"
              ? b.m.bench.volume - b.m.volume - (a.m.bench.volume - a.m.volume)
              : b.m.volume - a.m.volume,
      );
    const potential = clients.filter(
      (c) => recommendations(scopedOrders(c), key).fresh.length > 0,
    ).length;
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">CADA AÇÃO, UM PASSO À FRENTE</span>
            <h1>Desempenho comercial</h1>
            <p>Uma visão completa dos resultados da sua carteira.</p>
          </div>
          {periodSelect}
        </div>
        <section className="metrics-grid">
          <Metric
            label="Volume vendido"
            value={number(summary.volume)}
            unit="caixas"
          />
          <Metric
            label="Taxa de positivação"
            value={number(summary.rate)}
            unit="%"
            icon={Users}
            tone="aqua"
            detail={`${summary.positive} de ${clients.length} clientes`}
          />
          <Metric
            label="IPC médio"
            value={number(summary.ipc)}
            icon={Package}
            tone="lavender"
            detail="Inclui todos os clientes, mesmo sem compra"
          />
          <Metric
            label="Pedidos válidos"
            value={summary.orders}
            icon={Truck}
            tone="lime"
            detail={`${orders.filter((o) => !["Entregue", "Cancelado"].includes(o.status)).length} entregas pendentes no histórico`}
          />
        </section>
        <div className="analysis-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Seu volume ao longo do ano</h2>
                <p>Caixas vendidas · {key.slice(0, 4)}</p>
              </div>
              <TrendingUp size={22} />
            </div>
            <Chart data={series(orders)} />
            <div className="panel-note">
              {summary.attention} clientes precisam de atenção · {potential}{" "}
              podem explorar novos produtos ·{" "}
              {currentVisits.filter((v) => v.status === "Concluída").length}{" "}
              visitas concluídas no histórico
            </div>
          </section>
          <section className="panel gamification">
            <div className="panel-heading">
              <span className="icon-tile lime">
                <Trophy size={25} />
              </span>
              <Badge tone="neutral">Gamificação demo</Badge>
            </div>
            <span className="eyebrow">EVOLUÇÃO QUE SE CONSTRÓI</span>
            <h2>
              Nível {level} · {level === 1 ? "Exploradora" : "Conectora"}
            </h2>
            <p>Ações úteis. Conquistas de verdade na demonstração.</p>
            <div className="xp-number">
              {xp}
              <small> XP total</small>
            </div>
            <div className="progress-track">
              <i style={{ width: `${((xp % 50) / 50) * 100}%` }} />
            </div>
            <div className="bench-label">
              <span>{xp % 50} / 50 XP neste nível</span>
              <strong>Próximo: nível {level + 1}</strong>
            </div>
            <div className="achievements">
              <span
                className={
                  events.some((e) => e.type === "Análise de cliente")
                    ? "earned"
                    : ""
                }
              >
                <Search size={20} />
                Primeiro olhar
              </span>
              <span
                className={
                  events.some((e) => e.type === "Visita concluída")
                    ? "earned"
                    : ""
                }
              >
                <MapPin size={20} />
                Em campo
              </span>
              <span
                className={
                  events.some((e) => e.type === "Pedido válido") ? "earned" : ""
                }
              >
                <Package size={20} />
                Primeira venda
              </span>
            </div>
            <p className="data-note">
              Sem integração externa. Recompensas de pedidos são recalculadas
              após cancelamento.
            </p>
          </section>
        </div>
        <section className="panel ranking">
          <div className="section-heading">
            <div>
              <h2>Quem movimenta sua carteira</h2>
              <p>Ranking por cliente no período selecionado.</p>
            </div>
            <label>
              Ordenar
              <select
                aria-label="Ordenar ranking"
                value={ranking}
                onChange={(e) => setRanking(e.target.value)}
              >
                {["Volume", "IPC", "Crescimento", "Distância do bench"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <div className="ranking-table">
            <div className="ranking-head">
              <span>CLIENTE</span>
              <span>VOLUME</span>
              <span>IPC</span>
              <span>VARIAÇÃO</span>
              <span>ATÉ O BENCH</span>
            </div>
            {rankingRows.map(({ c, m }, i) => (
              <button
                className="ranking-row"
                key={c.id}
                onClick={() => openClient(c)}
              >
                <span>
                  <small>{String(i + 1).padStart(2, "0")}</small>
                  <Store size={19} />
                  <strong>{c.name}</strong>
                </span>
                <span>{number(m.volume)} cx</span>
                <span>{m.ipc} produtos</span>
                <span
                  className={
                    m.growth !== null && m.growth < 0 ? "negative" : "positive"
                  }
                >
                  {trendLabel(m.growth)}
                </span>
                <span>
                  {m.bench.volume - m.volume} cx <ChevronRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel xp-history">
          <h2>Histórico de conquistas</h2>
          {events.length ? (
            <div>
              {[...events]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((e) => (
                  <div className="xp-event" key={e.id}>
                    <span className="xp-icon">
                      <Sparkles size={17} />
                    </span>
                    <span>
                      <strong>{e.type}</strong>
                      <small>{dateLabel(e.createdAt)}</small>
                    </span>
                    <Badge tone="success">+{e.xp} XP</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="muted">
              Seu histórico começa ao consultar um cliente, concluir uma visita
              ou registrar um pedido.
            </p>
          )}
          <p className="data-note">
            Análise +1 XP por cliente/dia · visita concluída +2 · acompanhamento
            +2 · pedido +3 · ampliar IPC em venda entregue +4 · superar bench
            +5.
          </p>
        </section>
      </>
    );
  }
}
function ClientSelect({
  clients,
  initial,
}: {
  clients: Client[];
  initial: string;
}) {
  return (
    <label>
      Cliente
      <select name="client" defaultValue={initial} required>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
function OrderForm({
  clients,
  clientId,
  onSave,
}: {
  clients: Client[];
  clientId: string;
  onSave: (c: string, items: OrderItem[], delivery: string) => void;
}) {
  const [selectedClient, setSelectedClient] = useState(clientId),
    [items, setItems] = useState<OrderItem[]>([
      { productId: products[0].id, boxes: 1 },
    ]),
    [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const delivery = String(new FormData(e.currentTarget).get("delivery"));
    if (
      !items.length ||
      items.some(
        (i) => !Number.isInteger(i.boxes) || i.boxes <= 0 || i.boxes > 9999,
      )
    ) {
      setError("Informe de 1 a 9.999 caixas inteiras por produto.");
      return;
    }
    if (new Set(items.map((i) => i.productId)).size !== items.length) {
      setError(
        "Um produto só pode aparecer uma vez no pedido. Some as caixas na mesma linha.",
      );
      return;
    }
    if (delivery < localDate()) {
      setError("A entrega deve ser hoje ou no futuro.");
      return;
    }
    onSave(selectedClient, items, delivery);
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <p className="form-description">
        Pedido simulado. Ao salvar, as caixas passam a compor os indicadores do
        mês atual.
      </p>
      <label>
        Cliente
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          required
        >
          {clients.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="order-form-items">
        <span className="form-label">Produtos e caixas</span>
        {items.map((item, index) => (
          <div className="order-item-input" key={index}>
            <select
              aria-label={`Produto ${index + 1}`}
              value={item.productId}
              onChange={(e) =>
                setItems(
                  items.map((v, i) =>
                    i === index ? { ...v, productId: e.target.value } : v,
                  ),
                )
              }
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              aria-label={`Caixas ${index + 1}`}
              min="1"
              max="9999"
              step="1"
              required
              value={item.boxes || ""}
              onChange={(e) =>
                setItems(
                  items.map((v, i) =>
                    i === index ? { ...v, boxes: Number(e.target.value) } : v,
                  ),
                )
              }
            />
            <button
              type="button"
              className="icon-button"
              disabled={items.length === 1}
              onClick={() => setItems(items.filter((_, i) => i !== index))}
              aria-label={`Remover produto ${index + 1}`}
            >
              <X size={17} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-button"
          disabled={items.length >= products.length}
          onClick={() => {
            const next = products.find(
              (p) => !items.some((i) => i.productId === p.id),
            );
            if (next) setItems([...items, { productId: next.id, boxes: 1 }]);
          }}
        >
          <Plus size={16} /> Adicionar produto
        </button>
      </div>
      <label>
        Previsão de entrega
        <input
          type="date"
          required
          name="delivery"
          min={localDate()}
          defaultValue={localDate()}
        />
      </label>
      <div className="order-total">
        <span>Total do pedido</span>
        <strong>{items.reduce((n, i) => n + i.boxes, 0)} caixas</strong>
      </div>
      {error && (
        <p className="negative" role="alert">
          {error}
        </p>
      )}
      <button className="button primary wide">
        Registrar pedido <ArrowRight size={17} />
      </button>
    </form>
  );
}
