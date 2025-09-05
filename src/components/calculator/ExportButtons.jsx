import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { exportPrimeRenditPDF } from '../export/pdf';

export default function ExportButtons({ inputs, results, onReset, level, isReady }) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = async () => {
    if (!isReady) {
      toast.error("Bitte füllen Sie zuerst die Pflichtfelder aus.");
      return;
    }
    
    if (isExporting) return; // Doppelklick-Schutz
    
    setIsExporting(true);
    try {
      await exportPrimeRenditPDF(inputs, results, level);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareLink = async () => {
    if (!isReady) {
      toast.error("Bitte füllen Sie zuerst die Pflichtfelder aus.");
      return;
    }
    try {
      const stateToShare = { level, inputs };
      const jsonString = JSON.stringify(stateToShare);
      const base64String = btoa(unescape(encodeURIComponent(jsonString)));
      const shareUrl = `${window.location.origin}${window.location.pathname}?i=${base64String}`;
      
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share-Link in Zwischenablage kopiert!");
    } catch (error) { 
      console.error('Share Error:', error);
      toast.error("Fehler beim Erstellen des Share-Links."); 
    }
  };

  const handleCopyResults = async () => {
    if (!isReady) {
      toast.error("Bitte füllen Sie zuerst die Pflichtfelder aus.");
      return;
    }
    try {
      if (!results) {
        toast.error("Keine Berechnungsdaten verfügbar.");
        return;
      }

      const summary = `
PrimeRendit Immobilien-Analyse
=============================

📊 KENNZAHLEN:
• Brutto-Rendite: ${(results.bruttoYield * 100).toFixed(2)}%
• Cashflow p.M. (Jahr 1): ${(results.monthlyCF1 || 0).toLocaleString('de-DE')} €
• Eigenkapital eingesetzt: ${(results.equity || 0).toLocaleString('de-DE')} €
• EK-Rendite gesamt: ${(results.cocReturn * 100).toFixed(1)}%

🏠 OBJEKTDATEN:
• Kaufpreis Immobilie: ${(inputs.acquisition.priceProperty || 0).toLocaleString('de-DE')} €
• Kaltmiete p.M.: ${(inputs.rentOps.coldRentMonthly || 0).toLocaleString('de-DE')} €
• Eigenkapital-Einsatz: ${(inputs.financing.equityAmount || 0).toLocaleString('de-DE')} €

💰 FINANZIERUNG:
• Sollzins: ${inputs.financing.interestPct}% p.a.
• Anfangstilgung: ${inputs.financing.initialRedemptionPct}% p.a.
• Planungshorizont: ${inputs.settings.horizonYears} Jahre

📈 ANNAHMEN:
• Leerstand: ${inputs.rentOps.vacancyPct}%
• Verwaltung: ${inputs.rentOps.mgmtMonthly} €/Monat
• Instandhaltung: ${inputs.rentOps.capexMonthly} €/Monat
${level === 'pro' ? `• Mietsteigerung: ${inputs.rentOps.rentGrowthPct}% p.a.
• Wertsteigerung: ${inputs.rentOps.valueGrowthPct}% p.a.
• Grenzsteuersatz: ${inputs.tax.marginalRatePct}%
• AfA-Satz: ${inputs.tax.depreciationPct}%` : ''}

Erstellt mit PrimeRendit Kalkulator
Alle Angaben ohne Gewähr.
`;
      await navigator.clipboard.writeText(summary.trim());
      toast.success("Zusammenfassung in Zwischenablage kopiert!");
    } catch (error) {
      console.error('Copy Error:', error);
      toast.error("Fehler beim Kopieren.");
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button 
        onClick={handlePDFExport} 
        disabled={!isReady || isExporting} 
        className="hidden md:inline-flex bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
        aria-label="PDF Export"
        data-testid="pdf-export"
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        PDF Export
      </Button>
      <Button 
        onClick={handleShareLink} 
        disabled={!isReady} 
        variant="outline" 
        style={{ borderColor: 'rgba(75, 85, 99, 0.3)', color: 'var(--pr-muted)' }} 
        className="hover:bg-gray-700 disabled:opacity-50"
      >
        <Share2 className="w-4 h-4 mr-2" /> Share-Link
      </Button>
      <Button 
        onClick={handleCopyResults} 
        disabled={!isReady} 
        variant="outline" 
        style={{ borderColor: 'rgba(75, 85, 99, 0.3)', color: 'var(--pr-muted)' }} 
        className="hover:bg-gray-700 disabled:opacity-50"
      >
        <Copy className="w-4 h-4 mr-2" /> Kopieren
      </Button>
      <Button 
        onClick={onReset} 
        variant="outline" 
        style={{ borderColor: 'rgba(75, 85, 99, 0.3)', color: 'var(--pr-muted)' }} 
        className="hover:bg-gray-700"
      >
        <RotateCcw className="w-4 h-4 mr-2" /> Reset
      </Button>
    </div>
  );
}