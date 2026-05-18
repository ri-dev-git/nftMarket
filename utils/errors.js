const ERROR_MAP = {
    NftMarketplace__NotListed:                  "This NFT is not currently for sale",
    NftMarketplace__PriceNotMet:                "Your offer is below the asking price",
    NftMarketplace__NotSeller:                  "You don't own this listing",
    NftMarketplace__AlreadyListed:              "This NFT is already listed for sale",
    NftMarketplace__NotOwner:                   "You don't own this NFT",
    NftMarketplace__CannotBuyOwnListing:        "You can't buy your own listing",
    NftMarketplace__NoProceeds:                 "You have no proceeds to withdraw",
    NftMarketplace__PriceMustBeAboveZero:       "Price must be greater than 0",
    NftMarketplace__NotApprovedForMarketplace:  "Please approve the marketplace first",
    NftMarketplace__ZeroAddress:               "Invalid NFT contract address",
}

export function parseContractError(error) {
    if (!error) return null

    const msg = error?.shortMessage || error?.message || String(error)

    for (const [key, human] of Object.entries(ERROR_MAP)) {
        if (msg.includes(key)) return human
    }

    if (/user rejected|rejected the request/i.test(msg)) return "Transaction cancelled"
    if (/insufficient funds/i.test(msg)) return "Insufficient funds in your wallet"
    if (/nonce/i.test(msg)) return "Transaction nonce error — try again"

    return "Transaction failed — please try again"
}
