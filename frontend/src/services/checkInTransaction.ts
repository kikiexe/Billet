export async function executeOnChainCheckIn(
  userWallet: string,
  tokenId: number,
  index: number
): Promise<`0x${string}`> {
  try {
    const response = await fetch('/api/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userWallet, tokenId, index }),
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Check-in failed')
    }
    
    const data = await response.json()
    return data.hash;
  } catch (error) {
    console.error("Check-in request failed:", error)
    throw error
  }
}

