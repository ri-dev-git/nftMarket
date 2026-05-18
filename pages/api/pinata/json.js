import axios from "axios"

function normaliseGateway(raw) {
  if (!raw) return "https://gateway.pinata.cloud"
  const g = raw.trim()
  return g.startsWith("http") ? g : `https://${g}`
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    )

    const gateway = normaliseGateway(process.env.PINATA_GATEWAY)
    res.status(200).json({ pinataURL: `${gateway}/ipfs/${response.data.IpfsHash}` })
  } catch (err) {
    const msg = err.response?.data?.error?.reason || err.message
    res.status(500).json({ error: msg })
  }
}
