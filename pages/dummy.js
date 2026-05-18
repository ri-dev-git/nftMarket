import React,{useState,useEffect} from 'react'

import axios from "axios"
function dummy() {
    // console.log(Network)
    const [flag,setFlag]=useState(true) 
    const [arr,setArr]=useState([])
    // "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const walletAddresses = ["0x848A75fE41d5B269Ca007f63FbE60ce8B15a6E60","0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B","0x7Fa3891bB083acd8F27F50588e5B2C1Bfa2d2FA4"];

  const resData=[]
    const trigger=async(address,length)=>{
      var fix=address
      
      const data=JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        headers: {
          "Content-Type": "application/json",
        },
        params: [`${fix}`],
        id: 5,
      })
      
      const config = {
        method: "post",
        url: `https://eth-mainnet.g.alchemy.com/v2/CpYsXhYHng9dnD73jC8VSKkUL4RocNol`,
        headers: {
          "Content-Type": "application/json",
        }, 
        data:data,
      };
         axios.request(config)
      .then((response) =>{

          console.log("res",response["data"]["result"])
          const fetc=response["data"]["result"]
          console.log(fetc["tokenBalances"])
          for(const i in fetc["tokenBalances"]){
            const config = {
              method: "POST",
              url: `https://eth-mainnet.g.alchemy.com/v2/CpYsXhYHng9dnD73jC8VSKkUL4RocNol`,
              headers: {
                "Content-Type": "application/json",
              }, 
              data: {
                id: 1,
                jsonrpc: '2.0',
                method: 'alchemy_getTokenMetadata',
                params: [`${fetc["tokenBalances"][i].contractAddress}`]
              }
            };
            const res=Promise.resolve(axios.request(config))
            res.then((value)=>{
              console.log(value)
            })
          }
          arr.push(response["data"]["result"])  
      })
      .catch((error) => console.log("error123", error));
      fix=0
    }
    
    const getTokenInfo=(address,tokenBalance)=>{
      
      let balance = tokenBalance;    
      const config = {
        method: "POST",
        url: `https://eth-mainnet.g.alchemy.com/v2/CpYsXhYHng9dnD73jC8VSKkUL4RocNol`,
        headers: {
          "Content-Type": "application/json",
        }, 
        data: {
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getTokenMetadata',
          params: [`${address}`]
        }
      };
      const res= axios.request(config)
    
      console.log("resss",res)
    balance = balance / Math.pow(10, res["data"]["result"].decimals);
    console.log(balance)
    balance = balance.toFixed(5);

 
    const ret=`. ${res["data"]["result"].name}: ${balance} ${
      res["data"]["result"].symbol
    }`
    console.log(
      ret
    );
      return (
        ret
      )
    }


    useEffect(()=>{
          
      setTimeout(() => {
        setFlag(false)
      }, 3000);
    //  getTokenInfo("0x0000000000085d4780b73119b644ae5ecd22b376",0x00000000000000000000000000000000000000000000000000002c49a0403e27)
    for(const i in walletAddresses){
      trigger(walletAddresses[i],walletAddresses.length)
    };
    var now = new Date();
    // arr.push(resData)
    console.log(arr ,"aa")
    },[])


  return (
    flag?"loading":<div>
      <div>
        Get token info by contract address
      </div>
      <div>
        hi
        {arr.map((dat,idx)=>{

            return(
              <div key={idx}>
                <div>{dat.address}</div>
                <div>{dat.tokenBalances.map((data,id)=>{
                     return( <div key={id}>----
                        {data.contractAddress}-----
                        <div>{data.tokenBalance}</div>
                        <div>{}</div>
                      </div>)
                })}</div>
              </div>
              
            )
          })
        }
      </div>
    </div>
  )
}

export default dummy