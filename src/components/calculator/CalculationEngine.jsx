/**
 * Immobilien-Kalkulator Rechenkern
 * Präzise Finanzberechnungen für Investment-Analysen
 */

export class CalculationEngine {
  constructor(inputs) {
    this.inputs = inputs;
  }

  calculate() {
    const { acquisition, rentOps, financing, tax, settings } = this.inputs;
    
    // Kaufnebenkosten
    const ancillaryCosts = acquisition.priceProperty * 
      (acquisition.grEStPct + acquisition.notaryPct + acquisition.landRegPct) / 100 + 
      (acquisition.otherCosts || 0);
    
    // Gesamtkosten
    const totalCosts = acquisition.priceProperty + (acquisition.priceFurniture || 0) + ancillaryCosts;
    
    // Eigenkapital und Darlehen
    const equity = financing.equityAmount;
    const loan0 = Math.max(0, totalCosts - equity);
    
    // Gebäudewert und AfA
    const buildingShare = acquisition.priceProperty * (1 - acquisition.landSharePct / 100);
    const afaAnnual = buildingShare * tax.depreciationPct / 100;
    
    // Jahresberechnungen
    const rows = [];
    let remainingLoan = loan0;
    let cumulatedCash = 0;
    
    for (let year = 1; year <= settings.horizonYears; year++) {
      const rentGrowthFactor = Math.pow(1 + rentOps.rentGrowthPct / 100, year - 1);
      const netRent = rentOps.coldRentMonthly * 12 * (1 - rentOps.vacancyPct / 100) * rentGrowthFactor;
      
      const ops = (rentOps.ownerCostsMonthly + rentOps.mgmtMonthly + rentOps.capexMonthly) * 12 + 
        (acquisition.otherCostsAnnual || 0);
      
      const annuity = loan0 > 0 ? loan0 * (financing.interestPct + financing.initialRedemptionPct) / 100 : 0;
      
      const interest = remainingLoan * financing.interestPct / 100;
      const principal = loan0 > 0 ? Math.min(annuity - interest, remainingLoan) : 0;
      
      const cfBeforeTax = netRent - ops - annuity;
      
      const taxBase = netRent - ops - interest - afaAnnual;
      const taxAmount = taxBase * tax.marginalRatePct / 100;
      
      const cfAfterTax = cfBeforeTax - taxAmount;
      cumulatedCash += cfAfterTax;
      
      const valueGrowthFactor = Math.pow(1 + rentOps.valueGrowthPct / 100, year);
      const marketValue = acquisition.priceProperty * valueGrowthFactor;
      
      remainingLoan = Math.max(0, remainingLoan - principal);
      
      rows.push({
        year,
        netRent: Math.round(netRent),
        ops: Math.round(ops),
        annuity: Math.round(annuity),
        interest: Math.round(interest),
        principal: Math.round(principal),
        tax: Math.round(taxAmount),
        cfBeforeTax: Math.round(cfBeforeTax),
        cfAfterTax: Math.round(cfAfterTax),
        remainingLoan: Math.round(remainingLoan),
        marketValue: Math.round(marketValue),
        cumulatedCash: Math.round(cumulatedCash),
        netWealth: Math.round(marketValue - remainingLoan + cumulatedCash)
      });
    }
    
    const firstYearCF = rows[0] ? rows[0].cfAfterTax : 0;
    const finalRow = rows[rows.length - 1];
    
    const netWealthEnd = finalRow ? finalRow.netWealth : equity;
    const cocReturn = equity > 0 ? (netWealthEnd - equity) / equity : Infinity;
    const totalProfit = finalRow ? netWealthEnd - equity : 0;
    
    return {
      ancillaryCosts: Math.round(ancillaryCosts),
      totalCosts: Math.round(totalCosts),
      equity: Math.round(equity),
      loan0: Math.round(loan0),
      afaAnnual: Math.round(afaAnnual),
      rows,
      bruttoYield: acquisition.priceProperty > 0 ? (rentOps.coldRentMonthly * 12) / acquisition.priceProperty : 0,
      monthlyCF1: Math.round(firstYearCF / 12),
      cocReturn,
      totalProfit: Math.round(totalProfit),
      marketValueEnd: finalRow ? finalRow.marketValue : 0,
      remainingLoanEnd: finalRow ? finalRow.remainingLoan : loan0,
      cumulatedCashEnd: finalRow ? finalRow.cumulatedCash : 0,
    };
  }

  static getZeroState() {
    return {
      acquisition: {
        priceProperty: 0, priceFurniture: 0, grEStPct: 3.5, notaryPct: 1.0,
        landRegPct: 0.5, otherCosts: 0, otherCostsAnnual: 0, landSharePct: 34
      },
      rentOps: {
        coldRentMonthly: 0, vacancyPct: 3, ownerCostsMonthly: 0,
        mgmtMonthly: 75, capexMonthly: 50, rentGrowthPct: 1.5, valueGrowthPct: 1.5
      },
      financing: {
        equityAmount: 0, equityMode: 'amount', equityPercent: 10,
        interestPct: 0, initialRedemptionPct: 0, termYears: 10
      },
      tax: { marginalRatePct: 42, depreciationPct: 4.0 },
      settings: { horizonYears: 10 },
      meta: {}
    };
  }
  
  static getDemoData() {
    const priceProperty = 300000;
    const ancillary = priceProperty * (0.035 + 0.01 + 0.005);
    const totalCosts = priceProperty + ancillary;
    const equityAmount = Math.round(totalCosts * 0.1);

    return {
      acquisition: {
        priceProperty, priceFurniture: 0, grEStPct: 3.5, notaryPct: 1.0,
        landRegPct: 0.5, otherCosts: 0, otherCostsAnnual: 0, landSharePct: 34
      },
      rentOps: {
        coldRentMonthly: 1200, vacancyPct: 3, ownerCostsMonthly: 0,
        mgmtMonthly: 75, capexMonthly: 50, rentGrowthPct: 1.5, valueGrowthPct: 1.5
      },
      financing: {
        equityAmount, equityMode: 'amount', equityPercent: 10,
        interestPct: 4.0, initialRedemptionPct: 2.0, termYears: 10
      },
      tax: { marginalRatePct: 42, depreciationPct: 4.0 },
      settings: { horizonYears: 10 },
      meta: {}
    };
  }
}