import axios from "axios"

export const config = {
  api: { bodyParser: false },
}

function normaliseGateway(raw) {
  if (!raw) return "https://gateway.pinata.cloud"
  const g = raw.trim()
  return g.startsWith("http") ? g : `https://${g}`
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      body,
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type":  req.headers["content-type"],
          Authorization:   `Bearer ${process.env.PINATA_JWT}`,
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
