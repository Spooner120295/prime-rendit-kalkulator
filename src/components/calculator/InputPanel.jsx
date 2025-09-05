
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings, Home, Receipt, Calculator, Info, Percent, Euro } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
// Removed: import { debounce } from 'lodash';

const InfoTooltip = ({ text }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3 h-3 cursor-pointer ml-1" style={{ color: 'var(--pr-muted)' }} />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Mobile-optimierte Slider+Input Komponente
const SliderWithInput = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 0.1, 
  suffix = '%',
  error,
  tooltip 
}) => {
  const [inputValue, setInputValue] = useState(String(value));
  const [inputError, setInputError] = useState('');

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    
    const numVal = parseFloat(val.replace(',', '.'));
    if (isNaN(numVal)) {
      setInputError(`Bitte geben Sie eine Zahl zwischen ${min} und ${max} ein.`);
      return;
    }
    
    if (numVal < min || numVal > max) {
      setInputError(`Wert muss zwischen ${min} und ${max} ${suffix} liegen.`);
      return;
    }
    
    setInputError('');
    onChange(numVal);
  };

  const handleInputBlur = () => {
    const numVal = parseFloat(inputValue.replace(',', '.'));
    if (!isNaN(numVal)) {
      const clampedVal = Math.max(min, Math.min(max, numVal));
      setInputValue(String(clampedVal));
      onChange(clampedVal);
      setInputError('');
    } else {
      setInputValue(String(value));
    }
  };

  React.useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  return (
    <div className="space-y-2">
      <Label style={{ color: 'var(--pr-muted)' }} className="flex items-center text-base">
        {label} 
        {tooltip && <InfoTooltip text={tooltip} />}
      </Label>
      
      <div className="flex items-center gap-3">
        <Input
          type="text"
          inputMode="decimal"
          pattern="[0-9.,]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-24 h-11 text-base"
          style={{ 
            backgroundColor: 'rgba(55, 65, 81, 0.5)', 
            borderColor: inputError ? '#ef4444' : 'rgba(75, 85, 99, 0.3)', 
            color: 'var(--pr-text)',
            fontSize: '16px' // iOS Zoom verhindern
          }}
          placeholder={suffix}
        />
        
        <Slider 
          value={[value]} 
          onValueChange={([val]) => onChange(val)} 
          min={min} 
          max={max} 
          step={step}
          className="flex-1 h-11"
        />
      </div>
      
      {(inputError || error) && (
        <p className="text-amber-400 text-sm">{inputError || error}</p>
      )}
      
      <div className="text-center text-xs" style={{ color: 'var(--pr-muted)' }}>
        {value}{suffix} (Range: {min}–{max}{suffix})
      </div>
    </div>
  );
};

