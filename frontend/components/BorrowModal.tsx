'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { type Address } from 'viem'
import { X } from 'lucide-react'
import { IDENTIFI_ADDRESS, IDENTIFI_ABI } from '@/lib/contracts'
import { type KycLevel } from '@/lib/contracts'

interface Props {
  address: Address
  kycLevel: number
  kycName: KycLevel
  tierConfig: { collateralPct: number; interestPct: number }
  onClose: () => void
}

export default function BorrowModal({ address, kycLevel, kycName, tierConfig, onClose }: Props) {
  const [borrowAmount, setBorrowAmount] = useState('')

  const usdAmount = Math.floor((parseFloat(borrowAmount) || 0) * 1e6)

  const { data: requiredHSK } = useReadContract({
    address: IDENTIFI_ADDRESS,
    abi: IDENTIFI_ABI,
    functionName: 'requiredCollateral',
    args: [address, BigInt(usdAmount)],
    query: { enabled: usdAmount > 0 },
  })

  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const collateralHSK = requiredHSK ? Number(requiredHSK) / 1e18 : 0

  function handleConfirm() {
    if (!requiredHSK || usdAmount === 0) return
    writeContract({
      address: IDENTIFI_ADDRESS,
      abi: IDENTIFI_ABI,
      functionName: 'depositAndBorrow',
      args: [BigInt(usdAmount)],
      value: requiredHSK,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-[12px] sm:rounded-[12px] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>Borrow Funds</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* KYC Level Badge */}
          <div>
            <p className="text-gray-900 mb-2" style={{ fontWeight: 500 }}>Your KYC Level</p>
            <div className="inline-block bg-[#fef08a] text-gray-900 px-4 py-2 rounded-[12px]" style={{ fontWeight: 700 }}>
              {kycName}
            </div>
          </div>

          {/* Borrow Amount Input */}
          <div>
            <label className="block text-gray-900 mb-2" style={{ fontWeight: 500 }}>
              Borrow Amount (USDC)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" style={{ fontWeight: 600 }}>$</span>
              <input
                type="text"
                value={borrowAmount}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '' || /^\d*\.?\d*$/.test(v)) setBorrowAmount(v)
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-[12px] focus:outline-none focus:border-[#4ade80] transition-colors placeholder-gray-400 text-gray-900"
                style={{ fontWeight: 600, fontSize: '18px' }}
              />
            </div>
          </div>

          {/* Collateral Required */}
          {usdAmount > 0 && (
            <div className="bg-[#dcfce7] p-4 rounded-[12px]">
              <p className="text-gray-900 mb-1" style={{ fontWeight: 500 }}>
                HSK Collateral Required ({tierConfig.collateralPct}%)
              </p>
              <p className="text-[#4ade80]" style={{ fontWeight: 700, fontSize: '20px' }}>
                {collateralHSK.toFixed(4)} HSK
              </p>
              <p className="text-gray-700 text-xs mt-1"> send as transaction value</p>
            </div>
          )}

          {/* Interest Rate */}
          <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
            <p className="text-gray-900" style={{ fontWeight: 500 }}>Interest Rate (APR)</p>
            <p className="text-gray-900" style={{ fontWeight: 700, fontSize: '18px' }}>{tierConfig.interestPct}%</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-[12px] px-4 py-2">{error.message.slice(0, 120)}</p>
          )}

          {isSuccess ? (
            <div className="text-center py-2">
              <p className="text-[#4ade80]" style={{ fontWeight: 700 }}> Borrow confirmed! USDC sent to your wallet.</p>
              <button onClick={onClose} className="mt-3 text-gray-700 underline text-sm">Close</button>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!borrowAmount || usdAmount === 0 || isPending || isConfirming}
              className="w-full bg-[#4ade80] hover:bg-[#86efac] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 px-6 rounded-[12px] transition-colors"
              style={{ fontWeight: 600, fontSize: '16px' }}
            >
              {isPending ? 'Confirm in wallet' : isConfirming ? 'Confirming on-chain' : 'Confirm Borrow'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
