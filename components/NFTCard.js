import { useState, useEffect } from "react"
import { useReadContract }     from "wagmi"
import Link                    from "next/link"
import Image                   from "next/image"
import ERC721Abi               from "../constants/ERC721Abi.json"
import { formatPrice, ipfsToHttp, truncateAddress } from "../utils/format"

// ── Loading skeleton ────────────────────────────────────────────────────────
export function NFTCardSkeleton() {
    return (
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 animate-pulse">
            <div className="bg-gray-800 h-56 w-full" />
            <div className="p-4 space-y-3">
                <div className="bg-gray-800 h-4 rounded w-3/4" />
                <div className="bg-gray-800 h-3 rounded w-1/2" />
                <div className="bg-gray-800 h-8 rounded w-full mt-2" />
            </div>
        </div>
    )
}

// ── NFT Card ─────────────────────────────────────────────────────────────────
export default function NFTCard({ nftAddress, tokenId, price, seller }) {
    const [metadata, setMetadata] = useState(null)

    const { data: tokenURI } = useReadContract({
        address:      nftAddress,
        abi:          ERC721Abi,
        functionName: "tokenURI",
        args:         [BigInt(tokenId)],
    })

    useEffect(() => {
        if (!tokenURI) return
        const url = ipfsToHttp(tokenURI)
        fetch(url)
            .then((r) => r.json())
            .then(setMetadata)
            .catch(() => {})
    }, [tokenURI])

    if (!metadata) return <NFTCardSkeleton />

    const image = ipfsToHttp(metadata.image)

    return (
        <Link
            href={`/nft/${nftAddress}/${tokenId}`}
            className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-900/20 group"
        >
            <div className="relative h-56 w-full bg-gray-800 overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={metadata.name || "NFT"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                        No image
                    </div>
                )}
            </div>

            <div className="p-4">
                <p className="text-white font-semibold truncate">
                    {metadata.name || `Token #${tokenId}`}
                </p>
                <p className="text-gray-400 text-xs mt-1 truncate">
                    {truncateAddress(seller)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-indigo-400 font-bold">
                        {formatPrice(price)} ETH
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                        #{tokenId}
                    </span>
                </div>
            </div>
        </Link>
    )
}
