import React, { useEffect, useState } from "react"
import logo from "../../assets/logo.png"
import { Actor, HttpAgent } from "@dfinity/agent"
import {idlFactory} from "../../../declarations/nft"
import { canisterId } from "../../../declarations/nft/index"
import {Principal} from "@dfinity/principal"

function Item(props) {

  const[name, setName]= useState()
  
  //convert props to principal type
  const id = Principal.fromText(props.id)

  const localHost = "http://localhost:8080/"
  const agent = new HttpAgent({host: localHost})

  async function loadNFT() {
    const NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    })
    //call any functions from nft.mo
    const name = await NFTActor.getName()
    setName(name)
  }

  //call loadNFT function once when the page loads
  useEffect(()=> {
    loadNFT()
  }, [])

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        {/* image */}
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={logo}
        />
        <div className="disCardContent-root">
        {/* name */}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"></span>
          </h2>
        {/* owner */}
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: sdfsdf-erwerv-sdf
          </p>
        </div>
      </div>
    </div>
  )
}

export default Item
