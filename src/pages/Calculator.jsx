import React, { useState, useEffect } from 'react';
import { Calculation } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building, Calculator as CalcIcon, TrendingUp, Settings, BarChart3, Sparkles } from "lucide-react";
import { Toaster, toast } from 'sonner';

import { CalculationEngine } from '../components/calculator/CalculationEngine';
import KPIDashboard from '../components/calculator/KPIDashboard';
import WealthChart from '../components/calculator/WealthChart';
import CashflowChart from '../components/calculator/CashflowChart';
import DataTable from '../components/calculator/DataTable';
import InputPanel from '../components/calculator/InputPanel';
import ExportButtons from '../components/calculator/ExportButtons';
import AssumptionsTab from '../components/calculator/AssumptionsTab';
import MobileStickyFooter from '../components/calculator/MobileStickyFooter';

export default function Calculator() {
  const [inputs, setInputs] = useState(CalculationEngine.getZeroState());
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('assumptions'); // Mobile-First: Start mit Annahmen
  const [calculationLevel, setCalculationLevel] = useState('simple');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // State aus URL laden
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('i')) {
      try {
        const base64Data = urlParams.get('i');
        const decodedData = atob(base64Data);
        const parsedState = JSON.parse(decodedData);
        
        const mergedInputs = { ...CalculationEngine.getZeroState(), ...parsedState.inputs };

        setInputs(mergedInputs);
        if(parsedState.level) setCalculationLevel(parsedState.level);
        toast.success("Kalkulation aus Share-Link geladen!");
      } catch (error) {
        console.error("Fehler beim Laden des Share-Links:", error);
        toast.error("Share-Link konnte nicht geladen werden.");
        setInputs(CalculationEngine.getZeroState());
      }
    }

    // CSS-Variablen für Widget-Styling setzen
    const root = document.documentElement;
    const bodyStyles = getComputedStyle(document.body);
    root.style.setProperty('--pr-font-family', bodyStyles.fontFamily || 'system-ui, sans-serif');
    if (!getComputedStyle(root).getPropertyValue('--pr-primary')) {
      root.style.setProperty('--pr-bg', '#0f172a');
      root.style.setProperty('--pr-card', 'rgba(30, 41, 59, 0.5)');
      root.style.setProperty('--pr-text', '#f1f5f9');
      root.style.setProperty('--pr-muted', '#94a3b8');
      root.style.setProperty('--pr-primary', '#4CC38A');
      root.style.setProperty('--pr-radius', '0.75rem');
      root.style.setProperty('--pr-shadow', '0 20px 25px -5px rgb(0 0 0 / 0.1)');
    }
  }, []);

  useEffect(() => {
    // isReady-Status und Berechnungen aktualisieren
    const { priceProperty } = inputs.acquisition;
    const { coldRentMonthly } = inputs.rentOps;
    const { equityAmount, interestPct, initialRedemptionPct } = inputs.financing;
    const { horizonYears } = inputs.settings;

    const ready = priceProperty > 0 && coldRentMonthly > 0 && equityAmount >= 0 && 
                  interestPct >= 0 && initialRedemptionPct >= 0 && horizonYears >= 1;
    setIsReady(ready);

    if (ready) {
      const engine = new CalculationEngine(inputs);
      const newResults = engine.calculate();
      setResults(newResults);
    } else {
      setResults(null);
    }
  }, [inputs]);

  const handleInputChange = (newInputs) => {
    setInputs(newInputs);
  };

  const handleReset = () => {
    setInputs(CalculationEngine.getZeroState());
    setCalculationLevel('simple');
    setActiveTab('assumptions'); // Zurück zu Annahmen
    window.history.replaceState({}, document.title, window.location.pathname);
    toast.info("Rechner zurückgesetzt.");
  };

  const loadDemoData = () => {
    setInputs(CalculationEngine.getDemoData());
    toast.success("Beispieldaten geladen!");
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="primerendit-calc min-h-screen text-white font-sans pb-20" style={{ 
        backgroundColor: 'var(--pr-bg)',
        fontFamily: 'var(--pr-font-family)'
      }}>
        <div className="container mx-auto px-4 py-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/public/primerendit-logo.svg" 
                alt="PrimeRendit" 
                className="h-8 w-auto primerendit-logo"
                onError={(e) => { e.target.src = "/public/primerendit-logo.png"; }}
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--pr-text)' }}>
                  PrimeRendit Kalkulator
                </h1>
              </div>
            </div>
            
            {/* Desktop Export Buttons */}
            <div className="hidden md:flex items-center gap-3">
               <Button onClick={loadDemoData} variant="outline" className="flex items-center gap-2" style={{borderColor: 'var(--pr-primary)', color: 'var(--pr-primary)'}}>
                 <Sparkles className="w-4 h-4" />
                 Beispieldaten laden
               </Button>
               <ExportButtons 
                 inputs={inputs} 
                 results={results} 
                 onReset={handleReset}
                 level={calculationLevel}
                 isReady={isReady}
               />
            </div>
          </header>

          <KPIDashboard results={results} isReady={isReady} />

          {/* Mobile-First Layout */}
          <div className="block lg:hidden">
            <div className="space-y-6">
              {/* Input Panel zuerst auf Mobile */}
              <div className="order-1">
                <InputPanel 
                  inputs={inputs} 
                  onChange={handleInputChange} 
                  level={calculationLevel}
                  onLevelChange={setCalculationLevel}
                />
              </div>
              
              {/* Tabs danach */}
              <div className="order-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4" style={{ backgroundColor: 'var(--pr-card)' }}>
                    <TabsTrigger value="assumptions" className="data-[state=active]:text-white flex items-center gap-1 text-xs" style={{ backgroundColor: activeTab === 'assumptions' ? 'var(--pr-primary)' : 'transparent' }}>
                      <Settings className="w-3 h-3" />
                      <span>Eingaben</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" disabled={!isReady} className="data-[state=active]:text-white flex items-center gap-1 text-xs" style={{ backgroundColor: activeTab === 'charts' ? 'var(--pr-primary)' : 'transparent' }}>
                      <TrendingUp className="w-3 h-3" />
                      <span>Charts</span>
                    </TabsTrigger>
                    <TabsTrigger value="cashflow" disabled={!isReady} className="data-[state=active]:text-white flex items-center gap-1 text-xs" style={{ backgroundColor: activeTab === 'cashflow' ? 'var(--pr-primary)' : 'transparent' }}>
                      <CalcIcon className="w-3 h-3" />
                      <span>Kalk.</span>
                    </TabsTrigger>
                    <TabsTrigger value="amortization" disabled={!isReady} className="data-[state=active]:text-white flex items-center gap-1 text-xs" style={{ backgroundColor: activeTab === 'amortization' ? 'var(--pr-primary)' : 'transparent' }}>
                      <BarChart3 className="w-3 h-3" />
                      <span>Tilg.</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="assumptions" className="mt-6">
                    <AssumptionsTab 
                      inputs={inputs} 
                      results={results} 
                      level={calculationLevel}
                      onReset={handleReset}
                      onInputChange={handleInputChange}
                      onLevelChange={setCalculationLevel}
                      isReady={isReady}
                    />
                  </TabsContent>
                  
                  <TabsContent value="charts" className="space-y-6 mt-6">
                    <WealthChart data={results?.rows} isReady={isReady} />
                    <CashflowChart data={results?.rows} isReady={isReady} />
                  </TabsContent>
                  
                  <TabsContent value="cashflow" className="mt-6">
                    <DataTable data={results?.rows} mode="cashflow" isReady={isReady} />
                  </TabsContent>
                  
                  <TabsContent value="amortization" className="mt-6">
                    <DataTable data={results?.rows} mode="amortization" isReady={isReady} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4" style={{ backgroundColor: 'var(--pr-card)' }}>
                  <TabsTrigger value="charts" disabled={!isReady} className="data-[state=active]:text-white flex items-center gap-2" style={{ backgroundColor: activeTab === 'charts' ? 'var(--pr-primary)' : 'transparent' }}>
                    <TrendingUp className="w-4 h-4" /> <span className="hidden sm:inline">Diagramme</span>
                  </TabsTrigger>
                  <TabsTrigger value="cashflow" disabled={!isReady} className="data-[state=active]:text-white flex items-center gap-2" style={{ backgroundColor: activeTab === 'cashflow' ? 'var(--pr-primary)' : 'transparent' }}>
                    <CalcIcon className="w-4 h-4" /> <span className="hidden sm:inline">Kalkulation</span>
                  </TabsTrigger>
                  <TabsTrigger value="amortization" disabled={!isReady} className="data-[state=active]:text-white flex items-center gap-2" style={{ backgroundColor: activeTab === 'amortization' ? 'var(--pr-primary)' : 'transparent' }}>
                    <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Tilgung</span>
                  </TabsTrigger>
                  <TabsTrigger value="assumptions" className="data-[state=active]:text-white flex items-center gap-2" style={{ backgroundColor: activeTab === 'assumptions' ? 'var(--pr-primary)' : 'transparent' }}>
                    <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Annahmen</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="charts" className="space-y-6 mt-6">
                  <WealthChart data={results?.rows} isReady={isReady} />
                  <CashflowChart data={results?.rows} isReady={isReady} />
                </TabsContent>
                
                <TabsContent value="cashflow" className="mt-6">
                  <DataTable data={results?.rows} mode="cashflow" isReady={isReady} />
                </TabsContent>
                
                <TabsContent value="amortization" className="mt-6">
                  <DataTable data={results?.rows} mode="amortization" isReady={isReady} />
                </TabsContent>
                
                <TabsContent value="assumptions" className="mt-6">
                  <AssumptionsTab 
                    inputs={inputs} 
                    results={results} 
                    level={calculationLevel}
                    onReset={handleReset}
                    onInputChange={handleInputChange}
                    onLevelChange={setCalculationLevel}
                    isReady={isReady}
                  />
                </TabsContent>
              </Tabs>
            </main>

            <aside className="hidden lg:block">
              <div className="sticky top-4">
                <InputPanel 
                  inputs={inputs} 
                  onChange={handleInputChange} 
                  level={calculationLevel}
                  onLevelChange={setCalculationLevel}
                />
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <MobileStickyFooter 
          onLoadDemo={loadDemoData}
          onReset={handleReset}
          inputs={inputs}
          results={results}
          level={calculationLevel}
          isReady={isReady}
        />
      </div>
    </>
  );
}