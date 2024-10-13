import React, { useEffect, useState } from "react"
// import logo from "../../assets/logo.png"
import { Actor, HttpAgent } from "@dfinity/agent"
import {idlFactory} from "../../../declarations/nft"
import { canisterId, createActor } from "../../../declarations/nft/index"
import {Principal} from "@dfinity/principal"
import Button from "./Button"
import { opend } from "../../../declarations/opend"

function Item(props) {

  const[name, setName]= useState()
  const[owner, setOwner] = useState()
  const[image, setImage] = useState()
  const [button, setButton] = useState()
  const [priceInput, setPriceInput] = useState()
  const [loaderHidden, setLoaderHidden] = useState(true)
  const [blur, setBlur] = useState()

  //convert props to principal type
  // const id = Principal.fromText(props.id)
  const id = props.id

  const localHost = "http://localhost:8080/"
  const agent = new HttpAgent({host: localHost})
  //When deploy the project live, remove this following line
  agent.fetchRootKey()

  let NFTActor

  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    })
    //call functions from nft.mo
    const name = await NFTActor.getName()
    setName(name)

    const ownerPrincipal = await NFTActor.getOwner()
    //convert Principal format to text
    const ownerText= ownerPrincipal.toText()
    setOwner(ownerText)

    const imageData = await NFTActor.getAsset()
    //convert the [NAT8] data into Uint8Array
    const imageContent = new Uint8Array(imageData)
    //turn it into the url
    const image = URL.createObjectURL(
      new Blob([imageContent.buffer], {type: "image/png"})
    )
    setImage(image)

    //check if NFT is listed in the ListingMap
    console.log("props.id:", props.id, typeof props.id)
    const nftIsListed = await opend.isListed(props.id)
    //if it's listed ->  nftIsListed : true
    if (nftIsListed){
      //if it's listed, blur the image and set the owner to OpenD market 
      setOwner("OpenD")
      setBlur({filter: "blur(4px)"})
    } else {
      //if it's not listed, then you can sell
      setButton(<Button handleClick={handleSell} text="Sell"/>)
    }
    
  }

  //call loadNFT function once when the page loads
  useEffect(()=> {
    loadNFT()
  }, [])

  let price
  function handleSell(){
    // console.log('sell clicked')
    setPriceInput(
      <input
        placeholder="Price in DENG"
        type="number"
        className="price-input"
        value={price}
        onChange={(e)=> price = e.target.value}
      />
    )
    setButton(<Button handleClick={sellItem} text="Confirm"/>)
  }

  async function sellItem() {
    setBlur({filter: "blur(4px)"})
    setLoaderHidden(false)
    console.log(`List at ${price} DENG`)
    const listingResult = await opend.listItem(props.id, Number(price))
    console.log(`Listing result: ${listingResult}`)

    //if opend.listItem() runs properly, then transfer the NFT owner
    if (listingResult == "success"){
      const openDID = await opend.getOpenDCanisterID()
      const transferResult = await NFTActor.transferOwnership(openDID)
      console.log(`Transfer result: ${transferResult}`)

      //if the transfer is success, hide the loader, price input, and confirm button
      if (transferResult == "Success"){
        setLoaderHidden(true)
        setButton()
        setPriceInput()
        //instead of display owner as 2vxx-fae, change it to Opend so that the user knows that it has been transfer
        setOwner("OpenD")
      }
    }
  }
  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        {/* image */}
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        {/* loader */}
        <div className="lds-ellipsis" hidden={loaderHidden}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
        {/* name */}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"></span>
          </h2>
        {/* owner */}
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {/* sell button */}
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  )
}

export default Item
