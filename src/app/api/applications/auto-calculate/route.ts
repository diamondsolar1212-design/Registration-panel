import { NextRequest, NextResponse } from 'next/server'
import { calculateSolarOutput } from '@/lib/solar-calculator'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      landRoofSize,
      rooftopArea,
      propertyType,
      connectionType,
      electricityBill,
      preferredCapacity,
    } = body

    if (!landRoofSize || !propertyType || !connectionType) {
      return NextResponse.json(
        { error: 'landRoofSize, propertyType, and connectionType are required' },
        { status: 400 }
      )
    }

    // Read pricing from admin settings
    const { data: pricingSettings, error } = await db
      .from('AdminSettings')
      .select('*')
      .eq('category', 'pricing')

    if (error) throw error

    const costPerKw: Record<string, number> = {}
    for (const setting of pricingSettings || []) {
      const value = parseFloat(setting.value)
      if (isNaN(value) || value <= 0) continue
      if (setting.key === 'price_ongrid') costPerKw['on-grid'] = value
      else if (setting.key === 'price_offgrid') costPerKw['off-grid'] = value
      else if (setting.key === 'price_hybrid') costPerKw['hybrid'] = value
    }

    // Fallback defaults if admin hasn't set pricing
    if (!costPerKw['on-grid']) costPerKw['on-grid'] = 45000
    if (!costPerKw['off-grid']) costPerKw['off-grid'] = 65000
    if (!costPerKw['hybrid']) costPerKw['hybrid'] = 55000

    const calculation = calculateSolarOutput({
      landRoofSize: parseFloat(landRoofSize),
      rooftopArea: rooftopArea ? parseFloat(rooftopArea) : undefined,
      propertyType,
      connectionType,
      electricityBill: electricityBill ? parseFloat(electricityBill) : undefined,
      preferredCapacity: preferredCapacity ? parseFloat(preferredCapacity) : undefined,
      costPerKw,
    })

    // Business model: Company invests 80%, Client invests 20%, Profit shared 50-50
    const COMPANY_SHARE = 0.80
    const CLIENT_SHARE = 0.20
    const PROFIT_SPLIT = 0.50

    const totalProjectCost = calculation.estimatedCost
    const companyInvestment = parseFloat((totalProjectCost * COMPANY_SHARE).toFixed(0))
    const clientInvestment = parseFloat((totalProjectCost * CLIENT_SHARE).toFixed(0))

    const annualSavings = calculation.annualSavings
    const clientProfitShare = parseFloat((annualSavings * PROFIT_SPLIT).toFixed(0))
    const companyProfitShare = parseFloat((annualSavings * PROFIT_SPLIT).toFixed(0))

    // Payback & ROI based on client's 20% investment only
    const clientPaybackPeriod = parseFloat((clientInvestment / clientProfitShare).toFixed(1))
    const clientRoiPercent = parseFloat(((clientProfitShare * 25 - clientInvestment) / clientInvestment * 100).toFixed(1))

    // Market rate comparison (market charges ~15-20% more)
    const marketCostPerKw = Math.round((costPerKw[connectionType] || 50000) * 1.18)
    const savingPerKw = marketCostPerKw - (costPerKw[connectionType] || 50000)

    // Registration fee calculation: ~4.7% of client investment (20% of project cost), minimum ₹4,699
    // Example: Client pays ₹1,00,000 → Fee = ₹4,699
    const MIN_REGISTRATION_FEE = 4699
    const REGISTRATION_FEE_PERCENT = 4.699
    const rawRegFee = Math.round(clientInvestment * REGISTRATION_FEE_PERCENT / 100)
    const finalRegFee = Math.max(MIN_REGISTRATION_FEE, rawRegFee)
    // Round to nearest 99 for better pricing appearance (e.g., 4699, 4999, 9499)
    const displayRegFee = Math.max(MIN_REGISTRATION_FEE, Math.ceil(finalRegFee / 100) * 100 - 1)

    // Additional breakdown details
    const breakdown = {
      ...calculation,
      companyInvestment,
      clientInvestment,
      clientProfitShare,
      companyProfitShare,
      paybackPeriod: clientPaybackPeriod,
      roiPercent: clientRoiPercent,
      costPerKw: costPerKw[connectionType] || 50000,
      marketCostPerKw,
      savingPerKw,
      monthlySavings: parseFloat((clientProfitShare / 12).toFixed(0)),
      monthlyGeneration: parseFloat((calculation.annualGeneration / 12).toFixed(0)),
      panelsRequired: Math.ceil(calculation.recommendedCapacity / 0.4),
      systemSize: calculation.recommendedCapacity,
      subsidyEligible: connectionType === 'on-grid' && calculation.recommendedCapacity <= 10,
      estimatedSubsidy: connectionType === 'on-grid' && calculation.recommendedCapacity <= 10
        ? parseFloat((calculation.recommendedCapacity * 14588).toFixed(0))
        : 0,
      registrationFee: displayRegFee,
    }

    return NextResponse.json({ calculation: breakdown })
  } catch (error) {
    console.error('Auto-calculate error:', error)
    return NextResponse.json({ error: 'Failed to calculate solar metrics' }, { status: 500 })
  }
}
