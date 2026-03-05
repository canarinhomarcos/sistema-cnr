import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PriceHistory } from '../../types/inventory';
import { TrendingUp, DollarSign, Clock } from 'lucide-react';

interface PriceHistoryChartProps {
  productId: string;
  productName: string;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ productId, productName }) => {
  const { fetchPriceHistory } = useInventoryStore();
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const data = await fetchPriceHistory(productId);
      setHistory(data);
      setIsLoading(false);
    };
    loadHistory();
  }, [productId]);

  const chartData = history.map(h => ({
    date: new Date(h.date * 1000).toLocaleDateString(),
    price: h.price,
    type: h.type === 'SALE' ? 'Venda' : 'Custo'
  })).reverse();

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-500 space-y-2">
        <Clock size={32} className="opacity-20" />
        <p className="font-bold uppercase tracking-widest text-[10px]">Sem histórico</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 8, fontWeight: 'bold' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 8, fontWeight: 'bold' }}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', fontWeight: 'bold', color: '#F8FAFC', fontSize: '10px' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3B82F6" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#020617' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
