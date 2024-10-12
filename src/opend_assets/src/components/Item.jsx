import React, { useEffect, useState } from "react"
import logo from "../../assets/logo.png"
import { Actor, HttpAgent } from "@dfinity/agent"
import {idlFactory} from "../../../declarations/nft"
import { canisterId, createActor } from "../../../declarations/nft/index"
import {Principal} from "@dfinity/principal"
import Button from "./Button"

function Item(props) {

  const[name, setName]= useState()
  const[owner, setOwner] = useState()
  const[image, setImage] = useState()
  const [button, setButton] = useState()
  const [priceInput, setPriceInput] = useState()

  //convert props to principal type
  // const id = Principal.fromText(props.id)
  const id = props.id

  const localHost = "http://localhost:8080/"
  const agent = new HttpAgent({host: localHost})

  async function loadNFT() {
    const NFTActor = await Actor.createActor(idlFactory, {
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

    setButton(<Button handleClick={handleSell} text="Sell"/>)
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
    console.log(`Sell at ${price} DENG`)
  }
  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        {/* image */}
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
        />
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
