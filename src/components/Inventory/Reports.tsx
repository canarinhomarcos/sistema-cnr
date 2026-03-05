import React, { useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, DollarSign, Package, ArrowUpRight, ArrowDownLeft, AlertTriangle, BarChart3 } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Reports: React.FC = () => {
  const { products, movements, invoices } = useInventoryStore();

  const turnoverData = useMemo(() => {
    const data: Record<string, { name: string; in: number; out: number }> = {};
    if (!Array.isArray(movements) || !Array.isArray(products)) return [];
    
    movements.forEach(m => {
      const product = products.find(p => p.id === m.productId);
      if (!product) return;
      if (!data[product.id]) data[product.id] = { name: product.name, in: 0, out: 0 };
      if (m.tipo === 'ENTRADA') data[product.id].in += m.quantidade;
      else if (m.tipo === 'SAIDA') data[product.id].out += m.quantidade;
    });
    return Object.values(data).sort((a, b) => b.out - a.out).slice(0, 5);
  }, [products, movements]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    if (!Array.isArray(products)) return [];
    
    products.forEach(p => {
      data[p.category] = (data[p.category] || 0) + p.quantity;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [products]);

  const totalSavings = useMemo(() => {
    const invSavings = Array.isArray(invoices) ? invoices.reduce((acc, inv) => acc + (inv.discount || 0), 0) : 0;
    return invSavings;
  }, [invoices]);

  const totalProducts = useMemo(() => products.length, [products]);
  
  const totalValue = useMemo(() => 
    products.reduce((acc, p) => acc + (p.quantity * (p.price || 0)), 0), 
  [products]);

  const lowStockCount = useMemo(() => 
    products.filter(p => p.quantity <= (p.minimo ?? p.minQuantity ?? 0)).length, 
  [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Package size={24} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Produtos</span>
          </div>
          <div className="text-3xl font-black text-white">{totalProducts}</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor em Estoque</span>
          </div>
          <div className="text-3xl font-black text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <AlertTriangle size={24} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estoque Baixo</span>
          </div>
          <div className="text-3xl font-black text-white">{lowStockCount}</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Economia Total</span>
          </div>
          <div className="text-3xl font-black text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSavings)}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnover Chart */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <BarChart3 size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Giro de Estoque (Top 5 Saídas)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoverData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', fontWeight: 'bold', color: '#F8FAFC' }}
                />
                <Bar dataKey="out" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Package size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Distribuição por Categoria</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', fontWeight: 'bold', color: '#F8FAFC' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
