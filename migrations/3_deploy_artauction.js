var DappToken = artifacts.require("./DappToken.sol");
var ArtMarketplace = artifacts.require("./ArtMarketplace.sol");

module.exports = async function(deployer) {
  // Deploy the ArtMarketplace contract and pass the address of the DappToken contract
  const tokenInstance = await DappToken.deployed();
  await deployer.deploy(ArtMarketplace, tokenInstance.address);
};