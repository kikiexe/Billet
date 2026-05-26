import { useWriteContract, usePublicClient } from 'wagmi'
import { IDRX_ABI, IDRX_ADDRESS, MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/config/contracts'
import { parseEther } from 'viem'
import { useState } from 'react'

export function useBuyTicket() {
  const [txState, setTxState] = useState<'idle' | 'approving' | 'buying' | 'success'>('idle')
  
  const { writeContractAsync: writeContract } = useWriteContract()
  const publicClient = usePublicClient()

  const executePurchase = async (
    listingId: bigint,
    amount: number,
    totalPrice: string,
    niks: string[],
    names: string[]
  ) => {
    try {
      if (!publicClient) throw new Error("Public Client is not available")
      
      // 1. Execute Approval
      setTxState('approving')
      const approveHash = await writeContract({
        address: IDRX_ADDRESS,
        abi: IDRX_ABI,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, parseEther(totalPrice)],
      })
      
      // Wait until the approval transaction is confirmed on-chain
      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      // 2. Execute Purchase
      setTxState('buying')
      const buyHash = await writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'buyTicket',
        args: [
          listingId,
          BigInt(amount),
          niks,
          names
        ],
      })
      
      // Wait until the purchase transaction is confirmed on-chain
      await publicClient.waitForTransactionReceipt({ hash: buyHash })
      
      setTxState('success')
    } catch (error) {
      setTxState('idle')
      throw error
    }
  }

  return { executePurchase, txState }
}

