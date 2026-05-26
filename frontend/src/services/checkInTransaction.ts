import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { NFT_ABI, NFT_ADDRESS } from '@/config/contracts'

const gatekeeperPrivateKey = (process.env.NEXT_PUBLIC_GATEKEEPER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000') as `0x${string}`
const gatekeeperAccount = privateKeyToAccount(gatekeeperPrivateKey)

const walletClient = createWalletClient({
  account: gatekeeperAccount,
  chain: baseSepolia,
  transport: http(),
})

export async function executeOnChainCheckIn(
  userWallet: string,
  tokenId: number,
  index: number
): Promise<`0x${string}`> {
  try {
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
    
    return txHash;
  } catch (error) {
    console.error("Transaksi pembakaran gagal:", error)
    throw error
  }
}
