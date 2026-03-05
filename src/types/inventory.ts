export interface Product {
  id: string;
  code: string;
  barcode?: string;
  stock: number;
  min: number;
  location?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  unidade?: string;
}

export interface Transaction {
  id: string;
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  description: string;
  invoiceId?: string;
  discount?: number;
  unitPrice?: number;
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Invoice {
  id: string;
  number: string;
  issueDate: string;
  type: 'PURCHASE' | 'SALE';
  totalAmount: number;
  discount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  items: InvoiceItem[];
}

export interface Movement {
  id: string;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  productId: string;
  code: string;
  quantidade: number;
  placa?: string;
  responsavel?: string;
  observacao?: string;
  dataHora: number;
  createdAt: number;
}

export interface PurchaseRequest {
  id: string;
  productId?: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requesterId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  type: 'SALE' | 'COST';
  date: number;
}

export interface Truck {
  id: string;
  placa: string;
  filial?: string;
  tipo?: string;
  ativo: boolean;
}

export interface StorageLocation {
  id: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}
