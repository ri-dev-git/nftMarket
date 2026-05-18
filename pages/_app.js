import "@rainbow-me/rainbowkit/styles.css"
import "@/styles/globals.css"

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit"
import { WagmiProvider }                         from "wagmi"
import { sepolia }                               from "wagmi/chains"
import { QueryClient, QueryClientProvider }      from "@tanstack/react-query"
import { useState }                              from "react"
import Head                                      from "next/head"
import Header                                    from "../components/header"

const wagmiConfig = getDefaultConfig({
    appName:   "NFT Marketplace — Babbage Lab",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder",
    chains:    [sepolia],
    ssr:       true,
})

export default function App({ Component, pageProps }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000 } },
    }))

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    <Head>
                        <title>NFT Marketplace — Babbage Lab</title>
                        <meta name="description" content="A non-custodial NFT marketplace on Sepolia" />
                        <link rel="icon" href="/favicon.ico" />
                    </Head>
                    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
                        <Header />
                        <main className="flex-1">
                            <Component {...pageProps} />
                        </main>
                    </div>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
