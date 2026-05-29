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
    address: '0x2e8e67aA822D8E2c7FAC95D6B142830C7dbe1Ebc',
    abi,
    functionName: 'getTicketHolders',
    args: ['0x7798d52Ec5f34DF71B142c720486cb41F947554c', 1n]
  })
  console.log(JSON.stringify(data, null, 2))
}

main().catch(console.error)
