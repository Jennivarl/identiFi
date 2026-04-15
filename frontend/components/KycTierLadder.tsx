'use client'

import { KYC_LEVELS, TIER_CONFIG, type KycLevel } from '@/lib/contracts'

interface Props {
  currentLevel: number
}

export default function KycTierLadder({ currentLevel }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-[#bbf7d0] p-5">
      <h2 className="text-sm font-bold text-[#166534] mb-4">KYC Identity Tiers</h2>
      <div className="flex flex-col gap-2">
        {KYC_LEVELS.map((level, idx) => {
          const cfg = TIER_CONFIG[level as KycLevel]
          const isActive = idx === currentLevel
          const isUnlocked = idx <= currentLevel
          return (
            <div
              key={level}
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all
                ${isActive ? 'bg-[#4ade80] shadow-md' : isUnlocked ? 'bg-[#dcfce7]' : 'bg-gray-50 opacity-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#14532d]' : isUnlocked ? 'bg-[#4ade80]' : 'bg-gray-300'}`} />
                <span className={`text-sm font-bold ${isActive ? 'text-[#14532d]' : isUnlocked ? 'text-[#166534]' : 'text-gray-400'}`}>
                  {level}
                </span>
                {isActive && <span className="text-xs bg-[#14532d] text-white px-2 py-0.5 rounded-full">You</span>}
              </div>
              <div className="flex gap-4 text-xs">
                <span className={isActive ? 'text-[#14532d] font-semibold' : 'text-[#4b7c5e]'}>
                  {cfg.collateralPct}% collateral
                </span>
                <span className={isActive ? 'text-[#14532d] font-semibold' : 'text-[#4b7c5e]'}>
                  {cfg.interestPct}% APY
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-[#4b7c5e] mt-3">
        KYC verification via HashKey Chain KYC Soulbound Token ·{' '}
        <a href="https://kyc-testnet.hunyuankyc.com/" target="_blank" rel="noreferrer"
          className="underline hover:text-[#166534]">Verify your identity →</a>
      </p>
    </div>
  )
}
