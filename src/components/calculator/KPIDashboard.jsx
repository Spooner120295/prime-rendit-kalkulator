import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Euro, PiggyBank, Target, Ban } from "lucide-react";

export default function KPIDashboard({ results, isReady }) {
  if (!isReady || !results) {
    return (
      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }} className="mb-6">
        <CardContent className="p-6 text-center" style={{ color: 'var(--pr-muted)' }}>
          <Ban className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p>Bitte füllen Sie die Pflichtfelder aus, um die Kennzahlen zu berechnen.</p>
        </CardContent>
      </Card>
    );
  }

  const kpis = [
    {
      title: "Brutto-Rendite",
      value: `${(results.bruttoYield * 100).toFixed(2)}%`,
      icon: TrendingUp,
      color: "var(--pr-primary)",
      description: "Jahresmiete / Kaufpreis"
    },
    {
      title: "Cashflow p.M. (J1)",
      value: `${results.monthlyCF1}€`,
      icon: Euro,
      color: results.monthlyCF1 >= 0 ? "var(--pr-primary)" : "#ef4444",
      description: "Nach Steuern"
    },
    {
      title: "Eigenkapital",
      value: `${results.equity.toLocaleString('de-DE')}€`,
      icon: PiggyBank,
      color: "#3b82f6",
      description: "Initial eingesetzt"
    },
    {
      title: "EK-Rendite",
      value: results.cocReturn === Infinity ? "∞" : `${(results.cocReturn * 100).toFixed(1)}%`,
      icon: Target,
      color: results.cocReturn >= 0 || results.cocReturn === Infinity ? "var(--pr-primary)" : "#ef4444",
      description: `Gesamt über ${results.rows?.length || 0}J`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <Card key={index} style={{ 
          backgroundColor: 'var(--pr-card)', 
          borderColor: 'rgba(75, 85, 99, 0.3)',
          boxShadow: 'var(--pr-shadow)'
        }} className="hover:scale-105 transition-transform">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--pr-muted)' }}>
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold mb-1" style={{ color: 'var(--pr-text)' }}>
                  {kpi.value}
                </p>
                <p className="text-xs" style={{ color: 'var(--pr-muted)' }}>
                  {kpi.description}
                </p>
              </div>
              <div className="p-2 rounded-lg" style={{ 
                backgroundColor: `${kpi.color}20`,
                border: `1px solid ${kpi.color}30`
              }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}