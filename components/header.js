import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import Link from 'next/link'
export default  function Header({context}) {
    
  
  
    return (
      <div className="navDiv">
      <nav className="nav">
      <div className='logo'>
        <h1 className="py-4 px-4 font-bold text-3xl">
          NFT Marketplace
        </h1>   
      </div>
      <div className="linksDiv">
         <div className='NM'>
            <Link href="/">
              NFT Mrketplace
            </Link>
         </div>
         <div className="sell">
           
            <Link href="/sell-nft">
              Sell NFT
            </Link>
         </div>
         </div>
          <div className="authDiv">
          <ConnectButton 
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
          showBalance={{
            smallScreen: false,
            largeScreen: true,
          }}/>        
          </div>
       
      </nav>
    </div>
  
    )
  }