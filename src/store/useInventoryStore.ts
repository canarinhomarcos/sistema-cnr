import { create } from 'zustand';
import { Product, Transaction, Invoice, PurchaseRequest, PriceHistory, Movement, Truck, StorageLocation } from '../types/inventory';
import { client } from '../api/client';

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
}

interface InventoryState {
  products: Product[];
  transactions: Transaction[];
  invoices: Invoice[];
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  movements: Movement[];
  trucks: Truck[];
  locations: StorageLocation[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
  fetchPriceHistory: (productId: string) => Promise<PriceHistory[]>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  bulkAddProducts: (products: Omit<Product, 'id'>[], mode?: 'add' | 'replace') => Promise<void>;
  replaceProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addMovement: (movement: Omit<Movement, 'id' | 'code' | 'createdAt'> & { newBalance?: number }) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  addPurchaseRequest: (request: Omit<PurchaseRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePurchaseRequest: (id: string, updates: Partial<PurchaseRequest>) => Promise<void>;
  addTruck: (truck: Omit<Truck, 'id'>) => Promise<void>;
  updateTruck: (id: string, updates: Partial<Truck>) => Promise<void>;
  deleteTruck: (id: string) => Promise<void>;
  bulkAddTrucks: (trucks: Omit<Truck, 'id'>[]) => Promise<void>;
  addLocation: (location: Omit<StorageLocation, 'id'>) => Promise<void>;
  updateLocation: (id: string, updates: Partial<StorageLocation>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  bulkAddLocations: (locations: Omit<StorageLocation, 'id'>[]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteProductsBulk: (ids: string[]) => Promise<void>;
  deleteAllProducts: () => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  searchImages: (query: string) => Promise<any[]>;
  exportToCSV: () => void;
  exportFullBackup: () => void;
  generateMissingBarcodes: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  transactions: [],
  invoices: [],
  suppliers: [],
  purchaseRequests: [],
  movements: [],
  trucks: [],
  locations: [],
  isLoading: false,

  fetchData: async () => {
    // Only show loading on first fetch or if empty
    if (get().products.length === 0) set({ isLoading: true });
    
    // Load locations from localStorage safely
    let locations: StorageLocation[] = [];
    try {
      const savedLocations = localStorage.getItem('cnr_locations');
      if (savedLocations) {
        locations = JSON.parse(savedLocations);
      }
    } catch (e) {
      console.error("Erro ao carregar locais do localStorage:", e);
    }

    if (!Array.isArray(locations)) locations = [];
    
    try {
      const [pRes, tRes, iRes, sRes, prRes, mRes, trRes] = await Promise.all([
        client.api.fetch("/api/products"),
        client.api.fetch("/api/transactions"),
        client.api.fetch("/api/invoices"),
        client.api.fetch("/api/suppliers"),
        client.api.fetch("/api/purchase-requests"),
        client.api.fetch("/api/movements"),
        client.api.fetch("/api/trucks"),
      ]);
      
      const [pData, tData, iData, sData, prData, mData, trData] = await Promise.all([
        pRes.json(),
        tRes.json(),
        iRes.json(),
        sRes.json(),
        prRes.json(),
        mRes.json(),
        trRes.json(),
      ]);

      set({ 
        products: (pData.data || []).map((p: any) => ({ 
          ...p, 
          code: p.code || p.sku,
          stock: p.stock ?? p.quantity ?? 0,
          min: p.min ?? p.minimo ?? p.minQuantity ?? 1
        })), 
        transactions: tData.data || [], 
        invoices: iData.data || [],
        suppliers: sData.data || [],
        purchaseRequests: prData.data || [],
        movements: (mData.data || []).map((m: any) => ({ ...m, code: m.code || m.sku })),
        trucks: (trData.data || []).map((t: any) => ({ ...t, ativo: t.ativo === 1 })),
        locations,
        isLoading: false 
      });
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      set({ isLoading: false, locations });
    }
  },

  addLocation: async (location) => {
    const newLocation = { ...location, id: Math.random().toString(36).substr(2, 9) };
    const updated = [newLocation, ...get().locations];
    set({ locations: updated });
    localStorage.setItem('cnr_locations', JSON.stringify(updated));
  },

  updateLocation: async (id, updates) => {
    const updated = get().locations.map(l => l.id === id ? { ...l, ...updates } : l);
    set({ locations: updated });
    localStorage.setItem('cnr_locations', JSON.stringify(updated));
  },

  deleteLocation: async (id) => {
    const updated = get().locations.filter(l => l.id !== id);
    set({ locations: updated });
    localStorage.setItem('cnr_locations', JSON.stringify(updated));
  },

  bulkAddLocations: async (newLocations) => {
    const current = get().locations;
    const seen = new Set(current.map(l => l.codigo.toUpperCase()));
    const toAdd = newLocations
      .filter(l => !seen.has(l.codigo.toUpperCase()))
      .map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9), codigo: l.codigo.toUpperCase() }));
    
    const updated = [...toAdd, ...current];
    set({ locations: updated });
    localStorage.setItem('cnr_locations', JSON.stringify(updated));
  },

