import '@/styles/globals.css'
import Head from 'next/head'
import Header from '../components/header.js'
import '@rainbow-me/rainbowkit/styles.css';
import {useEffect, Suspense  ,useState} from 'react';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig,useAccount, useConnect } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum,goerli } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';


export default function App({ Component, pageProps }) {

  const { chains, provider } = configureChains(
    [mainnet, polygon, optimism, arbitrum,goerli],
    [
      alchemyProvider({ apiKey: process.env.ALCHEMY_ID }),
      publicProvider()
    ]
  );
  const { connectors } = getDefaultWallets({
    appName: 'My RainbowKit App',
    chains
  });
  
  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider
  })
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
      setHydrated(true)
    
      return () => {
        
      }
    }, [])
  return (
   hydrated?
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Head>
          <title>NFT Marketplace</title>
        </Head>
        <Header/>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>:"Bleh"
  )
}

