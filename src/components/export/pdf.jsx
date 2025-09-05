import { toast } from "sonner";

async function toDataURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportPrimeRenditPDF(inputs, results, level, options = {}) {
  const { scale = 2, showUrl = true, forceDesktopWidth } = options;
  
  if (!results) {
    toast.error("Keine Berechnungsdaten verfügbar. Bitte warten Sie einen Moment.");
    return;
  }

  toast.info("PDF-Export wird vorbereitet...", { duration: 8000 });

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const page_width = pdf.internal.pageSize.getWidth();
    const page_height = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y_pos = margin;

    const pdfColors = {
      primary: '#4CC38A',
      text: '#1f2937',
      muted: '#6b7280',
      bg: '#ffffff',
      border: '#e5e7eb'
    };

    // Header-Funktion für jede Seite
    const addHeader = async (pdfInstance) => {
      let logoDataUrl;
      try {
        logoDataUrl = await toDataURL('/public/primerendit-logo.svg').catch(() => 
          toDataURL('/public/primerendit-logo.png')
        );
        pdfInstance.addImage(logoDataUrl, 'PNG', margin, 12, 30, 10);
      } catch (e) {
        pdfInstance.setFontSize(14).setFont("helvetica", "bold").setTextColor(pdfColors.primary);
        pdfInstance.text("PrimeRendit", margin, 18);
      }
      
      pdfInstance.setFontSize(18).setFont("helvetica", "bold").setTextColor(pdfColors.text);
      pdfInstance.text("Immobilien-Kalkulation", page_width / 2, 20, { align: 'center' });
      
      if (showUrl) {
        pdfInstance.setFontSize(8).setFont("helvetica", "normal").setTextColor(pdfColors.muted);
        pdfInstance.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, page_width - margin, 18, { align: 'right' });
        pdfInstance.text(window.location.href, page_width - margin, 22, { align: 'right' });
      }
    };

    // Tabellen-Funktion
    const addTable = (pdfInstance, data, startY, title) => {
      let currentY = startY;
      
      if (currentY > page_height - 40) {
        pdfInstance.addPage();
        addHeader(pdfInstance);
        currentY = 35;
      }

      if (title) {
        pdfInstance.setFontSize(12).setFont("helvetica", "bold").setTextColor(pdfColors.text);
        pdfInstance.text(title, margin, currentY);
        currentY += 8;
      }
      
      const colWidth = (page_width - 2 * margin) / 2;
      pdfInstance.setFillColor(76, 195, 138);
      pdfInstance.rect(margin, currentY, page_width - 2 * margin, 6, 'F');
      pdfInstance.setFontSize(10).setFont("helvetica", "bold").setTextColor(255, 255, 255);
      pdfInstance.text("Parameter", margin + 2, currentY + 4);
      pdfInstance.text("Wert", margin + colWidth + 2, currentY + 4);
      currentY += 6;
      
      pdfInstance.setFont("helvetica", "normal").setTextColor(pdfColors.text);
      data.forEach((row, index) => {
        if (currentY > page_height - 10) {
          pdfInstance.addPage();
          addHeader(pdfInstance);
          currentY = 35;
        }

        const [label, value] = row;
        const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        
        pdfInstance.setFillColor(bgColor === '#f8f9fa' ? 248 : 255, bgColor === '#f8f9fa' ? 249 : 255, bgColor === '#f8f9fa' ? 250 : 255);
        pdfInstance.rect(margin, currentY, page_width - 2 * margin, 5, 'F');
        
        pdfInstance.setFontSize(9);
        pdfInstance.text(label, margin + 2, currentY + 3.5);
        pdfInstance.setFont("helvetica", "bold");
        pdfInstance.text(value, page_width - margin - 2, currentY + 3.5, { align: 'right' });
        pdfInstance.setFont("helvetica", "normal");
        
        currentY += 5;
      });
      
      return currentY + 5;
    };

    // Footer-Funktion
    const addFooter = (pdfInstance) => {
      const pageCount = pdfInstance.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdfInstance.setPage(i);
        pdfInstance.setFontSize(8).setTextColor(pdfColors.muted);
        pdfInstance.text(`Seite ${i} von ${pageCount}`, page_width / 2, page_height - 10, { align: 'center' });
      }
    };

    // PDF erstellen
    await addHeader(pdf);
    y_pos = 35;

    // 1. KPIs + Zusatz-KPIs
    const kpiData = [
      ['Brutto-Rendite', `${(results.bruttoYield * 100).toFixed(2)}%`],
      ['Cashflow p.M. (Jahr 1)', `${(results.monthlyCF1 || 0).toLocaleString('de-DE')} €`],
      ['Eigenkapital eingesetzt', `${(results.equity || 0).toLocaleString('de-DE')} €`],
      ['EK-Rendite gesamt', results.cocReturn === Infinity ? '∞' : `${((results.cocReturn || 0) * 100).toFixed(1)}%`],
      ['Marktwert (Ende)', `${(results.marketValueEnd || 0).toLocaleString('de-DE')} €`],
      ['Restschuld (Ende)', `${(results.remainingLoanEnd || 0).toLocaleString('de-DE')} €`],
      ['Kumul. Cashflow (Ende)', `${(results.cumulatedCashEnd || 0).toLocaleString('de-DE')} €`],
      ['Gesamtgewinn', `${(results.totalProfit || 0).toLocaleString('de-DE')} €`]
    ];

    y_pos = addTable(pdf, kpiData, y_pos, "Kennzahlen & Ergebnisse");

    // 2. Berechnungsannahmen
    const afaBase = inputs.acquisition.priceProperty * (1 - inputs.acquisition.landSharePct / 100);
    const assumptionsData = [
      ['Kaufpreis Immobilie', `${(inputs.acquisition.priceProperty || 0).toLocaleString('de-DE')} €`],
      ...((inputs.acquisition.priceFurniture || 0) > 0 ? [['Möbel/Einrichtung', `${inputs.acquisition.priceFurniture.toLocaleString('de-DE')} €`]] : []),
      ['Kaufnebenkosten', `${(results.ancillaryCosts || 0).toLocaleString('de-DE')} €`],
      ['Gesamtkosten', `${(results.totalCosts || 0).toLocaleString('de-DE')} €`],
      ['Eigenkapital', `${(inputs.financing.equityAmount || 0).toLocaleString('de-DE')} €`],
      ['Darlehen', `${(results.loan0 || 0).toLocaleString('de-DE')} €`],
      ['Kaltmiete/Monat', `${(inputs.rentOps.coldRentMonthly || 0).toLocaleString('de-DE')} €`],
      ['Leerstand', `${inputs.rentOps.vacancyPct}%`],
      ['Verwaltung p.a.', `${inputs.rentOps.mgmtMonthly * 12} €`],
      ['Instandhaltung p.a.', `${inputs.rentOps.capexMonthly * 12} €`],
      ['Sollzins p.a.', `${inputs.financing.interestPct}%`],
      ['Anfangstilgung p.a.', `${inputs.financing.initialRedemptionPct}%`],
      ['Planungshorizont', `${inputs.settings.horizonYears} Jahre`],
      ...(level === 'pro' ? [
        ['Grenzsteuersatz', `${inputs.tax.marginalRatePct}%`],
        ['AfA-Basis (Gebäudewert)', `${afaBase.toLocaleString('de-DE')} €`],
        ['AfA-Satz p.a.', `${inputs.tax.depreciationPct}%`],
        ['Bodenanteil', `${inputs.acquisition.landSharePct}%`],
        ['Mietsteigerung p.a.', `${inputs.rentOps.rentGrowthPct}%`],
        ['Wertsteigerung p.a.', `${inputs.rentOps.valueGrowthPct}%`]
      ] : [])
    ];

    y_pos = addTable(pdf, assumptionsData, y_pos, "Berechnungsannahmen");

    // 3. Diagramme erfassen
    const captureAndAddChart = async (element, title) => {
      if (y_pos > page_height - 100) {
        pdf.addPage();
        await addHeader(pdf);
        y_pos = 35;
      }
      
      pdf.setFontSize(12).setFont("helvetica", "bold").setTextColor(pdfColors.text);
      pdf.text(title, margin, y_pos);
      y_pos += 8;

      if (element) {
        try {
          const canvas = await html2canvas(element, { scale: scale, backgroundColor: '#ffffff', useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = page_width - 2 * margin;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (y_pos + imgHeight > page_height - 20) {
            pdf.addPage();
            await addHeader(pdf);
            y_pos = 35;
          }
          
          pdf.addImage(imgData, 'PNG', margin, y_pos, imgWidth, imgHeight);
          y_pos += imgHeight + 10;
        } catch (e) {
          console.warn('Chart capture failed', e);
          pdf.setFontSize(10).setTextColor(pdfColors.muted);
          pdf.text('Diagramm konnte nicht erfasst werden.', margin, y_pos);
          y_pos += 10;
        }
      }
    };
    
    const charts = document.querySelectorAll('[data-recharts-wrapper]');
    if (charts[0]) await captureAndAddChart(charts[0], 'Vermögensentwicklung');
    if (charts[1]) await captureAndAddChart(charts[1], 'Cashflow-Zusammensetzung');

    // 4. Tabellen
    if (results.rows && results.rows.length > 0) {
      const cashflowTableData = results.rows.map(r => [
        r.year, 
        `${r.netRent.toLocaleString('de-DE')}€`, 
        `-${r.ops.toLocaleString('de-DE')}€`, 
        `-${r.tax.toLocaleString('de-DE')}€`, 
        `${r.cfBeforeTax.toLocaleString('de-DE')}€`, 
        `${r.cfAfterTax.toLocaleString('de-DE')}€`, 
        `${r.netWealth.toLocaleString('de-DE')}€`
      ]);
      
      // Vereinfachte Tabelle für PDF (nur die wichtigsten Spalten)
      const simplifiedCashflowData = results.rows.map(r => [
        `Jahr ${r.year}`, 
        `CF: ${r.cfAfterTax.toLocaleString('de-DE')} €`
      ]);
      y_pos = addTable(pdf, simplifiedCashflowData, y_pos, "Jährlicher Cashflow n. Steuern");

      const amortTableData = results.rows.map(r => [
        `Jahr ${r.year}`, 
        `Restschuld: ${r.remainingLoan.toLocaleString('de-DE')} €`
      ]);
      y_pos = addTable(pdf, amortTableData, y_pos, "Restschuldentwicklung");
    }

    // 5. Disclaimer
    if (y_pos > page_height - 30) {
      pdf.addPage();
      await addHeader(pdf);
      y_pos = 35;
    }
    pdf.setFontSize(8).setFont("helvetica", "italic").setTextColor(pdfColors.muted);
    const disclaimer = "Alle Angaben ohne Gewähr. Diese Berechnung dient der groben Orientierung und ersetzt keine individuelle steuerliche oder finanzielle Beratung. Erstellt mit PrimeRendit Kalkulator.";
    pdf.text(disclaimer, margin, y_pos, { maxWidth: page_width - 2 * margin });

    addFooter(pdf);
    
    const stamp = new Date().toISOString().slice(0,10);
    pdf.save(`PrimeRendit-Kalkulation-${stamp}.pdf`);
    toast.success("PDF erfolgreich exportiert!");

  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error("Fehler beim PDF-Export. Bitte versuchen Sie es erneut.");
  }
}