  fetchPriceHistory: async (productId) => {
    try {
      const res = await client.api.fetch(`/api/price-history/${productId}`);
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.error("Erro ao buscar histórico de preços:", err);
      return [];
    }
  },

  addProduct: async (product) => {
    try {
      const res = await client.api.fetch("/api/products", {
        method: "POST",
        body: JSON.stringify(product),
      });
      const data = await res.json();
      set((state) => ({ products: [data.data, ...state.products] }));
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
    }
  },

  bulkAddProducts: async (products, mode = 'add') => {
    set({ isLoading: true });
    try {
      const res = await client.api.fetch("/api/products/bulk", {
        method: "POST",
        body: JSON.stringify({ products, mode }),
      });
      const data = await res.json();
      const updatedProducts = data.data || [];

      if (mode === 'replace') {
        set({ 
          products: updatedProducts.sort((a: Product, b: Product) => b.id.localeCompare(a.id)),
          transactions: [],
          invoices: [],
          movements: [],
          isLoading: false 
        });
      } else {
        // Merge updated products into existing list
        const currentProducts = get().products;
        const productMap = new Map(currentProducts.map(p => [p.id, p]));
        
        // Also map by CODE for updates
        const codeMap = new Map(currentProducts.map(p => [p.code || p.sku, p]));

        updatedProducts.forEach((p: Product) => {
          const existing = codeMap.get(p.code || p.sku) || productMap.get(p.id);
          if (existing) {
            productMap.set(existing.id, { ...existing, ...p });
          } else {
            productMap.set(p.id, p);
          }
        });

        set({ 
          products: Array.from(productMap.values()).sort((a, b) => b.id.localeCompare(a.id)),
          isLoading: false 
        });
      }
    } catch (err: any) {
      console.error("Erro na importação em massa:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  replaceProducts: async (newProducts) => {
    await get().bulkAddProducts(newProducts, 'replace');
  },

  updateProduct: async (id, updates) => {
    const previousProducts = get().products;
    
    // Optimistic update
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));

    try {
      const res = await client.api.fetch(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? data.data : p)),
      }));
    } catch (err) {
      // Rollback
      set({ products: previousProducts });
      console.error("Erro ao atualizar produto:", err);
    }
  },

  addTransaction: async (transaction) => {
    const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
    const previousProducts = get().products;
    const previousTransactions = get().transactions;

    // Optimistic update for product quantity
    const product = previousProducts.find((p) => p.id === transaction.productId);
    if (product) {
      const newQuantity = transaction.type === 'IN' 
        ? (product.quantity || 0) + transaction.quantity 
        : (product.quantity || 0) - transaction.quantity;
      
      set((state) => ({
        products: state.products.map((p) => 
          p.id === transaction.productId ? { ...p, quantity: newQuantity } : p
        ),
        transactions: [{ ...transaction, id: tempId } as any, ...state.transactions]
      }));
    }

    try {
      const res = await client.api.fetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify(transaction),
      });
      const data = await res.json();
      
      set((state) => ({
        transactions: state.transactions.map(t => t.id === tempId ? data.data : t)
      }));
    } catch (err) {
      // Rollback
      set({ products: previousProducts, transactions: previousTransactions });
      console.error("Erro ao adicionar transação:", err);
    }
  },

  addMovement: async (movement) => {
    const res = await client.api.fetch("/api/movements", {
      method: "POST",
      body: JSON.stringify(movement),
    });
    const data = await res.json();
    
    // Update local state
    const { products, movements } = get();
    const updatedMovements = [data.data, ...movements];
    
    // Update product quantity locally
    const productIndex = products.findIndex(p => p.id === movement.productId);
    if (productIndex !== -1) {
      const product = products[productIndex];
      let delta = 0;
      if (movement.tipo === 'ENTRADA') delta = movement.quantidade;
      else if (movement.tipo === 'SAIDA') delta = -movement.quantidade;
      else if (movement.tipo === 'AJUSTE') {
        if (movement.newBalance !== undefined) delta = movement.newBalance - product.stock;
        else delta = movement.quantidade;
      }
      
      const updatedProducts = [...products];
      updatedProducts[productIndex] = { ...product, stock: product.stock + delta };
      
      set({ products: updatedProducts, movements: updatedMovements });
    } else {
      set({ movements: updatedMovements });
    }
    
    // Refresh to be sure
    await get().fetchData();
  },

  addInvoice: async (invoice) => {
    const res = await client.api.fetch("/api/invoices", {
      method: "POST",
      body: JSON.stringify(invoice),
    });
    const data = await res.json();
    
    // Optimistic update: add the invoice and update product quantities
    const { products, invoices, transactions } = get();
    const newInvoices = [data.data, ...invoices];
    
    // If the invoice has items, we should update the products and add transactions
    // Note: The backend should ideally handle this, but we do it here for "instant" feel
    let updatedProducts = [...products];
    let newTransactions = [...transactions];

    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item: any) => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          const product = updatedProducts[productIndex];
          const newQuantity = invoice.type === 'PURCHASE' 
            ? (product.quantity || 0) + item.quantity 
            : (product.quantity || 0) - item.quantity;
          
          updatedProducts[productIndex] = { ...product, quantity: newQuantity };
          
          // Add a virtual transaction for the UI until next fetch
          newTransactions = [{
            id: `v-${Math.random()}`,
            productId: item.productId,
            type: invoice.type === 'PURCHASE' ? 'IN' : 'OUT',
            quantity: item.quantity,
            date: new Date().toISOString(),
            description: `NF #${invoice.number}`,
            invoiceId: data.data.id
          } as any, ...newTransactions];
        }
      });
    }

    set({ 
      invoices: newInvoices,
      products: updatedProducts,
      transactions: newTransactions
    });

    // Still fetch to ensure server sync
    await get().fetchData();
  },

  addSupplier: async (supplier) => {
    try {
      const res = await client.api.fetch("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(supplier),
      });
      const data = await res.json();
      set((state) => ({ suppliers: [data.data, ...state.suppliers] }));
    } catch (err) {
      console.error("Erro ao adicionar fornecedor:", err);
    }
  },

  addPurchaseRequest: async (request) => {
    try {
      const res = await client.api.fetch("/api/purchase-requests", {
        method: "POST",
        body: JSON.stringify(request),
      });
      const data = await res.json();
      set((state) => ({ purchaseRequests: [data.data, ...state.purchaseRequests] }));
    } catch (err) {
      console.error("Erro ao adicionar pedido de compra:", err);
    }
  },

  updatePurchaseRequest: async (id, updates) => {
    try {
      const res = await client.api.fetch(`/api/purchase-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      set((state) => ({
        purchaseRequests: state.purchaseRequests.map((r) => (r.id === id ? data.data : r)),
      }));
    } catch (err) {
      console.error("Erro ao atualizar pedido de compra:", err);
    }
  },

  addTruck: async (truck) => {
    try {
      const res = await client.api.fetch("/api/trucks", {
        method: "POST",
        body: JSON.stringify(truck),
      });
      const data = await res.json();
      set((state) => ({ trucks: [data.data, ...state.trucks] }));
    } catch (err) {
      console.error("Erro ao adicionar caminhão:", err);
    }
  },

  updateTruck: async (id, updates) => {
    try {
      const res = await client.api.fetch(`/api/trucks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      set((state) => ({
        trucks: state.trucks.map((t) => (t.id === id ? { ...data.data, ativo: data.data.ativo === 1 } : t)),
      }));
    } catch (err) {
      console.error("Erro ao atualizar caminhão:", err);
    }
  },

  deleteTruck: async (id) => {
    try {
      await client.api.fetch(`/api/trucks/${id}`, { method: "DELETE" });
      set((state) => ({ trucks: state.trucks.filter((t) => t.id !== id) }));
    } catch (err) {
      console.error("Erro ao excluir caminhão:", err);
    }
  },

  bulkAddTrucks: async (trucks) => {
    set({ isLoading: true });
    try {
      const res = await client.api.fetch("/api/trucks/bulk", {
        method: "POST",
        body: JSON.stringify({ trucks }),
      });
      const data = await res.json();
      const updatedTrucks = (data.data || []).map((t: any) => ({ ...t, ativo: t.ativo === 1 }));
      
      const currentTrucks = get().trucks;
      const truckMap = new Map(currentTrucks.map(t => [t.placa, t]));
      
      updatedTrucks.forEach((t: Truck) => {
        truckMap.set(t.placa, t);
      });

      set({ 
        trucks: Array.from(truckMap.values()).sort((a, b) => a.placa.localeCompare(b.placa)),
        isLoading: false 
      });
    } catch (err) {
      console.error("Erro na importação de caminhões:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  deleteProduct: async (id) => {
    try {
      await client.api.fetch(`/api/products/${id}`, { method: "DELETE" });
      set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
    }
  },

  deleteProductsBulk: async (ids) => {
    try {
      await client.api.fetch("/api/products/delete-bulk", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      set((state) => ({ products: state.products.filter((p) => !ids.includes(p.id)) }));
    } catch (err) {
      console.error("Erro ao excluir produtos em massa:", err);
    }
  },

  deleteAllProducts: async () => {
    try {
      await client.api.fetch("/api/products/delete-all", { method: "POST" });
      set({ products: [], transactions: [], invoices: [], movements: [] });
    } catch (err) {
      console.error("Erro ao limpar estoque:", err);
    }
  },

  deleteInvoice: async (id) => {
    try {
      await client.api.fetch(`/api/invoices/${id}`, { method: "DELETE" });
      await get().fetchData();
    } catch (err) {
      console.error("Erro ao excluir nota fiscal:", err);
    }
  },

  deleteTransaction: async (id) => {
    try {
      await client.api.fetch(`/api/transactions/${id}`, { method: "DELETE" });
      await get().fetchData();
    } catch (err) {
      console.error("Erro ao excluir transação:", err);
    }
  },

  searchImages: async (query) => {
    try {
      const res = await client.api.fetch(`/api/images/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.error("Erro ao buscar imagens:", err);
      return [];
    }
  },

  exportToCSV: () => {
    const { products } = get();
    const headers = ['CODE', 'Quantidade', 'Mínimo', 'Localização'];
    const rows = products.map(p => [
      p.code,
      p.stock,
      p.min,
      p.local || p.location
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `estoque_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportFullBackup: () => {
    const { products, transactions, invoices, suppliers, purchaseRequests, movements, trucks } = get();
    const data = {
      products,
      transactions,
      invoices,
      suppliers,
      purchaseRequests,
      movements,
      trucks,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `backup_estoque_full_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  generateMissingBarcodes: async () => {
    const { products, updateProduct } = get();
    const productsWithoutBarcode = products.filter(p => !p.barcode);
    
    if (productsWithoutBarcode.length === 0) {
      alert("Todos os produtos já possuem código de barras.");
      return;
    }

    if (!window.confirm(`Deseja gerar códigos de barras para ${productsWithoutBarcode.length} produtos?`)) {
      return;
    }

    set({ isLoading: true });
    try {
      const existingBarcodes = new Set(products.map(p => p.barcode).filter(b => !!b));
      
      let generated = 0;
      let conflicts = 0;
      let invalidSku = 0;

      for (const p of productsWithoutBarcode) {
        let newBarcode = "";
        const cleanCode = (p.code || "").replace(/\s+/g, "");
        const isNumericCode = /^\d+$/.test(cleanCode);

        if (cleanCode && isNumericCode) {
          newBarcode = `CNR-${cleanCode.padStart(6, "0")}`;
        } else {
          newBarcode = `CNR-ID-${p.id.substring(0, 6).toUpperCase()}`;
          invalidSku++;
        }

        // Ensure uniqueness
        if (!existingBarcodes.has(newBarcode)) {
          await updateProduct(p.id, { barcode: newBarcode });
          existingBarcodes.add(newBarcode);
          generated++;
        } else {
          conflicts++;
        }
      }
      
      alert(`Resumo da Geração:\n- Sem barcode: ${productsWithoutBarcode.length}\n- Gerados: ${generated}\n- Conflitos: ${conflicts}\n- CODE Inválido (Fallback): ${invalidSku}`);
    } catch (err) {
      console.error("Erro ao gerar barcodes:", err);
      alert("Erro ao gerar alguns códigos de barras.");
    } finally {
      set({ isLoading: false });
    }
  }
}));
