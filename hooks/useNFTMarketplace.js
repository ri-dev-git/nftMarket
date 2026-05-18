import { useState, useEffect, useCallback } from "react"
import { request, gql } from "graphql-request"

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL

// ─────────────────────────────────────────────────────────────────────────────
//  useActiveListings
//  Returns all NFTs currently listed for sale, newest first.
//  Used by the marketplace home page grid.
// ─────────────────────────────────────────────────────────────────────────────
export function useActiveListings() {
    const [listings, setListings]   = useState([])
    const [loading,  setLoading]    = useState(true)
    const [error,    setError]      = useState(null)

    const fetch = useCallback(async () => {
        if (!SUBGRAPH_URL) {
            setListings([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const query = gql`
                {
                    activeItems(
                        first: 50
                        orderBy: listedAt
                        orderDirection: desc
                        where: { price_gt: "0" }
                    ) {
                        id
                        seller
                        nftAddress
                        tokenId
                        price
                        listedAt
                        updatedAt
                    }
                }
            `
            const data = await request(SUBGRAPH_URL, query)
            setListings(data.activeItems || [])
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetch() }, [fetch])

    return { listings, loading, error, refetch: fetch }
}

// ─────────────────────────────────────────────────────────────────────────────
//  useSellerListings
//  Returns a seller's aggregate stats, active listings, and recent sales.
//  Used by the /profile page.
// ─────────────────────────────────────────────────────────────────────────────
export function useSellerListings(address) {
    const [data,    setData]    = useState(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)

    const fetch = useCallback(async () => {
        if (!address || !SUBGRAPH_URL) {
            setData(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const lower = address.toLowerCase()
            const query = gql`
                query GetSeller($seller: String!) {
                    seller(id: $seller) {
                        totalSales
                        totalVolume
                        activeListings
                        proceeds
                    }
                    activeItems(
                        where: { seller: $seller }
                        orderBy: listedAt
                        orderDirection: desc
                    ) {
                        id
                        nftAddress
                        tokenId
                        price
                        listedAt
                        updatedAt
                    }
                    itemBoughts(
                        where: { seller: $seller }
                        orderBy: boughtAt
                        orderDirection: desc
                        first: 20
                    ) {
                        id
                        buyer
                        nftAddress
                        tokenId
                        price
                        boughtAt
                    }
                }
            `
            const result = await request(SUBGRAPH_URL, query, { seller: lower })
            setData(result)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [address])

    useEffect(() => { fetch() }, [fetch])

    return { data, loading, error, refetch: fetch }
}

// ─────────────────────────────────────────────────────────────────────────────
//  useItemHistory
//  Returns the complete on-chain history for a single NFT:
//  current listing, all past sales, all cancellations.
//  Used by the /nft/[address]/[tokenId] detail page.
// ─────────────────────────────────────────────────────────────────────────────
export function useItemHistory(nftAddress, tokenId) {
    const [data,    setData]    = useState(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)

    const fetch = useCallback(async () => {
        if (!nftAddress || tokenId === undefined || !SUBGRAPH_URL) {
            setData(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const nftLower = nftAddress.toLowerCase()
            const query = gql`
                query GetItemHistory($nftAddress: String!, $tokenId: BigInt!) {
                    activeItems(
                        where: { nftAddress: $nftAddress, tokenId: $tokenId }
                    ) {
                        seller
                        price
                        listedAt
                        updatedAt
                    }
                    itemBoughts(
                        where: { nftAddress: $nftAddress, tokenId: $tokenId }
                        orderBy: boughtAt
                        orderDirection: desc
                    ) {
                        id
                        buyer
                        seller
                        price
                        boughtAt
                    }
                    itemCancelleds(
                        where: { nftAddress: $nftAddress, tokenId: $tokenId }
                        orderBy: cancelledAt
                        orderDirection: desc
                    ) {
                        id
                        seller
                        cancelledAt
                    }
                }
            `
            const result = await request(SUBGRAPH_URL, query, {
                nftAddress: nftLower,
                tokenId:    String(tokenId),
            })
            setData(result)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [nftAddress, tokenId])

    useEffect(() => { fetch() }, [fetch])

    return { data, loading, error, refetch: fetch }
}
