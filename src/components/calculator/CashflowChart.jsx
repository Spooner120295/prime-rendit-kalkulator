import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Ban } from "lucide-react";

export default function CashflowChart({ data, isReady }) {
    const EmptyState = () => (
    <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
      <CardHeader className="pb-3">
        <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
          Cashflow-Zusammensetzung
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
    year: `J${row.year}`,
    'Mieteinnahmen': row.netRent,
    'Bewirtschaftung': -row.ops,
    'Annuität': -row.annuity,
    'Steuern': -row.tax,
    'CF nach Steuern': row.cfAfterTax
  }));

  const formatCurrency = (value) => `${Math.round(Math.abs(value)).toLocaleString('de-DE')}€`;

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
          <BarChart3 className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
          Cashflow-Zusammensetzung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
              <XAxis dataKey="year" stroke="var(--pr-muted)" fontSize={12} />
              <YAxis stroke="var(--pr-muted)" fontSize={12} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: 'var(--pr-text)' }} />
              <Bar dataKey="Mieteinnahmen" fill="var(--pr-primary)" stackId="stack" />
              <Bar dataKey="Bewirtschaftung" fill="#f59e0b" stackId="stack" />
              <Bar dataKey="Annuität" fill="#6b7280" stackId="stack" />
              <Bar dataKey="Steuern" fill="#ef4444" stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}