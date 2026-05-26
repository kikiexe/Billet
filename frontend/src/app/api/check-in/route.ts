import { NextResponse } from 'next/server'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { NFT_ABI, NFT_ADDRESS } from '@/config/contracts'

export async function POST(request: Request) {
  try {
    const { userWallet, tokenId, index } = await request.json()
    
    const gatekeeperPrivateKey = process.env.GATEKEEPER_PRIVATE_KEY as `0x${string}`
    if (!gatekeeperPrivateKey) {
      return NextResponse.json({ error: 'Gatekeeper private key not configured' }, { status: 500 })
    }
    
    const gatekeeperAccount = privateKeyToAccount(gatekeeperPrivateKey)
    const walletClient = createWalletClient({
      account: gatekeeperAccount,
      chain: baseSepolia,
      transport: http(),
    })
    
    const txHash = await walletClient.writeContract({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'checkInFromGate',
      args: [
        userWallet as `0x${string}`,
        BigInt(tokenId),
        BigInt(index)
      ],
    })
    
    return NextResponse.json({ success: true, hash: txHash })
  } catch (error) {
    const err = error as Error
    console.error("Check-in error:", err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
