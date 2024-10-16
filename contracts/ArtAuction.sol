pragma solidity ^0.4.24;

contract ArtAuction {
    struct Item {
        uint256 id;
        string name;
        string description;
        uint256 minBid;
        address owner; // Changed from address payable
        bool isSold;
    }

    struct Auction {
        uint256 itemId;
        uint256 highestBid;
        address highestBidder; // Changed from address payable
        bool isActive;
        uint256 endTime;
    }

    uint256 public itemCount;
    mapping(uint256 => Item) public items;
    mapping(uint256 => Auction) public auctions;

    event AuctionStarted(uint256 indexed itemId, uint256 endTime);
    event NewHighestBid(uint256 indexed itemId, address bidder, uint256 bidAmount);
    event AuctionEnded(uint256 indexed itemId, address winner, uint256 bidAmount);

    function createItem(string _name, string _description, uint256 _minBid) public {
        itemCount++;
        items[itemCount] = Item(itemCount, _name, _description, _minBid, msg.sender, false);
    }

    function startAuction(uint256 _itemId, uint256 _duration) public {
        Item storage item = items[_itemId];
        require(item.owner == msg.sender, "Only the owner can start the auction");
        require(!item.isSold, "Item is already sold");

        auctions[_itemId] = Auction(
            _itemId,
            item.minBid,
            address(0),
            true,
            now + _duration
        );

        emit AuctionStarted(_itemId, auctions[_itemId].endTime);
    }

    function bid(uint256 _itemId) public payable {
        Auction storage auction = auctions[_itemId];
        require(auction.isActive, "Auction is not active");
        require(now < auction.endTime, "Auction has ended");
        require(msg.value > auction.highestBid, "Bid must be higher than current highest bid");

        // Refund the previous highest bidder
        if (auction.highestBidder != address(0)) {
            auction.highestBidder.transfer(auction.highestBid);
        }

        // Update the auction with the new highest bid
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit NewHighestBid(_itemId, msg.sender, msg.value);
    }

    function endAuction(uint256 _itemId) public {
        Auction storage auction = auctions[_itemId];
        Item storage item = items[_itemId];
        require(auction.isActive, "Auction is not active");
        require(now >= auction.endTime, "Auction has not ended yet");
        require(msg.sender == item.owner, "Only the owner can end the auction");

        auction.isActive = false;
        item.isSold = true;

        // Transfer the funds to the seller
        if (auction.highestBidder != address(0)) {
            item.owner.transfer(auction.highestBid);
            // Transfer ownership of the item to the highest bidder
            item.owner = auction.highestBidder;
        }

        emit AuctionEnded(_itemId, auction.highestBidder, auction.highestBid);
    }

    function getItem(uint256 _itemId) public view returns (
        uint256 id,
        string name,
        string description,
        uint256 minBid,
        address owner,
        bool isSold
    ) {
        Item storage item = items[_itemId];
        return (item.id, item.name, item.description, item.minBid, item.owner, item.isSold);
    }

    function getAuction(uint256 _itemId) public view returns (
        uint256 itemId,
        uint256 highestBid,
        address highestBidder,
        bool isActive,
        uint256 endTime
    ) {
        Auction storage auction = auctions[_itemId];
        return (auction.itemId, auction.highestBid, auction.highestBidder, auction.isActive, auction.endTime);
    }
}