import axios from "axios"

const key    = process.env.NEXT_PUBLIC_PINATA_API_KEY
const secret = process.env.NEXT_PUBLIC_PINATA_SECRET

// Ensure gateway always has a protocol, regardless of how the env var was set
function normaliseGateway(raw) {
    if (!raw) return "https://gateway.pinata.cloud"
    const g = raw.trim()
    return g.startsWith("http") ? g : `https://${g}`
}
const GATEWAY = normaliseGateway(process.env.NEXT_PUBLIC_PINATA_GATEWAY)

export async function uploadJSONToIPFS(jsonBody) {
    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
    const res = await axios.post(url, jsonBody, {
        headers: {
            pinata_api_key:        key,
            pinata_secret_api_key: secret,
        },
    })
    return {
        success:    true,
        pinataURL: `${GATEWAY}/ipfs/${res.data.IpfsHash}`,
    }
}

export async function uploadFileToIPFS(file) {
    const url  = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    const data = new FormData()
    data.append("file", file)
    data.append(
        "pinataMetadata",
        JSON.stringify({ name: file.name || "nft-image" })
    )

    const res = await axios.post(url, data, {
        maxBodyLength: Infinity,
        headers: {
            "Content-Type":        `multipart/form-data`,
            pinata_api_key:        key,
            pinata_secret_api_key: secret,
        },
    })
    return {
        success:   true,
        pinataURL: `${GATEWAY}/ipfs/${res.data.IpfsHash}`,
    }
}
