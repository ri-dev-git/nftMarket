import { useState, useEffect }    from "react"
import { useRouter }               from "next/router"
import {
    useAccount, useReadContract,
    useWriteContract, useWaitForTransactionReceipt,
} from "wagmi"
import { parseEther, isAddress }   from "viem"
import { ConnectButton }           from "@rainbow-me/rainbowkit"
import Link                        from "next/link"
import Image                       from "next/image"
import { useItemHistory }          from "../../../hooks/useNFTMarketplace"
import NftMarketplaceAbi           from "../../../constants/NftMarketplaceAbi.json"
import ERC721Abi                   from "../../../constants/ERC721Abi.json"
import { parseContractError }      from "../../../utils/errors"
import {
    formatPrice, ipfsToHttp,
    truncateAddress, sepoliaEtherscanTx, formatTimestamp,
} from "../../../utils/format"

const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS

// ── Tx status ────────────────────────────────────────────────────────────────
function TxFeedback({ hash, isPending, isConfirming, isSuccess, error }) {
    if (isPending)    return <p className="text-yellow-300 text-sm">Waiting for wallet…</p>
    if (isConfirming) return <p className="text-blue-300 text-sm">Confirming…</p>
    if (isSuccess)    return (
        <p className="text-green-300 text-sm">
            Done!{" "}
            <a href={sepoliaEtherscanTx(hash)} target="_blank" rel="noopener noreferrer"
               className="underline">Etherscan ↗</a>
        </p>
    )
    if (error)        return <p className="text-red-400 text-sm">{parseContractError(error)}</p>
    return null
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NFTDetail() {
    const router               = useRouter()
    const { address: nftAddr, tokenId } = router.query
    const { address, isConnected }      = useAccount()

    const [metadata,   setMetadata]   = useState(null)
    const [newPrice,   setNewPrice]   = useState("")

    // Subgraph history
    const { data: history, loading: historyLoading } = useItemHistory(nftAddr, tokenId)
    const activeListing = history?.activeItems?.[0]
    const sales         = history?.itemBoughts    || []
    const cancellations = history?.itemCancelleds || []

    // On-chain reads
    const validNft = nftAddr && isAddress(nftAddr)
    const validTid = tokenId !== undefined && !isNaN(Number(tokenId))

    const { data: tokenURI } = useReadContract({
        address:      validNft ? nftAddr : undefined,
        abi:          ERC721Abi,
        functionName: "tokenURI",
        args:         validTid ? [BigInt(tokenId)] : undefined,
        query:        { enabled: validNft && validTid },
    })

    const { data: onChainOwner } = useReadContract({
        address:      validNft ? nftAddr : undefined,
        abi:          ERC721Abi,
        functionName: "ownerOf",
        args:         validTid ? [BigInt(tokenId)] : undefined,
        query:        { enabled: validNft && validTid },
    })

    // Fetch metadata from IPFS
    useEffect(() => {
        if (!tokenURI) return
        fetch(ipfsToHttp(tokenURI))
            .then((r) => r.json())
            .then(setMetadata)
            .catch(() => {})
    }, [tokenURI])

    const isSeller = activeListing?.seller?.toLowerCase() === address?.toLowerCase()
    const isOwner  = onChainOwner?.toLowerCase() === address?.toLowerCase()

    // ── Write hooks ────────────────────────────────────────────────────────
    const { writeContract: buy,    data: buyHash,    isPending: isBuyPending,    error: buyError,    reset: resetBuy }    = useWriteContract()
    const { writeContract: cancel, data: cancelHash, isPending: isCancelPending, error: cancelError, reset: resetCancel } = useWriteContract()
    const { writeContract: update, data: updateHash, isPending: isUpdatePending, error: updateError, reset: resetUpdate } = useWriteContract()

    const { isLoading: isBuyConf,    isSuccess: isBuyDone }    = useWaitForTransactionReceipt({ hash: buyHash    })
    const { isLoading: isCancelConf, isSuccess: isCancelDone } = useWaitForTransactionReceipt({ hash: cancelHash })
    const { isLoading: isUpdateConf, isSuccess: isUpdateDone } = useWaitForTransactionReceipt({ hash: updateHash })

    if (!router.isReady) return (
        <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
            <div className="animate-pulse text-gray-500">Loading…</div>
        </div>
    )

    const image = ipfsToHttp(metadata?.image)

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/" className="text-indigo-400 text-sm hover:underline">← Back to marketplace</Link>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* ── Image panel ─────────────────────────────────────────── */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
                    {image ? (
                        <Image src={image} alt={metadata?.name || "NFT"} fill
                            className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600 animate-pulse">
                            Loading image…
                        </div>
                    )}
                </div>

                {/* ── Info panel ──────────────────────────────────────────── */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            {metadata?.name || (tokenId !== undefined ? `Token #${tokenId}` : "…")}
                        </h1>
                        {metadata?.description && (
                            <p className="text-gray-400 text-sm mt-2">{metadata.description}</p>
                        )}
                    </div>

                    <div className="text-sm space-y-1 text-gray-400">
                        <p><span className="text-gray-600">Contract</span>{" "}
                            <a href={`https://sepolia.etherscan.io/address/${nftAddr}`}
                               target="_blank" rel="noopener noreferrer"
                               className="text-indigo-400 font-mono hover:underline">
                                {truncateAddress(nftAddr, 8, 6)}
                            </a>
                        </p>
                        <p><span className="text-gray-600">Token ID</span>{" "}
                            <span className="text-gray-300">#{tokenId}</span>
                        </p>
                        {onChainOwner && (
                            <p><span className="text-gray-600">Owner</span>{" "}
                                <span className="text-gray-300 font-mono">{truncateAddress(onChainOwner)}</span>
                                {isOwner && <span className="ml-2 text-xs text-green-400">(you)</span>}
                            </p>
                        )}
                    </div>

                    {/* Current listing */}
                    {historyLoading ? (
                        <div className="animate-pulse bg-gray-900 border border-gray-800 rounded-xl h-24" />
                    ) : activeListing ? (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Current Price</p>
                                <p className="text-3xl font-bold text-indigo-400 mt-1">
                                    {formatPrice(activeListing.price)} ETH
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Listed by {truncateAddress(activeListing.seller)}
                                    {isSeller && <span className="ml-1 text-green-400">(you)</span>}
                                </p>
                            </div>

                            {/* Buy */}
                            {isConnected && !isSeller && (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => { resetBuy(); buy({
                                            address:      MARKETPLACE,
                                            abi:          NftMarketplaceAbi,
                                            functionName: "buyItem",
                                            args:         [nftAddr, BigInt(tokenId)],
                                            value:        BigInt(activeListing.price),
                                        }) }}
                                        disabled={isBuyPending || isBuyConf}
                                        className="btn-primary w-full"
                                    >
                                        {isBuyPending || isBuyConf ? "Processing…" : `Buy for ${formatPrice(activeListing.price)} ETH`}
                                    </button>
                                    <TxFeedback hash={buyHash} isPending={isBuyPending}
                                        isConfirming={isBuyConf} isSuccess={isBuyDone} error={buyError} />
                                </div>
                            )}

                            {/* Seller actions */}
                            {isConnected && isSeller && (
                                <div className="space-y-3">
                                    {/* Update price */}
                                    <div className="flex gap-2">
                                        <input type="number" min="0" step="0.0001"
                                            placeholder="New price (ETH)"
                                            value={newPrice}
                                            onChange={e => setNewPrice(e.target.value)}
                                            className="input-field flex-1 text-sm" />
                                        <button
                                            onClick={() => { resetUpdate(); update({
                                                address:      MARKETPLACE,
                                                abi:          NftMarketplaceAbi,
                                                functionName: "updateListing",
                                                args:         [nftAddr, BigInt(tokenId), parseEther(newPrice || "0")],
                                            }) }}
                                            disabled={!newPrice || isUpdatePending || isUpdateConf}
                                            className="btn-secondary text-sm px-3"
                                        >
                                            {isUpdatePending || isUpdateConf ? "…" : "Update"}
                                        </button>
                                    </div>
                                    <TxFeedback hash={updateHash} isPending={isUpdatePending}
                                        isConfirming={isUpdateConf} isSuccess={isUpdateDone} error={updateError} />

                                    {/* Cancel */}
                                    <button
                                        onClick={() => { resetCancel(); cancel({
                                            address:      MARKETPLACE,
                                            abi:          NftMarketplaceAbi,
                                            functionName: "cancelListing",
                                            args:         [nftAddr, BigInt(tokenId)],
                                        }) }}
                                        disabled={isCancelPending || isCancelConf}
                                        className="w-full border border-red-700 text-red-400 hover:bg-red-900/20 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                                    >
                                        {isCancelPending || isCancelConf ? "Cancelling…" : "Cancel Listing"}
                                    </button>
                                    <TxFeedback hash={cancelHash} isPending={isCancelPending}
                                        isConfirming={isCancelConf} isSuccess={isCancelDone} error={cancelError} />
                                </div>
                            )}

                            {!isConnected && (
                                <div className="flex flex-col items-start gap-2">
                                    <p className="text-gray-400 text-sm">Connect wallet to buy</p>
                                    <ConnectButton />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">This NFT is not currently listed for sale.</p>
                            {isOwner && (
                                <Link href="/sellNFT" className="text-indigo-400 text-sm underline mt-2 inline-block">
                                    List it now →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Price history ────────────────────────────────────────────── */}
            <section className="mt-12">
                <h2 className="text-lg font-semibold text-white mb-4">Price History</h2>
                {historyLoading ? (
                    <div className="animate-pulse space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-900 h-10 rounded-lg border border-gray-800" />
                        ))}
                    </div>
                ) : sales.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No sales on record for this token.</p>
                ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-4 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                            <span>Event</span>
                            <span>Price</span>
                            <span>From</span>
                            <span>Date</span>
                        </div>
                        {sales.map((sale) => (
                            <div key={sale.id}
                                className="grid grid-cols-4 px-4 py-3 border-b border-gray-800 text-sm hover:bg-gray-800/30 transition-colors">
                                <span className="text-green-400 font-medium">Sale</span>
                                <span className="text-white font-semibold">{formatPrice(sale.price)} ETH</span>
                                <span className="text-gray-400 font-mono">{truncateAddress(sale.seller)}</span>
                                <span className="text-gray-500">{formatTimestamp(sale.boughtAt)}</span>
                            </div>
                        ))}
                        {cancellations.map((c) => (
                            <div key={c.id}
                                className="grid grid-cols-4 px-4 py-3 border-b border-gray-800 text-sm hover:bg-gray-800/30 transition-colors">
                                <span className="text-red-400 font-medium">Cancelled</span>
                                <span className="text-gray-500">—</span>
                                <span className="text-gray-400 font-mono">{truncateAddress(c.seller)}</span>
                                <span className="text-gray-500">{formatTimestamp(c.cancelledAt)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
