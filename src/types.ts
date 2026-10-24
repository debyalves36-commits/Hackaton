export type OrderStatus =
  | "Registrado"
  | "Em preparação"
  | "Em transporte"
  | "Entregue"
  | "Ocorrência na entrega"
  | "Cancelado";
export interface Seller {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
}
export interface Client {
  id: string;
  sellerId: string;
  name: string;
  businessType: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  neighborhood: string;
  createdAt: string;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  image: string;
  active: boolean;
}
export interface OrderItem {
  productId: string;
  boxes: number;
}
export interface Order {
  id: string;
  clientId: string;
  sellerId: string;
  placedAt: string;
  items: OrderItem[];
  status: OrderStatus;
  expectedDeliveryAt: string;
  deliveredAt?: string;
}
export interface Visit {
  id: string;
  sellerId: string;
  clientId: string;
  scheduledAt: string;
  checkInAt?: string;
  checkOutAt?: string;
  result: string;
  notes: string;
  status: "Agendada" | "Em andamento" | "Concluída";
}
export interface AfterSalesIssue {
  id: string;
  sellerId: string;
  clientId: string;
  orderId?: string;
  type: string;
  description: string;
  status: "Aberto" | "Em acompanhamento" | "Resolvido";
  createdAt: string;
  resolvedAt?: string;
  resolution: string;
}
export interface GamificationEvent {
  id: string;
  sellerId: string;
  eventKey: string;
  type: string;
  xp: number;
  createdAt: string;
}
export interface Data {
  version: 1;
  clients: Client[];
  orders: Order[];
  visits: Visit[];
  issues: AfterSalesIssue[];
  events: GamificationEvent[];
}
