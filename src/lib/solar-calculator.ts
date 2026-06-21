// Solar calculation utilities

export interface SolarCalculation {
  recommendedCapacity: number // kW
  estimatedCost: number // INR
  annualSavings: number // INR
  propertyScore: number // 0-100
  propertyClass: string // A, B, C, D
  co2Reduction: number // tonnes/year
  annualGeneration: number // kWh
  paybackPeriod: number // years
  roiPercent: number // %
  peakCapacity: number // kW
}

export function calculateSolarOutput(params: {
  landRoofSize: number // sq ft
  rooftopArea?: number // usable area sq ft
  propertyType: string
  connectionType: string
  electricityBill?: number // monthly INR
  preferredCapacity?: number // kW
  costPerKw?: Record<string, number> // INR per kW by connection type (from admin settings)
  avgRatePerKwh?: number // INR per kWh (from admin settings or default)
}): SolarCalculation {
  const {
    landRoofSize,
    rooftopArea,
    propertyType,
    connectionType,
    electricityBill,
    preferredCapacity,
    costPerKw: customCostPerKw,
    avgRatePerKwh: customAvgRate,
  } = params

  // Convert sq ft to sq m
  const usableArea = (rooftopArea || landRoofSize * 0.7) * 0.0929 // sq m

  // Average solar panel is ~2m x 1m = 2 sq m, produces ~400W
  const panelArea = 2 // sq m per panel
  const panelWattage = 0.4 // kW per panel

  // Number of panels that fit
  const maxPanels = Math.floor(usableArea / panelArea)
  const recommendedCapacity = preferredCapacity || parseFloat((maxPanels * panelWattage).toFixed(1))

  // Indian average solar irradiance: ~5.5 kWh/m2/day
  const solarIrradiance = 5.5
  const systemEfficiency = connectionType === 'off-grid' ? 0.72 : 0.78

  // Annual generation
  const annualGeneration = recommendedCapacity * solarIrradiance * 365 * systemEfficiency

  // Cost calculation - use admin settings if provided, otherwise fallback defaults
  const costPerKw: Record<string, number> = customCostPerKw || {
    'on-grid': 45000,
    'off-grid': 65000,
    'hybrid': 55000,
  }
  const estimatedCost = recommendedCapacity * (costPerKw[connectionType] || 50000)

  // Savings calculation
  const avgRatePerKwh = customAvgRate || 8.5 // INR per kWh average in India
  const annualSavings = annualGeneration * avgRatePerKwh

  // Property score (0-100)
  let score = 50
  // Roof size bonus
  if (landRoofSize > 2000) score += 15
  else if (landRoofSize > 1000) score += 10
  else if (landRoofSize > 500) score += 5

  // Property type bonus
  const typeBonus: Record<string, number> = {
    commercial: 15,
    industrial: 12,
    residential: 8,
    agricultural: 10,
  }
  score += typeBonus[propertyType] || 5

  // Connection type bonus
  const connBonus: Record<string, number> = {
    'on-grid': 10,
    hybrid: 8,
    'off-grid': 5,
  }
  score += connBonus[connectionType] || 5

  // Electricity bill bonus (higher bill = more savings potential)
  if (electricityBill) {
    if (electricityBill > 10000) score += 10
    else if (electricityBill > 5000) score += 7
    else if (electricityBill > 2000) score += 4
  }

  score = Math.min(100, Math.max(0, score))

  // Property class
  let propertyClass = 'D'
  if (score >= 85) propertyClass = 'A'
  else if (score >= 70) propertyClass = 'B'
  else if (score >= 55) propertyClass = 'C'

  // CO2 reduction (0.82 kg CO2 per kWh in India)
  const co2Reduction = (annualGeneration * 0.82) / 1000

  // Payback period
  const paybackPeriod = estimatedCost / annualSavings

  // ROI
  const roiPercent = ((annualSavings * 25 - estimatedCost) / estimatedCost) * 100

  return {
    recommendedCapacity: parseFloat(recommendedCapacity.toFixed(1)),
    estimatedCost: parseFloat(estimatedCost.toFixed(0)),
    annualSavings: parseFloat(annualSavings.toFixed(0)),
    propertyScore: parseFloat(score.toFixed(1)),
    propertyClass,
    co2Reduction: parseFloat(co2Reduction.toFixed(2)),
    annualGeneration: parseFloat(annualGeneration.toFixed(0)),
    paybackPeriod: parseFloat(paybackPeriod.toFixed(1)),
    roiPercent: parseFloat(roiPercent.toFixed(1)),
    peakCapacity: parseFloat((recommendedCapacity * 1.1).toFixed(1)),
  }
}
