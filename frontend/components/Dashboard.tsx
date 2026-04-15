'use client'

import { useReadContract, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { useState } from 'react'
import { type Address } from 'viem'
import {
  Leaf, Link as LinkIcon, LayoutDashboard, TrendingDown,
  FileText, Shield, LogOut, Zap, CheckCircle2, Lock, Info,
} from 'lucide-react'
import {
  IDENTIFI_ADDRESS, IDENTIFI_ABI, KYC_LEVELS, TIER_CONFIG,
  type KycLevel, USDC_ADDRESS, USDC_ABI,
} from '@/lib/contracts'
import BorrowModal from './BorrowModal'
import MyLoans from './MyLoans'

type Tab = 'dashboard' | 'borrow' | 'loans' | 'kyc'

const NAV: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'borrow',    label: 'Borrow',     Icon: TrendingDown },
  { id: 'loans',     label: 'My Loans',   Icon: FileText },
  { id: 'kyc',       label: 'KYC Status', Icon: Shield },
]

const BADGE: Record<KycLevel, string> = {
  NONE:     'bg-gray-700/60 text-gray-300',
  BASIC:    'bg-blue-900/60 text-blue-300',
  ADVANCED: 'bg-purple-900/60 text-purple-300',
  PREMIUM:  'bg-amber-900/60 text-amber-300',
  ULTIMATE: 'bg-green-900/60 text-green-300',
}
const DOT: Record<KycLevel, string> = {
  NONE: 'bg-gray-500', BASIC: 'bg-blue-500', ADVANCED: 'bg-purple-500',
  PREMIUM: 'bg-amber-500', ULTIMATE: 'bg-green-400',
}
const LIGHT_BADGE: Record<KycLevel, string> = {
  NONE:     'bg-gray-100 text-gray-600',
  BASIC:    'bg-blue-100 text-blue-700',
  ADVANCED: 'bg-purple-100 text-purple-700',
  PREMIUM:  'bg-amber-100 text-amber-700',
  ULTIMATE: 'bg-green-100 text-green-700',
}

interface Props {
  address: Address
  onDisconnect: () => void
}

