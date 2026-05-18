import { formatEther } from "viem"

export function truncateAddress(address, start = 6, end = 4) {
    if (!address) return ""
    return `${address.slice(0, start)}…${address.slice(-end)}`
}

export function formatPrice(priceWei) {
    if (!priceWei) return "0"
    try {
        const eth = parseFloat(formatEther(BigInt(priceWei)))
        return eth < 0.0001 ? eth.toExponential(2) : eth.toFixed(4).replace(/\.?0+$/, "")
    } catch {
        return "0"
    }
}

export function sepoliaEtherscanTx(hash) {
    return `https://sepolia.etherscan.io/tx/${hash}`
}

export function sepoliaEtherscanAddress(address) {
    return `https://sepolia.etherscan.io/address/${address}`
}

// Public IPFS gateway used for all display fetches.
// Pinata dedicated gateways (*.mypinata.cloud) require auth tokens — we extract
// the CID and re-route through a public gateway so no token is needed.
const PUBLIC_GATEWAY = "https://ipfs.io/ipfs"

export function ipfsToHttp(uri) {
    if (!uri) return ""

    // ipfs:// protocol
    if (uri.startsWith("ipfs://")) {
        return `${PUBLIC_GATEWAY}/${uri.slice(7)}`
    }

    // Any Pinata gateway URL (dedicated or public) — extract CID and re-route
    // Matches: *.mypinata.cloud/ipfs/CID  and  gateway.pinata.cloud/ipfs/CID
    const pinataMatch = uri.match(/(?:mypinata\.cloud|pinata\.cloud)\/ipfs\/(.+)/)
    if (pinataMatch) {
        return `${PUBLIC_GATEWAY}/${pinataMatch[1]}`
    }

    // Bare IPFS hash (CIDv0 Qm... or CIDv1 bafy...)
    if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{50,})/.test(uri)) {
        return `${PUBLIC_GATEWAY}/${uri}`
    }

    // Protocol-less URL stored without https:// (env var misconfiguration)
    if (
        !uri.startsWith("http://") &&
        !uri.startsWith("https://") &&
        !uri.startsWith("/") &&
        !uri.startsWith("data:")
    ) {
        return `https://${uri}`
    }

    return uri
}

export function formatTimestamp(ts) {
    if (!ts) return ""
    return new Date(Number(ts) * 1000).toLocaleDateString("en-US", {
        month: "short",
        day:   "numeric",
        year:  "numeric",
    })
}
