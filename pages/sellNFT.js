import { useState, useEffect }             from "react"
import {
    useAccount,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi"
import { parseEther, isAddress, decodeEventLog } from "viem"
import { ConnectButton }                    from "@rainbow-me/rainbowkit"
import Link                                 from "next/link"
import NftMarketplaceAbi                    from "../constants/NftMarketplaceAbi.json"
import MintableNftAbi                       from "../constants/MintableNftAbi.json"
import ERC721Abi                            from "../constants/ERC721Abi.json"
import { uploadFileToIPFS, uploadJSONToIPFS } from "../constants/pinata"
import { parseContractError }              from "../utils/errors"
import { sepoliaEtherscanTx, truncateAddress } from "../utils/format"

const MARKETPLACE     = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
const MINTABLE_NFT    = "0xfE664c54eC2f550b8C39A4b5EA8cbA657F9C78Ac"

// ── Reusable status badge ─────────────────────────────────────────────────────
function TxStatus({ hash, isPending, isConfirming, isSuccess, error }) {
    if (isPending)    return <Badge color="yellow">Waiting for wallet confirmation…</Badge>
    if (isConfirming) return <Badge color="blue">Transaction submitted — confirming…</Badge>
    if (isSuccess)    return (
        <Badge color="green">
            Success!{" "}
            <a href={sepoliaEtherscanTx(hash)} target="_blank" rel="noopener noreferrer"
               className="underline">View on Etherscan ↗</a>
        </Badge>
    )
    if (error) return <Badge color="red">{parseContractError(error)}</Badge>
    return null
}

function Badge({ color, children }) {
    const colours = {
        yellow: "bg-yellow-900/40 border-yellow-700 text-yellow-300",
        blue:   "bg-blue-900/40   border-blue-700   text-blue-300",
        green:  "bg-green-900/40  border-green-700  text-green-300",
        red:    "bg-red-900/40    border-red-700     text-red-300",
    }
    return (
        <div className={`border rounded-lg px-4 py-2.5 text-sm ${colours[color]}`}>
            {children}
        </div>
    )
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Step({ n, label, active, done }) {
    return (
        <div className={`flex items-center gap-2 text-sm ${done ? "text-green-400" : active ? "text-white" : "text-gray-500"}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${
                done  ? "border-green-500 bg-green-900/40" :
                active ? "border-indigo-500 bg-indigo-900/40" :
                         "border-gray-700"
            }`}>
                {done ? "✓" : n}
            </span>
            {label}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SellNFT() {
    const { isConnected } = useAccount()

    // ── IPFS state ───────────────────────────────────────────────────────────
    const [imgFile,     setImgFile]     = useState(null)
    const [nftName,     setNftName]     = useState("")
    const [nftDesc,     setNftDesc]     = useState("")
    const [ipfsUrl,     setIpfsUrl]     = useState("")    // metadata JSON URL
    const [ipfsLoading, setIpfsLoading] = useState(false)

    // ── Minted token state ───────────────────────────────────────────────────
    const [mintedId,  setMintedId]  = useState(null)   // tokenId after mint
    const [nftAddress, setNftAddress] = useState(MINTABLE_NFT)
    const [tokenId,    setTokenId]    = useState("")
    const [price,      setPrice]      = useState("")
    const [useCustomNft, setUseCustomNft] = useState(false)  // toggle to list existing NFT

    // ── Mint ─────────────────────────────────────────────────────────────────
    const {
        writeContract: mint, data: mintHash,
        isPending: isMintPending, error: mintError, reset: resetMint,
    } = useWriteContract()

    const { isLoading: isMintConfirming, isSuccess: isMintSuccess, data: mintReceipt } =
        useWaitForTransactionReceipt({ hash: mintHash })

    // Parse tokenId from NftMinted event after mint confirms
    useEffect(() => {
        if (!isMintSuccess || !mintReceipt) return
        for (const log of mintReceipt.logs) {
            try {
                const decoded = decodeEventLog({ abi: MintableNftAbi, data: log.data, topics: log.topics })
                if (decoded.eventName === "NftMinted") {
                    const id = decoded.args.tokenId.toString()
                    setMintedId(id)
                    setTokenId(id)
                    setNftAddress(MINTABLE_NFT)
                    break
                }
            } catch { /* not this log */ }
        }
    }, [isMintSuccess, mintReceipt])

    // ── Approve ───────────────────────────────────────────────────────────────
    const {
        writeContract: approve, data: approveHash,
        isPending: isApprovePending, error: approveError, reset: resetApprove,
    } = useWriteContract()

    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
        useWaitForTransactionReceipt({ hash: approveHash })

    const validNft = isAddress(nftAddress || "")
    const validTid = tokenId !== "" && !isNaN(Number(tokenId))

    const { data: currentApproved } = useReadContract({
        address:      validNft ? nftAddress : undefined,
        abi:          ERC721Abi,
        functionName: "getApproved",
        args:         validTid ? [BigInt(tokenId)] : undefined,
        query:        { enabled: validNft && validTid },
    })
    const isApproved = currentApproved?.toLowerCase() === MARKETPLACE?.toLowerCase()

    // ── List ─────────────────────────────────────────────────────────────────
    const {
        writeContract: listItem, data: listHash,
        isPending: isListPending, error: listError, reset: resetList,
    } = useWriteContract()

    const { isLoading: isListConfirming, isSuccess: isListSuccess } =
        useWaitForTransactionReceipt({ hash: listHash })

    // ── Step tracker ─────────────────────────────────────────────────────────
    const step1Done = !!ipfsUrl
    const step2Done = !!mintedId || (useCustomNft && validNft && validTid)
    const step3Done = isApproved || isApproveSuccess
    const step4Done = isListSuccess

    // ── Handlers ─────────────────────────────────────────────────────────────
    async function handleIpfsUpload(e) {
        e.preventDefault()
        if (!imgFile || !nftName) return
        setIpfsLoading(true)
        try {
            const { pinataURL: imageUrl } = await uploadFileToIPFS(imgFile)
            const { pinataURL }           = await uploadJSONToIPFS({
                name: nftName, description: nftDesc, image: imageUrl,
            })
            setIpfsUrl(pinataURL)
        } catch (err) {
            alert("IPFS upload failed: " + err.message)
        } finally {
            setIpfsLoading(false)
        }
    }

    function handleMint() {
        resetMint()
        mint({
            address:      MINTABLE_NFT,
            abi:          MintableNftAbi,
            functionName: "mintNft",
            args:         [ipfsUrl],
        })
    }

    function handleApprove() {
        resetApprove()
        approve({
            address:      nftAddress,
            abi:          MintableNftAbi,
            functionName: "approve",
            args:         [MARKETPLACE, BigInt(tokenId)],
        })
    }

    function handleList() {
        resetList()
        listItem({
            address:      MARKETPLACE,
            abi:          NftMarketplaceAbi,
            functionName: "listItem",
            args:         [nftAddress, BigInt(tokenId), parseEther(price)],
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    if (!isConnected) return (
        <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-4">
            <p className="text-gray-400">Connect your wallet to mint and list NFTs.</p>
            <ConnectButton />
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-2">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">Sell an NFT</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Upload your image, mint on-chain, then list for sale in three steps.
                </p>
            </div>

            {/* Progress */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 mb-2">
                <Step n="1" label="Upload to IPFS"      active={!step1Done}                  done={step1Done} />
                <Step n="2" label="Mint NFT"            active={step1Done && !step2Done}      done={step2Done} />
                <Step n="3" label="Approve marketplace" active={step2Done && !step3Done}      done={step3Done} />
                <Step n="4" label="List for sale"       active={step3Done && !step4Done}      done={step4Done} />
            </div>

            {/* ── Step 1: IPFS Upload ──────────────────────────────────────── */}
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white text-lg">Step 1 — Upload image to IPFS</h2>
                    {step1Done && <span className="text-green-400 text-sm">✓ Done</span>}
                </div>

                {step1Done ? (
                    <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Metadata pinned:</p>
                        <a href={ipfsUrl} target="_blank" rel="noopener noreferrer"
                           className="text-indigo-400 text-xs break-all hover:underline">{ipfsUrl}</a>
                        <button onClick={() => { setIpfsUrl(""); setMintedId(null); setTokenId(""); resetMint() }}
                            className="text-gray-500 text-xs hover:text-white">
                            ↩ Upload different image
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <input placeholder="NFT Name *" value={nftName}
                            onChange={e => setNftName(e.target.value)} className="input-field" />
                        <textarea placeholder="Description (optional)" value={nftDesc}
                            onChange={e => setNftDesc(e.target.value)}
                            className="input-field resize-none h-20" />
                        <div>
                            <label className="label-field">Image file *</label>
                            <input type="file" accept="image/*"
                                onChange={e => setImgFile(e.target.files[0])}
                                className="text-sm text-gray-400 file:mr-3 file:bg-gray-700 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:cursor-pointer" />
                        </div>
                        <button onClick={handleIpfsUpload}
                            disabled={ipfsLoading || !imgFile || !nftName}
                            className="btn-primary w-full">
                            {ipfsLoading ? "Uploading to IPFS…" : "Upload to IPFS"}
                        </button>
                    </div>
                )}
            </section>

            {/* ── Step 2: Mint ─────────────────────────────────────────────── */}
            <section className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 ${!step1Done ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white text-lg">Step 2 — Mint on-chain</h2>
                    {step2Done && <span className="text-green-400 text-sm">✓ Done</span>}
                </div>

                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => setUseCustomNft(false)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!useCustomNft ? "border-indigo-500 text-white bg-indigo-900/30" : "border-gray-700 text-gray-400"}`}>
                        Mint new NFT
                    </button>
                    <button
                        onClick={() => setUseCustomNft(true)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${useCustomNft ? "border-indigo-500 text-white bg-indigo-900/30" : "border-gray-700 text-gray-400"}`}>
                        Use existing NFT
                    </button>
                </div>

                {!useCustomNft ? (
                    <div className="space-y-3">
                        <div className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">
                            Contract: <span className="font-mono text-gray-300">{truncateAddress(MINTABLE_NFT, 8, 6)}</span>
                            {" · "}
                            <a href={`https://sepolia.etherscan.io/address/${MINTABLE_NFT}#code`}
                               target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                Babbage Lab NFT (BLAB) ↗
                            </a>
                        </div>

                        {mintedId !== null ? (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                ✓ Minted — Token ID <strong>{mintedId}</strong>
                            </div>
                        ) : (
                            <button onClick={handleMint}
                                disabled={!step1Done || isMintPending || isMintConfirming}
                                className="btn-primary w-full">
                                {isMintPending    ? "Confirm in wallet…" :
                                 isMintConfirming ? "Minting on-chain…"  :
                                                    "Mint NFT"}
                            </button>
                        )}

                        <TxStatus hash={mintHash} isPending={isMintPending}
                            isConfirming={isMintConfirming} isSuccess={isMintSuccess} error={mintError} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="label-field">NFT Contract Address</label>
                            <input placeholder="0x…" value={nftAddress}
                                onChange={e => { setNftAddress(e.target.value); resetApprove(); resetList() }}
                                className="input-field font-mono" />
                        </div>
                        <div>
                            <label className="label-field">Token ID</label>
                            <input type="number" min="0" placeholder="0" value={tokenId}
                                onChange={e => { setTokenId(e.target.value); resetApprove(); resetList() }}
                                className="input-field" />
                        </div>
                    </div>
                )}
            </section>

            {/* ── Step 3: Approve ───────────────────────────────────────────── */}
            <section className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 ${!step2Done ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white text-lg">Step 3 — Approve marketplace</h2>
                    {step3Done && <span className="text-green-400 text-sm">✓ Done</span>}
                </div>
                <p className="text-gray-400 text-xs">
                    Allows the marketplace contract to transfer your NFT when it sells.
                    This is a one-time transaction per token.
                </p>

                {step3Done ? (
                    <div className="text-green-400 text-sm">✓ Marketplace approved for token #{tokenId}</div>
                ) : (
                    <button onClick={handleApprove}
                        disabled={!step2Done || !validNft || !validTid || isApprovePending || isApproveConfirming}
                        className="btn-primary w-full">
                        {isApprovePending || isApproveConfirming ? "Approving…" : "Approve Marketplace"}
                    </button>
                )}
                <TxStatus hash={approveHash} isPending={isApprovePending}
                    isConfirming={isApproveConfirming} isSuccess={isApproveSuccess} error={approveError} />
            </section>

            {/* ── Step 4: List ─────────────────────────────────────────────── */}
            <section className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 ${!step3Done ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white text-lg">Step 4 — Set price and list</h2>
                    {step4Done && <span className="text-green-400 text-sm">✓ Listed!</span>}
                </div>

                <div>
                    <label className="label-field">Price (ETH)</label>
                    <input type="number" min="0" step="0.0001" placeholder="e.g. 0.05"
                        value={price} onChange={e => setPrice(e.target.value)}
                        className="input-field" />
                </div>

                {isListSuccess ? (
                    <div className="space-y-3">
                        <Badge color="green">
                            🎉 NFT listed successfully!{" "}
                            {listHash && (
                                <a href={sepoliaEtherscanTx(listHash)} target="_blank"
                                   rel="noopener noreferrer" className="underline">View tx ↗</a>
                            )}
                        </Badge>
                        <Link href="/" className="btn-secondary w-full text-center block">
                            View on Marketplace →
                        </Link>
                    </div>
                ) : (
                    <button onClick={handleList}
                        disabled={!step3Done || !price || isNaN(parseFloat(price)) || isListPending || isListConfirming}
                        className="btn-primary w-full">
                        {isListPending || isListConfirming ? "Listing…" : "List for Sale"}
                    </button>
                )}
                <TxStatus hash={listHash} isPending={isListPending}
                    isConfirming={isListConfirming} isSuccess={isListSuccess} error={listError} />
            </section>
        </div>
    )
}
