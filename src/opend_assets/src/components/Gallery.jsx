import React, { useEffect, useState } from "react"
import Item from "./Item"
import {Principal} from "@dfinity/principal"

function Gallery(props) {

 const[items,setitems] = useState()
//props.ids is in Principal data type, you can use toText() to convert it
 function fetchNFTs(){
    if (props.ids != undefined){
      setitems(
        props.ids.map((NFTid) => <Item id={NFTid} key={NFTid.toText()} role={props.role}/>)
      )
    }
 }

 useEffect(()=> {
  fetchNFTs()
 }, [])
  return (
    <div className="gallery-view">
      <h3 className="makeStyles-title-99 Typography-h3">{props.title}</h3>
      <div className="disGrid-root disGrid-container disGrid-spacing-xs-2">
        <div className="disGrid-root disGrid-item disGrid-grid-xs-12">
          <div className="disGrid-root disGrid-container disGrid-spacing-xs-5 disGrid-justify-content-xs-center">
          {/* <Item id={"rrkah-fqaaa-aaaaa-aaaaq-cai"}/> */}
          {items}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Gallery
