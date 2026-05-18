import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useChainId } from "wagmi"
import Link from "next/link"
import { useRouter } from "next/router"
import { truncateAddress } from "../utils/format"

const SEPOLIA_ID = 11155111

const NAV_LINKS = [
    { href: "/",        label: "Marketplace" },
    { href: "/sellNFT", label: "Sell NFT"    },
    { href: "/profile", label: "My Profile"  },
]

export default function Header() {
    const { address, isConnected } = useAccount()
    const chainId                  = useChainId()
    const router                   = useRouter()
    const onWrongNetwork           = isConnected && chainId !== SEPOLIA_ID

    return (
        <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
            {onWrongNetwork && (
                <div className="bg-amber-500 text-black text-sm font-semibold text-center py-2 px-4">
                    ⚠ Wrong network — please switch to Sepolia testnet
                </div>
            )}

            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">

                {/* Logo */}
                <Link href="/" className="text-white font-bold text-xl tracking-tight shrink-0">
                    NFT Marketplace
                </Link>

                {/* Nav links */}
                <div className="hidden sm:flex items-center gap-1">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                router.pathname === href
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Wallet */}
                <div className="flex items-center gap-3">
                    {isConnected && address && (
                        <span className="hidden md:block text-xs text-gray-400 font-mono">
                            {truncateAddress(address)}
                        </span>
                    )}
                    <ConnectButton
                        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                        showBalance={{ smallScreen: false, largeScreen: true }}
                        chainStatus="icon"
                    />
                </div>
            </nav>

            {/* Mobile nav */}
            <div className="sm:hidden flex border-t border-gray-800 px-4 py-2 gap-2">
                {NAV_LINKS.map(({ href, label }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex-1 text-center px-2 py-1.5 rounded text-xs font-medium ${
                            router.pathname === href
                                ? "bg-gray-800 text-white"
                                : "text-gray-400"
                        }`}
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </header>
    )
}