export default function Dashboard({ address, onDisconnect }: Props) {
  const [tab, setTab] = useState<Tab>('borrow')
  const [showBorrow, setShowBorrow] = useState(false)

  const { data: hskBalance } = useBalance({ address })
  const { data: kycLevelRaw } = useReadContract({
    address: IDENTIFI_ADDRESS, abi: IDENTIFI_ABI,
    functionName: 'getKycLevel', args: [address],
  })
  const { data: loan } = useReadContract({
    address: IDENTIFI_ADDRESS, abi: IDENTIFI_ABI,
    functionName: 'loans', args: [address],
  })
  const { data: liquidity } = useReadContract({
    address: IDENTIFI_ADDRESS, abi: IDENTIFI_ABI,
    functionName: 'liquidityPool',
  })
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_ABI,
    functionName: 'balanceOf', args: [address],
  })

  const kycLevel      = Number(kycLevelRaw ?? 0)
  const kycName       = KYC_LEVELS[kycLevel] as KycLevel
  const tierConfig    = TIER_CONFIG[kycName]
  const hasLoan       = loan?.[3] === true
  const borrowedUSD   = hasLoan ? Number(loan?.[1] ?? 0) / 1e6 : 0
  const available     = liquidity ? Number(liquidity) / 1e6 : 0
  const hskNum        = hskBalance ? parseFloat(formatEther(hskBalance.value)) : 0
  const usdcFmt       = usdcBalance ? (Number(usdcBalance) / 1e6).toFixed(2) : '0.00'
  const maxBorrow     = hskNum * 100 / (tierConfig.collateralPct / 100)
  const shortAddr     = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0f1117' }}>

        {/* ══ SIDEBAR ══ */}
        <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#161b27' }}>
          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: '#1e2637' }}>
            <div className="relative mr-2">
              <Leaf className="w-6 h-6 text-[#4ade80]" strokeWidth={2} />
              <LinkIcon className="w-2.5 h-2.5 text-[#4ade80] absolute -right-0.5 -bottom-0.5" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-base">IdentiFi</span>
          </div>

          {/* Chain pill */}
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: '#1e2637' }}>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-300 text-xs font-medium">HashKey Testnet</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 pt-5 space-y-0.5">
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === id
                    ? 'text-[#4ade80] border'
                    : 'text-gray-300 hover:text-white'
                }`}
                style={tab === id ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)' } : {}}
              >
                <Icon size={16} />
                {label}
                {id === 'borrow' && tab !== 'borrow' && (
                  <span className="ml-auto text-xs rounded-full px-1.5 py-0.5"
                    style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                    Live
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-3 pb-5 space-y-2" style={{ borderTop: '1px solid #1e2637', paddingTop: '16px', marginTop: '16px' }}>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: '#1e2637' }}>
              <div className={`w-2 h-2 rounded-full ${DOT[kycName]}`} />
              <span className="text-gray-300 text-xs">KYC</span>
              <span className={`text-xs font-bold ml-1 px-2 py-0.5 rounded-full ${BADGE[kycName]}`}>{kycName}</span>
            </div>
            <div className="rounded-lg px-3 py-1.5 font-mono text-xs text-gray-300" style={{ background: '#1e2637' }}>
              {shortAddr}
            </div>
            <button
              onClick={onDisconnect}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-red-400 text-xs font-medium rounded-xl transition-all"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {/* Top bar */}
          <div className="bg-white border-b border-gray-200 h-14 flex items-center px-8 sticky top-0 z-10">
            <h1 className="flex-1 text-base font-bold text-gray-900">
              {tab === 'dashboard' && 'Overview'}
              {tab === 'borrow' && 'Borrow Markets'}
              {tab === 'loans' && 'My Loans'}
              {tab === 'kyc' && 'KYC Status'}
            </h1>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-gray-700">HSK Balance</div>
                <div className="text-sm font-bold text-gray-900">{hskNum.toFixed(3)} HSK</div>
              </div>
              {Number(usdcBalance ?? 0) > 0 && (
                <div className="text-right">
                  <div className="text-xs text-gray-700">USDC Balance</div>
                  <div className="text-sm font-bold text-green-600">${usdcFmt}</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {tab === 'dashboard' && (
              <OverviewTab
                kycName={kycName} kycLevel={kycLevel} tierConfig={tierConfig}
                available={available} hasLoan={hasLoan} borrowedUSD={borrowedUSD}
                maxBorrow={maxBorrow}
                onBorrow={() => setShowBorrow(true)}
                onViewLoans={() => setTab('loans')}
                onViewBorrow={() => setTab('borrow')}
              />
            )}
            {tab === 'borrow' && (
              <BorrowTab
                kycName={kycName} kycLevel={kycLevel} tierConfig={tierConfig}
                available={available} maxBorrow={maxBorrow}
                onBorrow={() => setShowBorrow(true)}
              />
            )}
            {tab === 'loans' && (
              <MyLoans address={address} onBack={() => setTab('dashboard')} onDisconnect={onDisconnect} />
            )}
            {tab === 'kyc' && (
              <KycTab kycLevel={kycLevel} />
            )}
          </div>
        </main>
      </div>

      {showBorrow && (
        <BorrowModal address={address} kycLevel={kycLevel} kycName={kycName}
          tierConfig={tierConfig} onClose={() => setShowBorrow(false)} />
      )}
    </>
  )
}

/* ═══════════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════════ */
function OverviewTab({ kycName, kycLevel, tierConfig, available, hasLoan, borrowedUSD, maxBorrow, onBorrow, onViewLoans, onViewBorrow }:
  { kycName: KycLevel; kycLevel: number; tierConfig: { collateralPct: number; interestPct: number }
    available: number; hasLoan: boolean; borrowedUSD: number; maxBorrow: number
    onBorrow: () => void; onViewLoans: () => void; onViewBorrow: () => void }) {

  const efficiency = Math.round(100 / tierConfig.collateralPct * 100)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Your KYC Level"
          value={<span className={`text-2xl font-black px-4 py-1 rounded-xl ${LIGHT_BADGE[kycName]}`}>{kycName}</span>}
          sub={`Tier ${kycLevel + 1} of 5`}
        />
        <StatCard
          label="Borrow Rate"
          value={<span className="text-3xl font-black text-gray-900">{tierConfig.interestPct}%</span>}
          sub="APR on USDC loans"
          accent
        />
        <StatCard
          label="Capital Efficiency"
          value={<span className="text-3xl font-black text-gray-900">{efficiency}%</span>}
          sub={`${tierConfig.collateralPct}% collateral required`}
        />
      </div>

      {/* Pool + Your position side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">USDC Lending Pool</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            ${available.toLocaleString()}
          </div>
          <div className="text-sm text-gray-700">Available to borrow</div>
          <button onClick={onViewBorrow}
            className="mt-4 w-full bg-[#4ade80] hover:bg-[#22c55e] text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
            <Zap size={16} /> Borrow USDC
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Your Position</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Active Loans</span>
              <span className="font-bold text-gray-900">{hasLoan ? 1 : 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Total Borrowed</span>
              <span className="font-bold text-gray-900">${borrowedUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Max Borrow Capacity</span>
              <span className="font-bold text-green-600">${maxBorrow.toFixed(0)}</span>
            </div>
          </div>
          {hasLoan && (
            <button onClick={onViewLoans}
              className="mt-4 w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors">
              View Active Loan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   BORROW TAB — the SHOWCASE
═══════════════════════════════════════ */
function BorrowTab({ kycName, kycLevel, tierConfig, available, maxBorrow, onBorrow }:
  { kycName: KycLevel; kycLevel: number; tierConfig: { collateralPct: number; interestPct: number }
    available: number; maxBorrow: number; onBorrow: () => void }) {

  return (
    <div className="space-y-6">
      {/* USDC Market card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Available Markets</h2>
            <span className="text-xs text-gray-700">Powered by HashKey Chain KYC</span>
        </div>
        {/* Table header */}
        <div className="grid px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider"
          style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr auto' }}>
          <span>Asset</span>
          <span>Available</span>
          <span>Your Rate</span>
          <span>Collateral</span>
          <span />
        </div>
        {/* USDC row */}
        <div className="grid px-6 py-5 items-center border-t border-gray-50 hover:bg-gray-50 transition-colors"
          style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr auto' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">$</div>
            <div>
              <div className="font-bold text-gray-900">USDC</div>
              <div className="text-xs text-gray-700">USD Coin (Mock)</div>
            </div>
          </div>
          <div>
            <div className="font-bold text-gray-900">${available.toLocaleString()}</div>
              <div className="text-xs text-gray-700">Liquid</div>
          </div>
          <div>
            <div className="font-bold text-green-600">{tierConfig.interestPct}% APR</div>
            <div className={`text-xs mt-0.5 px-2 py-0.5 rounded-full inline-block ${LIGHT_BADGE[kycName]}`}>{kycName} tier</div>
          </div>
          <div>
            <div className="font-bold text-gray-900">{tierConfig.collateralPct}% HSK</div>
              <div className="text-xs text-gray-700">Max ${maxBorrow.toFixed(0)}</div>
          </div>
          <button onClick={onBorrow}
            className="bg-[#4ade80] hover:bg-[#22c55e] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5">
            <Zap size={14} /> Borrow
          </button>
        </div>
      </div>

      {/* ── KYC Rate Comparison — THE CENTERPIECE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield size={18} className="text-[#4ade80]" />
          <h2 className="font-bold text-gray-900">Rates by KYC Tier</h2>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-700">
            <Info size={12} />
            Higher KYC = better capital efficiency
          </div>
        </div>

        {/* Table header */}
        <div className="grid px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider"
          style={{ gridTemplateColumns: '1.5fr 1fr 1fr 2fr 1fr' }}>
          <span>Level</span>
          <span className="text-right">Collateral</span>
          <span className="text-right">Interest</span>
          <span className="pl-4">Capital Efficiency</span>
          <span className="text-right">Status</span>
        </div>

        {(KYC_LEVELS as readonly KycLevel[]).map((level, i) => {
          const cfg = TIER_CONFIG[level]
          const efficiency = Math.round(1000000 / cfg.collateralPct) / 10000
          const effPct = efficiency * 100
          const isCurrent = i === kycLevel
          const isUnlocked = i < kycLevel
          const isUltimate = level === 'ULTIMATE'

          return (
            <div
              key={level}
              className={`grid px-6 py-4 items-center border-t border-gray-50 transition-colors ${
                isCurrent ? 'bg-green-50/60' : isUltimate ? 'bg-gray-50/40' : ''
              }`}
              style={{ gridTemplateColumns: '1.5fr 1fr 1fr 2fr 1fr' }}
            >
              {/* Level */}
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${DOT[level]}`} />
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${LIGHT_BADGE[level]}`}>{level}</span>
                {isUltimate && (
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">BEST</span>
                )}
              </div>

              {/* Collateral */}
              <div className="text-right">
                <span className={`font-bold ${isCurrent ? 'text-gray-900' : 'text-gray-900'}`}>{cfg.collateralPct}%</span>
              </div>

              {/* Interest */}
              <div className="text-right">
                <span className={`font-bold ${isUltimate ? 'text-green-600' : 'text-gray-900'}`}>
                  {cfg.interestPct}%
                </span>
              </div>

              {/* Efficiency bar */}
              <div className="pl-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isUltimate ? 'bg-green-400' : isCurrent ? 'bg-purple-400' : 'bg-gray-300'
                      }`}
                      style={{ width: `${effPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-700 w-10 text-right">{effPct.toFixed(1)}%</span>
                </div>
              </div>

              {/* Status */}
              <div className="text-right">
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                    <CheckCircle2 size={14} /> Your Tier
                  </span>
                ) : isUnlocked ? (
                  <span className="text-xs text-gray-700">Achieved</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Lock size={12} />
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Footer note */}
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100 text-xs text-blue-600">
          <strong>How to unlock higher tiers:</strong> Complete KYC on HashKey Exchange.
          Your verification level is stored on-chain as a non-transferable Soul-Bound Token (SBT) and read directly by IdentiFi.
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   KYC STATUS TAB
═══════════════════════════════════════ */
function KycTab({ kycLevel }: { kycLevel: number }) {
  const REQ: Record<KycLevel, { shortDesc: string; requirements: string[] }> = {
    NONE:     { shortDesc: 'No verification', requirements: ['Anonymous wallet', 'No identity required'] },
    BASIC:    { shortDesc: 'Email / phone verified', requirements: ['HashKey Exchange account', 'Email or phone verification', 'Basic AML screening'] },
    ADVANCED: { shortDesc: 'Government ID verified', requirements: ['Valid passport or national ID', 'Full name + date of birth', 'Standard AML/KYC check', 'Facial liveness verification'] },
    PREMIUM:  { shortDesc: 'Enhanced due diligence', requirements: ['Government ID (ADVANCED)', 'Proof of address document', 'Source of funds declaration', 'Enhanced AML screening'] },
    ULTIMATE: { shortDesc: 'Institutional-grade KYC', requirements: ['All PREMIUM requirements', 'Comprehensive financial profile', 'Accredited investor or professional status', 'Ongoing compliance monitoring', 'Typically for institutional accounts'] },
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-2">
        <h3 className="font-bold text-gray-900 mb-1">Your Current Level</h3>
        <p className="text-sm text-gray-700">
          KYC tiers are issued by HashKey Exchange and stored on HashKey Chain as immutable Soul-Bound Tokens.
          IdentiFi reads these on-chain to determine your borrowing terms — no manual verification needed.
        </p>
      </div>

      {(KYC_LEVELS as readonly KycLevel[]).map((level, i) => {
        const isCurrent = i === kycLevel
        const isAchieved = i < kycLevel
        const req = REQ[level]

        return (
          <div
            key={level}
            className={`bg-white rounded-2xl border-2 p-5 transition-all ${
              isCurrent
                ? 'border-green-300 shadow-md shadow-green-50'
                : isAchieved
                ? 'border-gray-100'
                : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCurrent ? 'bg-green-100' : isAchieved ? 'bg-gray-100' : 'bg-gray-50'
              }`}>
                {isCurrent || isAchieved
                  ? <CheckCircle2 size={20} className={isCurrent ? 'text-green-500' : 'text-gray-400'} />
                  : <Lock size={20} className="text-gray-300" />
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`font-bold text-base px-3 py-0.5 rounded-full ${LIGHT_BADGE[level]}`}>{level}</span>
                  {isCurrent && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">Current</span>}
                  <span className="ml-auto text-sm font-bold text-gray-700">{TIER_CONFIG[level].interestPct}% APR · {TIER_CONFIG[level].collateralPct}% collateral</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{req.shortDesc}</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  {req.requirements.map((r, ri) => (
                    <li key={ri} className="flex items-center gap-1.5">
                      <div className={`w-1 h-1 rounded-full ${isAchieved || isCurrent ? DOT[level] : 'bg-gray-300'}`} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════ */
function StatCard({ label, value, sub, accent }: {
  label: string; value: React.ReactNode; sub?: string; accent?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-6 ${accent ? 'border-green-100' : 'border-gray-100'}`}>
      <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
      <div className="mb-1">{value}</div>
      {sub && <div className="text-xs text-gray-700">{sub}</div>}
    </div>
  )
}
