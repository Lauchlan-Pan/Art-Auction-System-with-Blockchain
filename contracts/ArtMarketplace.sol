pragma solidity ^0.4.24;

contract DappToken {
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success);
    function balanceOf(address _owner) public view returns (uint256 balance);
}

contract ArtMarketplace {
    struct ArtItem {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address owner;
        bool isSold;
    }

    uint256 public artCount = 0;
    mapping(uint256 => ArtItem) public artItems;

    DappToken public tokenContract;

    event ArtPurchased(uint256 indexed artId, address indexed buyer, uint256 price);

    constructor(DappToken _tokenContract) public {
        tokenContract = _tokenContract;
        _createArtItem("Mona Lisa", "A masterpiece by Leonardo da Vinci", 100);
        _createArtItem("Starry Night", "A famous painting by Vincent van Gogh", 80);
        _createArtItem("The Scream", "An iconic work by Edvard Munch", 60);
    }

    function _createArtItem(string _name, string _description, uint256 _price) internal {
        artCount++;
        artItems[artCount] = ArtItem(artCount, _name, _description, _price, address(this), false);
    }

    function purchaseArt(uint256 _artId) public {
        ArtItem storage art = artItems[_artId];
        require(_artId > 0 && _artId <= artCount, "Invalid art ID");
        require(!art.isSold, "Art item is already sold");
        require(tokenContract.balanceOf(msg.sender) >= art.price, "Not enough tokens to purchase this art item");

        // Transfer tokens from buyer to the marketplace (or the seller if applicable)
        require(tokenContract.transferFrom(msg.sender, address(this), art.price), "Token transfer failed");

        // Update ownership and sale status
        art.owner = msg.sender;
        art.isSold = true;

        emit ArtPurchased(_artId, msg.sender, art.price);
    }

    function getArtItem(uint256 _artId) public view returns (
        uint256 id,
        string name,
        string description,
        uint256 price,
        address owner,
        bool isSold
    ) {
        ArtItem storage art = artItems[_artId];
        return (art.id, art.name, art.description, art.price, art.owner, art.isSold);
    }
}