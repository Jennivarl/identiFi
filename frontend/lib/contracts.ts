import { type Address } from 'viem'

// Fill these in after deployment
export const IDENTIFI_ADDRESS = (process.env.NEXT_PUBLIC_IDENTIFI_ADDRESS || '0x0') as Address
export const KYC_ADDRESS      = (process.env.NEXT_PUBLIC_KYC_ADDRESS      || '0x0') as Address
export const USDC_ADDRESS     = (process.env.NEXT_PUBLIC_USDC_ADDRESS      || '0x0') as Address

export const USDC_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const

export const KYC_LEVELS = ['NONE', 'BASIC', 'ADVANCED', 'PREMIUM', 'ULTIMATE'] as const
export type KycLevel = typeof KYC_LEVELS[number]

export const TIER_CONFIG: Record<KycLevel, { collateralPct: number; interestPct: number }> = {
  NONE:     { collateralPct: 150, interestPct: 12 },
  BASIC:    { collateralPct: 130, interestPct: 10 },
  ADVANCED: { collateralPct: 120, interestPct: 8 },
  PREMIUM:  { collateralPct: 110, interestPct: 6 },
  ULTIMATE: { collateralPct: 105, interestPct: 4 },
}

export const IDENTIFI_ABI = [
  {
    name: 'getKycLevel',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'loans',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'collateralHSK', type: 'uint256' },
      { name: 'borrowedUSD', type: 'uint256' },
      { name: 'borrowedAt', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'tiers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'collateralRatioBps', type: 'uint256' },
      { name: 'interestRateBps', type: 'uint256' },
    ],
  },
  {
    name: 'hskPriceUSDCents',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'liquidityPool',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'requiredCollateral',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'usdAmount', type: 'uint256' },
    ],
    outputs: [{ name: 'hskWei', type: 'uint256' }],
  },
  {
    name: 'maxBorrow',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'hskWei', type: 'uint256' },
    ],
    outputs: [{ name: 'usdAmount', type: 'uint256' }],
  },
  {
    name: 'accruedInterest',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'healthFactor',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'depositAndBorrow',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'usdAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const
