
// import styles from '@/styles/Home.module.css'
import {useAccount, useConnect } from 'wagmi';
// const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const { connector: activeConnector, isConnected } = useAccount()
  // const { connect, error, isLoading, pendingConnector } =useConnect()
  
  console.log(isConnected)
  return (
 isConnected?<div>
  <div>
    
  </div>
 </div>:"Please Connect Wallet"
  )
}
