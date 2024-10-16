var DappToken = artifacts.require("./DappToken.sol");
var DappTokenSale = artifacts.require("./DappTokenSale.sol");

module.exports = async function(deployer, network, accounts) {
  // Deploy DappToken
  await deployer.deploy(DappToken, 1000000);
  const tokenInstance = await DappToken.deployed();

  // Token price is 0.001 Ether (in wei)
  var tokenPrice = 1000000000000000;

  // Deploy DappTokenSale
  await deployer.deploy(DappTokenSale, DappToken.address, tokenPrice);
  const tokenSaleInstance = await DappTokenSale.deployed();

  // Transfer 75% of all tokens to the token sale (750,000)
  var tokensForSale = 750000;
  await tokenInstance.transfer(tokenSaleInstance.address, tokensForSale, { from: accounts[0] });

  console.log("Transferred", tokensForSale, "tokens to DappTokenSale contract");
};