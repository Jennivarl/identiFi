'use client'
// LoanCard is superseded by MyLoans.tsx — kept for backwards compat
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { type Address } from 'viem'
import { IDENTIFI_ADDRESS, IDENTIFI_ABI } from '@/lib/contracts'

interface Props {
  address: Address
  collateralHSK: string
  borrowedUSD: string
  interestUSD: string
  interestRate: number
  healthPct: number
}

export default function LoanCard({
  address,
  collateralHSK,
  borrowedUSD,
  interestUSD,
  interestRate,
  healthPct,
}: Props) {
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const healthColor = healthPct >= 80 ? 'bg-[#4ade80]' : healthPct >= 50 ? 'bg-[#fde047]' : 'bg-red-400'
  const healthLabel = healthPct >= 80 ? 'Healthy' : healthPct >= 50 ? 'At Risk' : 'Danger'

  function handleRepay() {
    writeContract({
      address: IDENTIFI_ADDRESS,
      abi: IDENTIFI_ABI,
      functionName: 'repay',
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#bbf7d0] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#166534]">Active Loan</h2>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${healthPct >= 80 ? 'bg-[#dcfce7] text-[#166534]' : healthPct >= 50 ? 'bg-[#fef9c3] text-yellow-700' : 'bg-red-50 text-red-700'}`}>
          {healthLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#f9fef5] rounded-xl p-3">
          <p className="text-xs text-[#4b7c5e]">Collateral Locked</p>
          <p className="text-base font-black text-[#166534]">{Number(collateralHSK).toFixed(2)} HSK</p>
        </div>
        <div className="bg-[#f9fef5] rounded-xl p-3">
          <p className="text-xs text-[#4b7c5e]">Borrowed</p>
          <p className="text-base font-black text-[#fde047]">${borrowedUSD} USDC</p>
        </div>
        <div className="bg-[#fef9c3] rounded-xl p-3">
          <p className="text-xs text-yellow-700">Accrued Interest</p>
          <p className="text-base font-bold text-yellow-800">${interestUSD}</p>
        </div>
        <div className="bg-[#f9fef5] rounded-xl p-3">
          <p className="text-xs text-[#4b7c5e]">Annual Rate</p>
          <p className="text-base font-black text-[#166534]">{interestRate}%</p>
        </div>
      </div>

      {/* Health factor bar */}
      <div>
        <div className="flex justify-between text-xs text-[#4b7c5e] mb-1">
          <span>Health Factor</span>
          <span>{healthPct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`${healthColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(healthPct, 100)}%` }}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
          {error.message.slice(0, 120)}
        </p>
      )}

      {isSuccess ? (
        <p className="text-center text-[#166534] font-bold">✓ Loan repaid · Collateral returned!</p>
      ) : (
        <button
          onClick={handleRepay}
          disabled={isPending || isConfirming}
          className="w-full py-3 rounded-2xl bg-[#fde047] hover:bg-[#facc15] text-[#78350f] font-bold disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : `Repay $${borrowedUSD} + Interest`}
        </button>
      )}
    </div>
  )
}
