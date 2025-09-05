import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, PiggyBank, Ban } from "lucide-react";

export default function DataTable({ data, mode = "cashflow", isReady }) {
  const EmptyState = ({ title, description }) => (
    <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
      <CardHeader className="pb-3">
        <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
          {mode === 'cashflow' ? <Calculator className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} /> : <PiggyBank className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />}
          {title}
        </CardTitle>
        <CardDescription style={{ color: 'var(--pr-muted)' }}>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-10">
        <div className="h-[200px] flex flex-col items-center justify-center" style={{ color: 'var(--pr-muted)' }}>
          <Ban className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p>Bitte Pflichtfelder ausfüllen.</p>
        </div>
      </CardContent>
    </Card>
  );

  if (!isReady || !data || data.length === 0) {
    return <EmptyState 
      title={mode === 'cashflow' ? 'Jährliche Kalkulation' : 'Tilgungsplan'}
      description={mode === 'cashflow' ? 'Detailansicht der jährlichen Einnahmen und Ausgaben.' : 'Entwicklung von Zins, Tilgung und Restschuld über die Jahre.'}
    />;
  }

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${Math.round(value).toLocaleString('de-DE')}€`;
  };
  
  const renderCell = (value, isNegative = false, isPositiveHighlight = false) => {
    let color = 'var(--pr-muted)';
    if(isNegative) color = '#ef4444';
    if(isPositiveHighlight) {
      if(value >= 0) color = 'var(--pr-primary)';
      else color = '#ef4444';
    }
    
    return (
      <TableCell style={{ color }} className={`text-right ${isPositiveHighlight ? 'font-medium' : ''}`}>
        {isNegative ? `-${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
      </TableCell>
    );
  }

  if (mode === "amortization") {
    return (
      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardHeader className="pb-3">
          <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
            Tilgungsplan
          </CardTitle>
          <CardDescription style={{ color: 'var(--pr-muted)' }}>
            Entwicklung von Zins, Tilgung und Restschuld über die Jahre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                  <TableHead style={{ color: 'var(--pr-muted)' }}>Jahr</TableHead>
                  <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Annuität</TableHead>
                  <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Zinsen</TableHead>
                  <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Tilgung</TableHead>
                  <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Restschuld</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.year} style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                    <TableCell style={{ color: 'var(--pr-text)' }} className="font-medium">{row.year}</TableCell>
                    {renderCell(row.annuity)}
                    {renderCell(row.interest, true)}
                    {renderCell(row.principal)}
                    {renderCell(row.remainingLoan)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
      <CardHeader className="pb-3">
        <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
          <Calculator className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
          Jährliche Kalkulation
        </CardTitle>
        <CardDescription style={{ color: 'var(--pr-muted)' }}>
          Detailansicht der jährlichen Einnahmen und Ausgaben.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                <TableHead style={{ color: 'var(--pr-muted)' }}>Jahr</TableHead>
                <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Netto-Miete</TableHead>
                <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Bewirtsch.</TableHead>
                <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Steuern</TableHead>
                <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">CF v. St.</TableHead>
                <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">CF n. St.</TableHead>
                <TableHead style={{ color: 'var(--pr-muted)' }} className="text-right">Nettovermögen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.year} style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                  <TableCell style={{ color: 'var(--pr-text)' }} className="font-medium">{row.year}</TableCell>
                  {renderCell(row.netRent)}
                  {renderCell(row.ops, true)}
                  {renderCell(row.tax, true)}
                  {renderCell(row.cfBeforeTax, false, true)}
                  {renderCell(row.cfAfterTax, false, true)}
                  {renderCell(row.netWealth, false, true)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}