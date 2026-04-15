'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { type Address } from 'viem'
import { Leaf, Link as LinkIcon, ArrowLeft } from 'lucide-react'
import { IDENTIFI_ADDRESS, IDENTIFI_ABI, KYC_LEVELS, TIER_CONFIG, type KycLevel } from '@/lib/contracts'

interface Props {
  address: Address
  onBack: () => void
  onDisconnect: () => void
}

export default function MyLoans({ address, onBack, onDisconnect }: Props) {
  const { data: loan } = useReadContract({
    address: IDENTIFI_ADDRESS,
    abi: IDENTIFI_ABI,
    functionName: 'loans',
    args: [address],
  })

  const { data: interest } = useReadContract({
    address: IDENTIFI_ADDRESS,
    abi: IDENTIFI_ABI,
    functionName: 'accruedInterest',
    args: [address],
  })

  const { data: health } = useReadContract({
    address: IDENTIFI_ADDRESS,
    abi: IDENTIFI_ABI,
    functionName: 'healthFactor',
    args: [address],
  })

  const { data: kycLevelRaw } = useReadContract({
    address: IDENTIFI_ADDRESS,
    abi: IDENTIFI_ABI,
    functionName: 'getKycLevel',
    args: [address],
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const hasLoan = loan?.[3] === true
  const kycLevel = Number(kycLevelRaw ?? 0)
  const kycName = KYC_LEVELS[kycLevel] as KycLevel
  const interestRate = TIER_CONFIG[kycName].interestPct

  const amountBorrowed = loan ? (Number(loan[1]) / 1e6) : 0
  const collateralLocked = loan ? Number(formatEther(loan[0])) : 0
  const accruedInterestUSD = interest ? (Number(interest) / 1e6) : 0
  const healthFactor = health ? Math.min(Number(health) / 100, 100) : 100

  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`

  function getHealthColor(h: number) {
    if (h >= 80) return { bg: 'bg-[#4ade80]', text: 'text-[#4ade80]', label: 'Safe' }
    if (h >= 50) return { bg: 'bg-[#fde047]', text: 'text-[#fde047]', label: 'Warning' }
    return { bg: 'bg-red-500', text: 'text-red-500', label: 'Risk' }
  }

  const hc = getHealthColor(healthFactor)

  function handleRepay() {
    writeContract({
      address: IDENTIFI_ADDRESS,
      abi: IDENTIFI_ABI,
      functionName: 'repay',
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Leaf className="w-8 h-8 text-[#4ade80]" strokeWidth={2} />
              <LinkIcon className="w-3.5 h-3.5 text-[#4ade80] absolute -right-0.5 -bottom-0.5" strokeWidth={2.5} />
            </div>
            <span className="text-xl" style={{ fontWeight: 700 }}>IdentiFi</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#dcfce7] text-[#4ade80] px-4 py-2 rounded-full" style={{ fontWeight: 600 }}>
              {shortAddr}
            </div>
            <button
              onClick={onDisconnect}
              className="text-sm text-gray-700 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-full transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl mb-8" style={{ fontWeight: 700 }}>My Loans</h1>

        {!hasLoan ? (
          <div className="bg-white rounded-[12px] shadow-md p-12 text-center">
            <p className="text-gray-700 text-lg mb-4" style={{ fontWeight: 500 }}>No active loans</p>
            <button
              onClick={onBack}
              className="bg-[#4ade80] hover:bg-[#86efac] text-white px-6 py-3 rounded-[12px] transition-colors"
              style={{ fontWeight: 600 }}
            >
              Go Borrow
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-[12px] shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-gray-600" style={{ fontWeight: 600 }}>Amount Borrowed</th>
                    <th className="text-left px-6 py-4 text-gray-600" style={{ fontWeight: 600 }}>Collateral Locked</th>
                    <th className="text-left px-6 py-4 text-gray-600" style={{ fontWeight: 600 }}>Interest Rate</th>
                    <th className="text-left px-6 py-4 text-gray-600" style={{ fontWeight: 600 }}>Accrued Interest</th>
                    <th className="text-left px-6 py-4 text-gray-600" style={{ fontWeight: 600 }}>Health Factor</th>
                    <th className="text-left px-6 py-4 text-gray-600" style={{ fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-4">
                      <p className="text-gray-900" style={{ fontWeight: 600, fontSize: '16px' }}>
                        ${amountBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900" style={{ fontWeight: 600 }}>
                        {collateralLocked.toFixed(4)} HSK
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900" style={{ fontWeight: 600 }}>{interestRate}%</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900" style={{ fontWeight: 600 }}>
                        ${accruedInterestUSD.toFixed(4)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className={`${hc.bg} h-full transition-all`} style={{ width: `${healthFactor}%` }} />
                          </div>
                          <span className={`${hc.text} text-sm`} style={{ fontWeight: 600 }}>{healthFactor.toFixed(0)}%</span>
                        </div>
                        <p className={`${hc.text} text-sm`} style={{ fontWeight: 600 }}>{hc.label}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isSuccess ? (
                        <span className="text-[#4ade80] font-semibold">Repaid ✓</span>
                      ) : (
                        <button
                          onClick={handleRepay}
                          disabled={isPending || isConfirming}
                          className="bg-[#4ade80] hover:bg-[#86efac] disabled:bg-gray-300 text-white px-4 py-2 rounded-[12px] transition-colors"
                          style={{ fontWeight: 600 }}
                        >
                          {isPending ? 'Confirm…' : isConfirming ? 'Processing…' : 'Repay'}
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Card */}
            <div className="md:hidden bg-white rounded-[12px] shadow-md p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm mb-1" style={{ fontWeight: 500 }}>Amount Borrowed</p>
                  <p className="text-gray-900" style={{ fontWeight: 700, fontSize: '20px' }}>
                    ${amountBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {isSuccess ? (
                  <span className="text-[#4ade80] font-semibold">Repaid ✓</span>
                ) : (
                  <button
                    onClick={handleRepay}
                    disabled={isPending || isConfirming}
                    className="bg-[#4ade80] hover:bg-[#86efac] disabled:bg-gray-300 text-white px-4 py-2 rounded-[12px] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    {isPending ? 'Confirm…' : isConfirming ? 'Processing…' : 'Repay'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm mb-1" style={{ fontWeight: 500 }}>Collateral Locked</p>
                  <p className="text-gray-900" style={{ fontWeight: 600 }}>{collateralLocked.toFixed(4)} HSK</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1" style={{ fontWeight: 500 }}>Interest Rate</p>
                  <p className="text-gray-900" style={{ fontWeight: 600 }}>{interestRate}%</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1" style={{ fontWeight: 500 }}>Accrued Interest</p>
                  <p className="text-gray-900" style={{ fontWeight: 600 }}>${accruedInterestUSD.toFixed(4)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2" style={{ fontWeight: 500 }}>Health Factor</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className={`${hc.bg} h-full transition-all`} style={{ width: `${healthFactor}%` }} />
                  </div>
                  <span className={`${hc.text} text-sm`} style={{ fontWeight: 600 }}>{healthFactor.toFixed(0)}% {hc.label}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