export default function InputPanel({ inputs, onChange, level, onLevelChange }) {
  // Debounced onChange für Performance - FIX: useRef statt useCallback mit debounce
  const debounceTimer = useRef(null);
  
  const debouncedOnChange = useCallback((newInputs) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onChange(newInputs);
    }, 300);
  }, [onChange]); // `onChange` from props is stable due to external usage or React's internal handling of props

  const handleInputChange = (section, field, value) => {
    // Handle number formatting, allowing empty string but converting to 0 for calculations
    let numericValue = value === '' ? 0 : Number(String(value).replace(/[,.]/g, ''));
    
    const newInputs = {
      ...inputs,
      [section]: {
        ...inputs[section],
        [field]: numericValue
      }
    };
    debouncedOnChange(newInputs);
  };

  const handleFloatInputChange = (section, field, value) => {
     // Handle float number formatting, allowing empty string but converting to 0 for calculations
     let numericValue = value === '' ? 0 : Number(String(value).replace(/,/g, '.'));
     const newInputs = {
      ...inputs,
      [section]: {
        ...inputs[section],
        [field]: numericValue
      }
    };
    debouncedOnChange(newInputs);
  }

  const handleSliderChange = (section, field, value) => {
    const newInputs = {
      ...inputs,
      [section]: {
        ...inputs[section],
        [field]: value
      }
    };
    onChange(newInputs); // Slider: direkt ohne debounce
  };

  const calculateTotalCosts = (currentInputs) => {
    const ancillary = (currentInputs.acquisition.priceProperty || 0) * 
      ((currentInputs.acquisition.grEStPct || 0) + (currentInputs.acquisition.notaryPct || 0) + (currentInputs.acquisition.landRegPct || 0)) / 100 + 
      (currentInputs.acquisition.otherCosts || 0); // Assuming otherCosts is a one-time cost
    return (currentInputs.acquisition.priceProperty || 0) + (currentInputs.acquisition.priceFurniture || 0) + ancillary;
  };

  const handleEquityAmountBlur = (value) => {
    const totalCosts = calculateTotalCosts(inputs); // Use current inputs state for calculation
    let numericValue = value === '' ? 0 : Number(value);

    // Prevent equity from exceeding total costs unless total costs are 0 (e.g., initial state)
    if (numericValue > totalCosts && totalCosts > 0) {
      toast.error(`Eigenkapital (${numericValue.toLocaleString('de-DE')} €) kann nicht höher sein als die Gesamtkosten (${totalCosts.toLocaleString('de-DE')} €).`);
      numericValue = totalCosts;
    } else {
      numericValue = Math.max(0, numericValue); // Ensure non-negative
    }

    // Call the specific handler for equityAmount to update the state, which will trigger debouncedOnChange
    handleInputChange('financing', 'equityAmount', numericValue);
  }

  return (
    <div className="space-y-6">
      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardHeader className="pb-4">
          <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
              Eingabeparameter
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="pro-mode-switch" className="text-sm" style={{ color: level === 'pro' ? 'var(--pr-primary)' : 'var(--pr-muted)' }}>
                {level === 'simple' ? 'Einfach' : 'Profi'}
              </Label>
              <Switch
                id="pro-mode-switch"
                checked={level === 'pro'}
                onCheckedChange={(checked) => onLevelChange(checked ? 'pro' : 'simple')}
              />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
      
      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardHeader className="pb-3">
          <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-400" />
            Erwerb & Finanzierung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Kaufpreis Immobilie</Label>
            <Input 
              type="text"
              inputMode="decimal"
              pattern="[0-9.,]*"
              value={inputs.acquisition.priceProperty || ''} 
              onChange={(e) => handleInputChange('acquisition', 'priceProperty', e.target.value)} 
              onBlur={(e) => handleInputChange('acquisition', 'priceProperty', Math.max(0, Number(e.target.value)))}
              style={{ 
                backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                borderColor: 'rgba(75, 85, 99, 0.3)', 
                color: 'var(--pr-text)',
                fontSize: '16px'
              }}
              className="h-11 text-base"
              placeholder="€" 
            />
          </div>
          
          <div className="space-y-2">
            <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Möbel/Einrichtung (optional)</Label>
            <Input 
              type="text"
              inputMode="decimal"
              pattern="[0-9.,]*"
              value={inputs.acquisition.priceFurniture || ''} 
              onChange={(e) => handleInputChange('acquisition', 'priceFurniture', e.target.value)} 
              onBlur={(e) => handleInputChange('acquisition', 'priceFurniture', Math.max(0, Number(e.target.value)))}
              style={{ 
                backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                borderColor: 'rgba(75, 85, 99, 0.3)', 
                color: 'var(--pr-text)',
                fontSize: '16px'
              }}
              className="h-11 text-base"
              placeholder="€" 
            />
          </div>

          <div className="space-y-2">
            <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Eigenkapital</Label>
            <Input 
              type="text"
              inputMode="decimal"
              pattern="[0-9.,]*"
              value={inputs.financing.equityAmount || ''} 
              onChange={(e) => handleInputChange('financing', 'equityAmount', e.target.value)} 
              onBlur={(e) => handleEquityAmountBlur(e.target.value)}
              style={{ 
                backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                borderColor: 'rgba(75, 85, 99, 0.3)', 
                color: 'var(--pr-text)',
                fontSize: '16px'
              }}
              className="h-11 text-base"
              placeholder="z. B. 35000" 
            />
          </div>

          {level === 'pro' && (
            <>
              <Separator style={{ backgroundColor: 'rgba(75, 85, 99, 0.3)' }} className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: 'var(--pr-muted)' }} className="text-base">GrESt (%)</Label>
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    step="0.1" 
                    value={inputs.acquisition.grEStPct} 
                    onChange={(e) => handleFloatInputChange('acquisition', 'grEStPct', e.target.value)}
                    style={{ 
                      backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                      borderColor: 'rgba(75, 85, 99, 0.3)', 
                      color: 'var(--pr-text)',
                      fontSize: '16px'
                    }}
                    className="h-11 text-base" 
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Notar (%)</Label>
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    step="0.1" 
                    value={inputs.acquisition.notaryPct}
                    onChange={(e) => handleFloatInputChange('acquisition', 'notaryPct', e.target.value)}
                    style={{ 
                      backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                      borderColor: 'rgba(75, 85, 99, 0.3)', 
                      color: 'var(--pr-text)',
                      fontSize: '16px'
                    }}
                    className="h-11 text-base" 
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Grundbuch (%)</Label>
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    step="0.1" 
                    value={inputs.acquisition.landRegPct}
                    onChange={(e) => handleFloatInputChange('acquisition', 'landRegPct', e.target.value)}
                    style={{ 
                      backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                      borderColor: 'rgba(75, 85, 99, 0.3)', 
                      color: 'var(--pr-text)',
                      fontSize: '16px'
                    }}
                    className="h-11 text-base" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Sonstige Kosten p.a. (optional)</Label>
                <Input 
                  type="text"
                  inputMode="decimal"
                  value={inputs.acquisition.otherCostsAnnual || ''}
                  onChange={(e) => handleInputChange('acquisition', 'otherCostsAnnual', e.target.value)}
                  onBlur={(e) => handleInputChange('acquisition', 'otherCostsAnnual', Math.max(0, Number(e.target.value)))}
                  style={{ 
                    backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                    borderColor: 'rgba(75, 85, 99, 0.3)', 
                    color: 'var(--pr-text)',
                    fontSize: '16px'
                  }}
                  className="h-11 text-base"
                  placeholder="€" 
                />
              </div>

              <SliderWithInput 
                label="Bodenanteil"
                value={inputs.acquisition.landSharePct}
                onChange={(value) => handleSliderChange('acquisition', 'landSharePct', value)}
                min={0}
                max={80}
                step={1}
                suffix="%"
                tooltip="Anteil des Grundstückswerts am Kaufpreis. Wichtig für die AfA. Range: 0-80%"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardHeader className="pb-3">
          <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: 'var(--pr-primary)' }} />
            Vermietung & Bewirtschaftung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Kaltmiete pro Monat</Label>
            <Input 
              type="text"
              inputMode="decimal"
              value={inputs.rentOps.coldRentMonthly || ''}
              onChange={(e) => handleInputChange('rentOps', 'coldRentMonthly', e.target.value)}
              onBlur={(e) => handleInputChange('rentOps', 'coldRentMonthly', Math.max(0, Number(e.target.value)))}
              style={{ 
                backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                borderColor: 'rgba(75, 85, 99, 0.3)', 
                color: 'var(--pr-text)',
                fontSize: '16px'
              }}
              className="h-11 text-base"
              placeholder="€" 
            />
          </div>
          
          <SliderWithInput 
            label="Leerstand"
            value={inputs.rentOps.vacancyPct}
            onChange={(value) => handleSliderChange('rentOps', 'vacancyPct', value)}
            min={0}
            max={15}
            step={0.5}
            suffix="%"
            tooltip="Geschätzter Mietausfall in Prozent der Jahreskaltmiete. Range: 0-15%"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Hausgeld n.u. (€/Mo)</Label>
              <Input 
                type="text"
                inputMode="decimal"
                value={inputs.rentOps.ownerCostsMonthly || ''}
                onChange={(e) => handleInputChange('rentOps', 'ownerCostsMonthly', e.target.value)}
                onBlur={(e) => handleInputChange('rentOps', 'ownerCostsMonthly', Math.max(0, Number(e.target.value)))}
                style={{ 
                  backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                  borderColor: 'rgba(75, 85, 99, 0.3)', 
                  color: 'var(--pr-text)',
                  fontSize: '16px'
                }}
                className="h-11 text-base"
                placeholder="€" 
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Verwaltung (€/Mo)</Label>
              <Input 
                type="text"
                inputMode="decimal"
                value={inputs.rentOps.mgmtMonthly || ''}
                onChange={(e) => handleInputChange('rentOps', 'mgmtMonthly', e.target.value)}
                onBlur={(e) => handleInputChange('rentOps', 'mgmtMonthly', Math.max(0, Number(e.target.value)))}
                style={{ 
                  backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                  borderColor: 'rgba(75, 85, 99, 0.3)', 
                  color: 'var(--pr-text)',
                  fontSize: '16px'
                }}
                className="h-11 text-base"
                placeholder="€" 
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: 'var(--pr-muted)' }} className="text-base">Instandh. (€/Mo)</Label>
              <Input 
                type="text"
                inputMode="decimal"
                value={inputs.rentOps.capexMonthly || ''}
                onChange={(e) => handleInputChange('rentOps', 'capexMonthly', e.target.value)}
                onBlur={(e) => handleInputChange('rentOps', 'capexMonthly', Math.max(0, Number(e.target.value)))}
                style={{ 
                  backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                  borderColor: 'rgba(75, 85, 99, 0.3)', 
                  color: 'var(--pr-text)',
                  fontSize: '16px'
                }}
                className="h-11 text-base"
                placeholder="€" 
              />
            </div>
          </div>

          {level === 'pro' && (
            <>
              <Separator style={{ backgroundColor: 'rgba(75, 85, 99, 0.3)' }} className="my-4" />
              
              <SliderWithInput 
                label="Mietsteigerung p.a."
                value={inputs.rentOps.rentGrowthPct}
                onChange={(value) => handleSliderChange('rentOps', 'rentGrowthPct', value)}
                min={0}
                max={10}
                step={0.1}
                suffix="%"
              />
              
              <SliderWithInput 
                label="Wertsteigerung p.a."
                value={inputs.rentOps.valueGrowthPct}
                onChange={(value) => handleSliderChange('rentOps', 'valueGrowthPct', value)}
                min={0}
                max={10}
                step={0.1}
                suffix="%"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: 'var(--pr-card)', borderColor: 'rgba(75, 85, 99, 0.3)' }}>
        <CardHeader className="pb-3">
          <CardTitle style={{ color: 'var(--pr-text)' }} className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-400" />
            Darlehen & Steuern
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <SliderWithInput 
            label="Sollzins p.a."
            value={inputs.financing.interestPct}
            onChange={(value) => handleSliderChange('financing', 'interestPct', value)}
            min={0}
            max={10}
            step={0.1}
            suffix="%"
          />
          
          <SliderWithInput 
            label="Anfangstilgung p.a."
            value={inputs.financing.initialRedemptionPct}
            onChange={(value) => handleSliderChange('financing', 'initialRedemptionPct', value)}
            min={0}
            max={10}
            step={0.1}
            suffix="%"
          />
          
          <SliderWithInput 
            label="Planungshorizont"
            value={inputs.settings.horizonYears}
            onChange={(value) => handleSliderChange('settings', 'horizonYears', value)}
            min={1}
            max={35}
            step={1}
            suffix=" Jahre"
          />

          {level === 'pro' && (
            <>
              <Separator style={{ backgroundColor: 'rgba(75, 85, 99, 0.3)' }} className="my-4" />
              
              <SliderWithInput 
                label="Grenzsteuersatz"
                value={inputs.tax.marginalRatePct}
                onChange={(value) => handleSliderChange('tax', 'marginalRatePct', value)}
                min={0}
                max={45}
                step={0.5}
                suffix="%"
                tooltip="Ihr persönlicher höchster Steuersatz. Range: 0-45%"
              />
              
              <SliderWithInput 
                label="AfA-Satz p.a."
                value={inputs.tax.depreciationPct}
                onChange={(value) => handleSliderChange('tax', 'depreciationPct', value)}
                min={2}
                max={5}
                step={0.1}
                suffix="%"
                tooltip="Abschreibung für Abnutzung. Range: 2-5%"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
