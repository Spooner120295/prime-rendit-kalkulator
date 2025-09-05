import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Ban } from "lucide-react";

export default function WealthChart({ data, isReady }) {
  const EmptyState = () => (
    <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
      <CardHeader className="pb-3">
        <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
          Vermögensentwicklung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex flex-col items-center justify-center" style={{ color: 'var(--pr-muted)' }}>
          <Ban className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p>Bitte Pflichtfelder ausfüllen.</p>
        </div>
      </CardContent>
    </Card>
  );

  if (!isReady || !data || !data.length) {
    return <EmptyState />;
  }

  const chartData = data.map(row => ({
    year: `Jahr ${row.year}`,
    Marktwert: row.marketValue,
    Restschuld: row.remainingLoan,
    'Kum. Cashflow': row.cumulatedCash,
    'Nettovermögen': row.netWealth
  }));

  const formatCurrency = (value) => `${Math.round(value).toLocaleString('de-DE')}€`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'var(--pr-card)', 
          border: '1px solid rgba(75, 85, 99, 0.3)',
          borderRadius: 'var(--pr-radius)',
          padding: '12px',
          boxShadow: 'var(--pr-shadow)'
        }}>
          <p style={{ color: 'var(--pr-text)' }} className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
      <CardHeader className="pb-3">
        <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
          Vermögensentwicklung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorNettovermögen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--pr-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--pr-primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMarktwert" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
              <XAxis dataKey="year" stroke="var(--pr-muted)" fontSize={12} />
              <YAxis stroke="var(--pr-muted)" fontSize={12} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: 'var(--pr-text)' }} />
              <Area type="monotone" dataKey="Marktwert" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMarktwert)" />
              <Area type="monotone" dataKey="Restschuld" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Nettovermögen" stroke="var(--pr-primary)" fillOpacity={1} fill="url(#colorNettovermögen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}