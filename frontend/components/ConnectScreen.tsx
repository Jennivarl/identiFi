'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useConnect } from 'wagmi'
import { Leaf, Link as LinkIcon, Shield, Zap, ChevronRight, CheckCircle2 } from 'lucide-react'
import { KYC_LEVELS, TIER_CONFIG, type KycLevel } from '@/lib/contracts'

const TIER_COLORS: Record<KycLevel, { badge: string; dot: string }> = {
  NONE:     { badge: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  BASIC:    { badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  ADVANCED: { badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  PREMIUM:  { badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  ULTIMATE: { badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
}

export default function ConnectScreen() {
  const { login } = usePrivy()
  const { connect, connectors } = useConnect()

  const handleSignIn = () => {
    try {
      login()
    } catch {
      // Fallback to wagmi injected connector
      if (connectors[0]) connect({ connector: connectors[0] })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Leaf className="w-7 h-7 text-[#4ade80]" strokeWidth={2} />
              <LinkIcon className="w-3 h-3 text-[#4ade80] absolute -right-0.5 -bottom-0.5" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900" style={{fontFamily: 'var(--font-playfair)'}}>IdentiFi</span>
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              HashKey Chain
            </span>
          </div>
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors"
          >
            Sign In <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                <Shield className="w-4 h-4" />
                Identity-Powered DeFi
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                Borrow More.<br />
                <span className="text-[#4ade80]">Prove Less.</span>
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed mb-10">
                IdentiFi reads your on-chain KYC verification from HashKey Chain and rewards
                higher trust with dramatically better loan terms. Your identity is your credit score.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSignIn}
                  className="flex items-center justify-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-green-200 hover:shadow-green-300"
                >
                  <Zap className="w-5 h-5" />
                  Sign In to Borrow
                </button>
                <a
                  href="#tiers"
                  className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-8 py-4 rounded-2xl text-lg font-semibold transition-colors"
                >
                  View Rates
                </a>
              </div>
              <p className="text-sm text-gray-700 mt-4">
                Sign in with email, Google, or your EVM wallet · Powered by Privy
              </p>
            </div>

            {/* Right: KYC tier preview cards */}
            <div className="relative hidden lg:block">
              <div className="space-y-3">
                {(KYC_LEVELS as readonly KycLevel[]).map((level, i) => {
                  const cfg = TIER_CONFIG[level]
                  const colors = TIER_COLORS[level]
                  const isUltimate = level === 'ULTIMATE'
                  return (
                    <div
                      key={level}
                      style={{ marginLeft: `${i * 16}px` }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isUltimate
                          ? 'bg-white border-green-200 shadow-xl shadow-green-100 ring-2 ring-[#4ade80]'
                          : 'bg-white border-gray-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>{level}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-gray-700 text-xs">Collateral</div>
                          <div className="font-bold text-gray-900">{cfg.collateralPct}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-700 text-xs">Interest</div>
                          <div className={`font-bold ${isUltimate ? 'text-green-500' : 'text-gray-900'}`}>{cfg.interestPct}% APR</div>
                        </div>
                        {isUltimate && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-green-100 rounded-full opacity-50 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-900 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: '$1,000,000', label: 'Available Liquidity', sub: 'Mock USDC on testnet' },
            { value: '5', label: 'KYC Tiers', sub: 'Native HashKey Chain identity' },
            { value: '4%', label: 'Lowest Rate', sub: 'For ULTIMATE KYC holders' },
          ].map(({ value, label, sub }) => (
            <div key={label}>
              <div className="text-4xl font-black text-white mb-2">{value}</div>
              <div className="text-[#4ade80] font-semibold">{label}</div>
              <div className="text-gray-300 text-sm mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-4">How It Works</h2>
          <p className="text-gray-700 text-center mb-16 max-w-xl mx-auto">
            Three steps from KYC verification to a better loan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Verify Your Identity',
                desc: 'Complete KYC on HashKey Exchange. Your verification level is stored as a non-transferable Soul-Bound Token on HashKey Chain.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                step: '02',
                title: 'Connect to IdentiFi',
                desc: 'Sign in with your verified wallet. IdentiFi reads your on-chain KYC SBT and instantly determines your borrowing tier.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                step: '03',
                title: 'Borrow at Your Rate',
                desc: 'Post HSK collateral and borrow USDC at your personalized rate. Higher KYC = lower collateral, lower interest.',
                color: 'bg-green-50 text-green-600',
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="bg-gray-50 rounded-3xl p-8">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${color} text-xl font-black mb-6`}>
                  {step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-700 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KYC Tier Table — the CENTERPIECE */}
      <section id="tiers" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-4">
            Rates by KYC Tier
          </h2>
          <p className="text-gray-700 text-center mb-12">
            The higher your on-chain KYC level, the better your borrowing terms.
            ULTIMATE tier holders need only 105% collateral at 4% APR.
          </p>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4 px-8 py-4 bg-gray-50 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">KYC Level</div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Collateral Required</div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Interest Rate</div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Savings vs NONE</div>
            </div>

            {(KYC_LEVELS as readonly KycLevel[]).map((level, i) => {
              const cfg = TIER_CONFIG[level]
              const colors = TIER_COLORS[level]
              const isUltimate = level === 'ULTIMATE'
              const collateralSavings = TIER_CONFIG['NONE'].collateralPct - cfg.collateralPct
              const rateSavings = TIER_CONFIG['NONE'].interestPct - cfg.interestPct
              return (
                <div
                  key={level}
                  className={`grid grid-cols-4 gap-4 px-8 py-5 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                    isUltimate ? 'bg-green-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${colors.badge}`}>{level}</span>
                    {isUltimate && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">BEST</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{cfg.collateralPct}%</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${isUltimate ? 'text-green-500' : 'text-gray-900'}`}>
                      {cfg.interestPct}% APR
                    </span>
                  </div>
                  <div className="text-right">
                    {collateralSavings > 0 ? (
                      <span className="text-sm text-green-600 font-semibold">
                        -{collateralSavings}% collateral, -{rateSavings}% APR
                      </span>
                    ) : (
                      <span className="text-sm text-gray-700">Baseline</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-green-200"
            >
              <Zap className="w-5 h-5" />
              Sign In &amp; Start Borrowing
            </button>
            <p className="text-sm text-gray-700 mt-4">
              Email · Google · MetaMask · Rabby · WalletConnect
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="relative">
            <Leaf className="w-6 h-6 text-[#4ade80]" strokeWidth={2} />
            <LinkIcon className="w-2.5 h-2.5 text-[#4ade80] absolute -right-0.5 -bottom-0.5" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-lg">IdentiFi</span>
        </div>
        <p className="text-gray-300 text-sm">
          Built on HashKey Chain · HashKey DeFi Hackathon 2025
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Contracts: IdentiFi <span className="font-mono">0x82c3eB94d…</span> · 
          MockKycSBT <span className="font-mono">0x5B163B75…</span>
        </p>
      </footer>
    </div>
  )
}
