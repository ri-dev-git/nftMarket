import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { ConnectButton }        from "@rainbow-me/rainbowkit"
import Link                     from "next/link"
import { useSellerListings }    from "../hooks/useNFTMarketplace"
import NftMarketplaceAbi        from "../constants/NftMarketplaceAbi.json"
import { parseContractError }   from "../utils/errors"
import {
    formatPrice, truncateAddress,
    sepoliaEtherscanTx, formatTimestamp,
} from "../utils/format"

const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ label, value }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <p className="text-gray-400 text-xs uppercase tracking-widest">{label}</p>
            <p className="text-white text-2xl font-bold mt-1">{value}</p>
        </div>
    )
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }) {
    return <h2 className="text-lg font-semibold text-white mb-4">{children}</h2>
}

// ── Listing row ───────────────────────────────────────────────────────────────
function ListingRow({ item }) {
    return (
        <Link href={`/nft/${item.nftAddress}/${item.tokenId}`}
            className="flex items-center justify-between py-3 border-b border-gray-800 hover:bg-gray-800/40 px-2 rounded transition-colors">
            <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono text-xs">#{item.tokenId}</span>
                <span className="text-gray-300 text-sm font-mono">{truncateAddress(item.nftAddress)}</span>
                {item.updatedAt && (
                    <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded-full">
                        updated
                    </span>
                )}
            </div>
            <span className="text-indigo-400 font-semibold text-sm">{formatPrice(item.price)} ETH</span>
        </Link>
    )
}

// ── Sale row ─────────────────────────────────────────────────────────────────
function SaleRow({ item }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-800 px-2">
            <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono text-xs">#{item.tokenId}</span>
                <span className="text-gray-300 text-sm font-mono">{truncateAddress(item.nftAddress)}</span>
                <span className="text-gray-500 text-xs">→ {truncateAddress(item.buyer)}</span>
            </div>
            <div className="text-right">
                <p className="text-green-400 font-semibold text-sm">{formatPrice(item.price)} ETH</p>
                <p className="text-gray-500 text-xs">{formatTimestamp(item.boughtAt)}</p>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Profile() {
    const { address, isConnected } = useAccount()
    const { data, loading, error } = useSellerListings(address)

    const {
        writeContract: withdraw,
        data:          withdrawHash,
        isPending:     isWithdrawPending,
        error:         withdrawError,
        reset:         resetWithdraw,
    } = useWriteContract()

    const {
        isLoading: isWithdrawConfirming,
        isSuccess: isWithdrawSuccess,
    } = useWaitForTransactionReceipt({ hash: withdrawHash })

    function handleWithdraw() {
        resetWithdraw()
        withdraw({
            address:      MARKETPLACE,
            abi:          NftMarketplaceAbi,
            functionName: "withdrawProceeds",
            args:         [],
        })
    }

    if (!isConnected) return (
        <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-4">
            <p className="text-gray-400">Connect your wallet to view your profile.</p>
            <ConnectButton />
        </div>
    )

    const seller        = data?.seller
    const activeItems   = data?.activeItems   || []
    const recentSales   = data?.itemBoughts   || []
    const proceeds      = seller?.proceeds    || "0"
    const hasProceeds   = proceeds !== "0" && proceeds !== ""

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                <p className="text-gray-400 text-sm mt-1 font-mono">{address}</p>
            </div>

            {error && !loading && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
                    {process.env.NEXT_PUBLIC_SUBGRAPH_URL
                        ? `Subgraph error: ${error}`
                        : "Subgraph URL not configured — stats require The Graph deployment"}
                </div>
            )}

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 animate-pulse h-20" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Stat label="Total Sales"    value={seller?.totalSales    || "0"} />
                    <Stat label="Total Volume"   value={`${formatPrice(seller?.totalVolume || "0")} ETH`} />
                    <Stat label="Active Listings" value={seller?.activeListings || "0"} />
                    <Stat label="Claimable ETH"  value={`${formatPrice(proceeds)} ETH`} />
                </div>
            )}

            {/* Withdraw proceeds */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <SectionHeading>Claimable Proceeds</SectionHeading>
                {loading ? (
                    <div className="animate-pulse bg-gray-800 h-10 rounded-lg w-1/3" />
                ) : hasProceeds ? (
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <p className="text-green-400 text-xl font-bold">
                            {formatPrice(proceeds)} ETH available
                        </p>
                        <button
                            onClick={handleWithdraw}
                            disabled={isWithdrawPending || isWithdrawConfirming}
                            className="btn-primary"
                        >
                            {isWithdrawPending || isWithdrawConfirming
                                ? "Withdrawing…"
                                : "Withdraw to Wallet"}
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No proceeds to withdraw.</p>
                )}

                {/* Withdraw status */}
                {isWithdrawPending && (
                    <p className="text-yellow-300 text-sm">Waiting for wallet confirmation…</p>
                )}
                {isWithdrawConfirming && (
                    <p className="text-blue-300 text-sm">Confirming on-chain…</p>
                )}
                {isWithdrawSuccess && withdrawHash && (
                    <p className="text-green-300 text-sm">
                        Withdrawn!{" "}
                        <a href={sepoliaEtherscanTx(withdrawHash)} target="_blank" rel="noopener noreferrer"
                           className="underline">View on Etherscan ↗</a>
                    </p>
                )}
                {withdrawError && (
                    <p className="text-red-400 text-sm">{parseContractError(withdrawError)}</p>
                )}
            </section>

            {/* Active listings */}
            <section>
                <SectionHeading>
                    Active Listings{" "}
                    {!loading && <span className="text-gray-500 font-normal text-sm">({activeItems.length})</span>}
                </SectionHeading>
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-gray-900 h-12 rounded-lg border border-gray-800" />
                        ))}
                    </div>
                ) : activeItems.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">
                        No active listings.{" "}
                        <Link href="/sellNFT" className="text-indigo-400 underline">List an NFT →</Link>
                    </p>
                ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden px-2">
                        {activeItems.map((item) => (
                            <ListingRow key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </section>

            {/* Sales history */}
            <section>
                <SectionHeading>
                    Recent Sales{" "}
                    {!loading && <span className="text-gray-500 font-normal text-sm">({recentSales.length})</span>}
                </SectionHeading>
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-gray-900 h-12 rounded-lg border border-gray-800" />
                        ))}
                    </div>
                ) : recentSales.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No sales yet.</p>
                ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden px-2">
                        {recentSales.map((item) => (
                            <SaleRow key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
