import { useAccount } from "wagmi"
import NFTCard, { NFTCardSkeleton } from "../components/NFTCard"
import { useActiveListings }        from "../hooks/useNFTMarketplace"

const SKELETON_COUNT = 8

export default function Marketplace() {
    const { isConnected }           = useAccount()
    const { listings, loading, error } = useActiveListings()

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Marketplace</h1>
                <p className="text-gray-400 mt-1 text-sm">
                    NFTs listed for sale on Sepolia — data served by The Graph
                </p>
            </div>

            {!isConnected && (
                <div className="mb-6 bg-amber-900/30 border border-amber-700 rounded-xl px-5 py-4 text-amber-300 text-sm">
                    Connect your wallet to buy or list NFTs.
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-900/30 border border-red-700 rounded-xl px-5 py-4 text-red-300 text-sm">
                    {process.env.NEXT_PUBLIC_SUBGRAPH_URL
                        ? `Subgraph error: ${error}`
                        : "Subgraph URL not configured — set NEXT_PUBLIC_SUBGRAPH_URL in .env.local"}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading
                    ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                          <NFTCardSkeleton key={i} />
                      ))
                    : listings.length === 0
                    ? (
                        <div className="col-span-full text-center py-24 text-gray-500">
                            <p className="text-4xl mb-4">🏷</p>
                            <p className="text-lg font-medium text-gray-300">No listings yet</p>
                            <p className="text-sm mt-1">Be the first to list an NFT</p>
                        </div>
                      )
                    : listings.map((item) => (
                          <NFTCard
                              key={item.id}
                              nftAddress={item.nftAddress}
                              tokenId={item.tokenId}
                              price={item.price}
                              seller={item.seller}
                          />
                      ))}
            </div>

            {!loading && listings.length > 0 && (
                <p className="text-center text-gray-600 text-xs mt-10">
                    {listings.length} listing{listings.length !== 1 ? "s" : ""} — live from The Graph · Sepolia
                </p>
            )}
        </div>
    )
}
