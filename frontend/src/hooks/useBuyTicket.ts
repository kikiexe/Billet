import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { IDRX_ABI, IDRX_ADDRESS, MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/config/contracts'
import { parseEther } from 'viem'
import { useState, useEffect } from 'react'

export function useBuyTicket() {
  const [txState, setTxState] = useState<'idle' | 'approving' | 'buying' | 'success'>('idle')
  
  const { data: approveHash, writeContractAsync: writeApprove } = useWriteContract()
  const { writeContractAsync: writeBuy } = useWriteContract()

  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  const [pendingPurchase, setPendingPurchase] = useState<{
    listingId: bigint,
    amount: number,
    niks: string[],
    names: string[]
  } | null>(null)

  const executePurchase = async (
    listingId: bigint,
    amount: number,
    totalPrice: string,
    niks: string[],
    names: string[]
  ) => {
    try {
      setTxState('approving')
      setPendingPurchase({ listingId, amount, niks, names })
      
      await writeApprove({
        address: IDRX_ADDRESS,
        abi: IDRX_ABI,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, parseEther(totalPrice)],
      })
    } catch (error) {
      setTxState('idle')
      throw error;
    }
  }

  useEffect(() => {
    if (isApproveSuccess && txState === 'approving' && pendingPurchase) {
      setTxState('buying')
      
      writeBuy({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'buyTicket',
        args: [
          pendingPurchase.listingId,
          BigInt(pendingPurchase.amount),
          pendingPurchase.niks,
          pendingPurchase.names
        ],
      })
      .then(() => setTxState('success'))
      .catch(() => setTxState('idle'))
    }
  }, [isApproveSuccess, txState, pendingPurchase, writeBuy])

  return { executePurchase, txState }
}
