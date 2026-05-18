/** @type {import('next').NextConfig} */
const nextConfig = {
    
    reactStrictMode: true,
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: false },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "gateway.pinata.cloud" },
            { protocol: "https", hostname: "**.mypinata.cloud" },
            { protocol: "https", hostname: "ipfs.io" },
            { protocol: "https", hostname: "**.ipfs.dweb.link" },
            { protocol: "https", hostname: "**.ipfs.cf-ipfs.com" },
            { protocol: "https", hostname: "**.nftcdn.io" },
        ],
    },
}

module.exports = nextConfig
