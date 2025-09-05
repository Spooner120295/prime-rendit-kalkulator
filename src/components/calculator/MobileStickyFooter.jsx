import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Download } from "lucide-react";
import { toast } from "sonner";
import { exportPrimeRenditPDF } from '../export/pdf';

export default function MobileStickyFooter({ onLoadDemo, onReset, inputs, results, level, isReady }) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = async () => {
    if (!isReady) {
      toast.error("Bitte füllen Sie zuerst die Pflichtfelder aus.");
      return;
    }
    
    if (isExporting) return; // Doppelklick-Schutz
    
    setIsExporting(true);
    try {
      await exportPrimeRenditPDF(inputs, results, level, { showUrl: false });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 p-3"
      style={{ 
        backgroundColor: 'var(--pr-card)', 
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
      }}
    >
      <div className="flex gap-2 max-w-sm mx-auto">
        <Button 
          onClick={onLoadDemo} 
          variant="outline" 
          className="flex-1 h-12 text-base font-medium"
          style={{
            borderColor: 'var(--pr-primary)', 
            color: 'var(--pr-primary)',
            backgroundColor: 'transparent'
          }}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Demo laden
        </Button>
        
        <Button 
          onClick={onReset} 
          variant="outline" 
          className="h-12 px-4"
          style={{
            borderColor: 'rgba(75, 85, 99, 0.5)', 
            color: 'var(--pr-muted)',
            backgroundColor: 'transparent'
          }}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button 
          onClick={handlePDFExport}
          disabled={!isReady || isExporting}
          className="md:hidden h-12 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="PDF Export"
          data-testid="pdf-export"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}