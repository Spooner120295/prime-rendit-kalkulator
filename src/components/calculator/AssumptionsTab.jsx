import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Settings, AlertCircle, Sparkles } from "lucide-react";
import ExportButtons from './ExportButtons'; // Annahme, dass ExportButtons hier wiederverwendet wird

export default function AssumptionsTab({ inputs, results, level, onReset, onInputChange, onLevelChange, isReady }) {
  const formatCurrency = (value) => `${Math.round(value || 0).toLocaleString('de-DE')}€`;
  const formatPercent = (value) => `${(value || 0)}%`;

  // Berechnete Werte für die Tabelle
  const ancillaryCosts = results?.ancillaryCosts || 0;
  const totalCosts = results?.totalCosts || 0;
  const equity = results?.equity || 0;
  const loan = results?.loan0 || 0;
  const buildingShare = inputs.acquisition.priceProperty * (1 - inputs.acquisition.landSharePct / 100);
  const afaBase = results?.afaAnnual / (inputs.tax.depreciationPct/100) || 0;

  const assumptionsData = [
    // Erwerb
    { category: 'Erwerb', item: 'Kaufpreis Immobilie', value: formatCurrency(inputs.acquisition.priceProperty) },
    { category: 'Erwerb', item: 'Möbel/Einrichtung', value: formatCurrency(inputs.acquisition.priceFurniture) },
    { category: 'Erwerb', item: 'Kaufnebenkosten', value: `${formatCurrency(ancillaryCosts)} (${((ancillaryCosts/inputs.acquisition.priceProperty)*100 || 0).toFixed(1)}%)` },
    { category: 'Erwerb', item: 'Gesamtkosten', value: formatCurrency(totalCosts) },
    
    // Finanzierung
    { category: 'Finanzierung', item: 'Eigenkapital', value: `${formatCurrency(equity)} (${(totalCosts > 0 ? (equity/totalCosts*100):0).toFixed(1)}%)` },
    { category: 'Finanzierung', item: 'Darlehen', value: formatCurrency(loan) },
    { category: 'Finanzierung', item: 'Sollzins p.a.', value: formatPercent(inputs.financing.interestPct) },
    { category: 'Finanzierung', item: 'Anfangstilgung p.a.', value: formatPercent(inputs.financing.initialRedemptionPct) },
    
    // Vermietung
    { category: 'Vermietung', item: 'Kaltmiete/Monat', value: formatCurrency(inputs.rentOps.coldRentMonthly) },
    { category: 'Vermietung', item: 'Leerstand', value: formatPercent(inputs.rentOps.vacancyPct) },
    { category: 'Vermietung', item: 'Hausgeld nicht uml. p.a.', value: formatCurrency(inputs.rentOps.ownerCostsMonthly * 12) },
    { category: 'Vermietung', item: 'Verwaltung p.a.', value: formatCurrency(inputs.rentOps.mgmtMonthly * 12) },
    { category: 'Vermietung', item: 'Instandhaltung p.a.', value: formatCurrency(inputs.rentOps.capexMonthly * 12) },
    ...(level === 'pro' && inputs.acquisition.otherCostsAnnual > 0 ? [{ category: 'Vermietung', item: 'Sonstige Kosten p.a.', value: formatCurrency(inputs.acquisition.otherCostsAnnual) }] : []),
    
    // Steuer & AfA (Pro)
    ...(level === 'pro' ? [
      { category: 'Steuer & AfA', item: 'Grenzsteuersatz', value: formatPercent(inputs.tax.marginalRatePct) },
      { category: 'Steuer & AfA', item: 'Bodenanteil', value: formatPercent(inputs.acquisition.landSharePct) },
      { category: 'Steuer & AfA', item: 'AfA-Basis (Gebäudewert)', value: formatCurrency(afaBase) },
      { category: 'Steuer & AfA', item: 'AfA-Satz p.a.', value: formatPercent(inputs.tax.depreciationPct) },
    ] : []),
    
    // Wachstum (Pro)
    ...(level === 'pro' ? [
      { category: 'Wachstum', item: 'Mietsteigerung p.a.', value: formatPercent(inputs.rentOps.rentGrowthPct) },
      { category: 'Wachstum', item: 'Wertsteigerung p.a.', value: formatPercent(inputs.rentOps.valueGrowthPct) }
    ] : []),
    
    { category: 'Allgemein', item: 'Planungshorizont', value: `${inputs.settings.horizonYears} Jahre` }
  ];

  return (
    <div className="space-y-6">
      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardHeader className="pb-4">
          <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Settings className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />Berechnungsannahmen</div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="mode-switch" className={`text-sm ${level === 'simple' ? 'text-gray-400' : ''}`} style={{ color: level === 'pro' ? 'var(--pr-primary)' : 'var(--pr-muted)' }}>{level === 'simple' ? 'Einfach' : 'Profi'}</Label>
              <Switch id="mode-switch" checked={level === 'pro'} onCheckedChange={(checked) => onLevelChange(checked ? 'pro' : 'simple')} />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div id="assumptions-table-for-pdf">
        <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
          <CardHeader className="pb-3">
            <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
              Eingabeparameter & Berechnungsgrundlagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                    <TableHead style={{ color: 'var(--pr-muted)' }}>Kategorie</TableHead>
                    <TableHead style={{ color: 'var(--pr-muted)' }}>Parameter</TableHead>
                    <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Wert</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assumptionsData.map((row, index) => (
                    <TableRow key={index} style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                      <TableCell><Badge variant="outline" style={{ borderColor: 'var(--pr-primary)', color: 'var(--pr-primary)', backgroundColor: 'transparent' }}>{row.category}</Badge></TableCell>
                      <TableCell style={{ color: 'var(--pr-text)' }} className="font-medium">{row.item}</TableCell>
                      <TableCell style={{ color: 'var(--pr-text)' }} className="text-right font-mono">{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardHeader className="pb-3">
          <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2"><AlertCircle className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />Berechnungsverfahren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs leading-relaxed" style={{ color: 'var(--pr-muted)' }}>
            <p className="font-semibold mb-2" style={{color: 'var(--pr-text)'}}>Disclaimer:</p>
            <p>Diese Berechnung dient der groben Orientierung und ersetzt keine individuelle Beratung. Alle Angaben ohne Gewähr. Tatsächliche Ergebnisse können abweichen.</p>
          </div>
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardContent className="pt-6">
          <ExportButtons inputs={inputs} results={results} onReset={onReset} level={level} isReady={isReady} />
        </CardContent>
      </Card>
    </div>
  );
}