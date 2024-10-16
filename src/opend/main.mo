import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor OpenD { 
    private type Listing = {
        itemOwner: Principal;
        itemPrice: Nat;
    };
    
//1. create map of NFTs and map of Owner
var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imgData: [Nat8], name: Text) : async Principal {
        let owner : Principal = msg.caller;

        //check how many Cycles we use in order to create a canister
        Debug.print(debug_show (Cycles.balance()));
        Cycles.add(100_500_000_000);
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        Debug.print(debug_show (Cycles.balance()));

//2. everytime you create new NFT, push it to the map
        let newNFTPrincipal = await newNFT.getCanisterId();
        mapOfNFTs.put(newNFTPrincipal, newNFT);
        addToOwnershipMap(owner, newNFTPrincipal);

        return newNFTPrincipal
    };

    //to add newly created NFT to mapOfOwners
    private func addToOwnershipMap(owner: Principal, nftId: Principal) {
        var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(owner)){
            case null List.nil<Principal>();
            case (?result) result;
        };

        ownedNFTs := List.push(nftId, ownedNFTs);
        mapOfOwners.put(owner, ownedNFTs);
    };

   //3.fetch data to be used on react frontend 
   public query func getOwnedNFTs(user: Principal) : async [Principal] {
        //retrieve the list of NFT principals owned by a single user from the mapOfOwners
        var userNFTs : List.List<Principal> = switch (mapOfOwners.get(user)) {
            case null List.nil<Principal>();
            case (?result) result
        };
        return List.toArray(userNFTs);
    };

        //pass listing item id to Header component
    public query func getListedNFTs() : async [Principal]{
        //turn keys to an array using Iter
        let ids = Iter.toArray(mapOfListings.keys());
        return ids;
    };

    //4. for listings
    public shared(msg) func listItem(id: Principal, price: Nat) : async Text {
        //get a hold of NFT, since we're not sure if NFT exists, use this switch statement
        var item : NFTActorClass.NFT = switch (mapOfNFTs.get(id)){
            case null return "NFT does not exist";
            //if result exists, return the result
            case (?result) result;
        };

        //check the person who is calling this list is the owner of that NFT
        let owner = await item.getOwner();
        //if that person is the owner with msg caller id
        if(Principal.equal(owner,msg.caller)){
            //create new listing
            let newListing : Listing = {
                itemOwner = owner;
                itemPrice = price;
            };
            mapOfListings.put(id, newListing);
            return "success";
        } else {
            return "you don't own this NFT"
        }
    };

    //get the new owner canister ID to pass to Item.jsx
    public query func getOpenDCanisterID() : async Principal{
        return Principal.fromActor(OpenD);
    };

    //check if this ID is listed for sell
    public query func isListed(id: Principal) : async Bool {
        //if this id is in the Listings map -> true/ if not (nul) -> false
        if (mapOfListings.get(id) == null){
            return false;
        } else {
            return true;
        }
    };

    //for Item component
    public query func getOriginalOwner(id: Principal) : async Principal {
        //if the checking id isn't the original owner, return empty  
        var listing : Listing = switch (mapOfListings.get(id)) {
            case null return Principal.fromText("");
            case (?result) result;
        };
        return listing.itemOwner;
    };

    //for setting Price Label in Item component
    public query func getListedNFTPrice(id: Principal) : async Nat {
        var listing : Listing = switch (mapOfListings.get(id)){
            case null return 0;
            case (?result) result;
        };
        return listing.itemPrice;
    };

    //for transfer ownership in handleBuy() in Item component
    public shared(msg) func completePurchase(id: Principal, ownerId: Principal, newOwnerId: Principal) : async Text {
        //get that purchased NFT from mapOfNFTs
        var purchasedNFT : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist";
            case (?result) result;
        };

        //transfer the owner to the buyer -> transferOwnership()from nft.mo
        let transferResult = await purchasedNFT.transferOwnership(newOwnerId);
        if(transferResult == "Success"){
            //when NFT's sold, delete it from listings for sell -> mapOfListings
            mapOfListings.delete(id);
            //and remove it from its previous owner -> mapOfOwners
            var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(ownerId)){
                //if it's null, return empty list
                case null List.nil<Principal>();
                case (?result) result;
            };
            //add new item in a new list -> loop through ownedNFTs and check if this id matches the NFT id
            //return true -> add to a new list
            ownedNFTs := List.filter(ownedNFTs, func (listItemId: Principal) : Bool {
                //return when the listItemId is not the NFT id
               return listItemId != id; 
            });

            //add to ownership map of the new owner -> addToOwnershipMap()
            addToOwnershipMap(newOwnerId, id);
            return "Success";
        } else {
            return "Error";
        }
    };
};
