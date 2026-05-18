import axios from "axios"

export async function uploadJSONToIPFS(jsonBody) {
  const res = await axios.post("/api/pinata/json", jsonBody)
  return { success: true, pinataURL: res.data.pinataURL }
}

export async function uploadFileToIPFS(file) {
  const data = new FormData()
  data.append("file", file)
  data.append("pinataMetadata", JSON.stringify({ name: file.name || "nft-image" }))
  const res = await axios.post("/api/pinata/file", data)
  return { success: true, pinataURL: res.data.pinataURL }
}
