import { createPublicClient, http, parseAbi } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http("https://base-sepolia.g.alchemy.com/v2/IRm0znUyu95uZVbyEupxv")
})

const abi = parseAbi([
  'struct TicketHolder { string name; string nik; bool registered; bool used; }',
  'function getTicketHolders(address owner, uint256 tokenId) view returns (TicketHolder[])'
])

async function main() {
  const data = await client.readContract({
    address: '0x9EAd372789a14C3e4e172B7d82920aD8Ff474ab7',
    abi,
    functionName: 'getTicketHolders',
    args: ['0x7798d52Ec5f34DF71B142c720486cb41F947554c', 1n]
  })
  console.log(JSON.stringify(data, null, 2))
}

main().catch(console.error)
