App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function () {
    console.log("App initialized...");
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function () {
    $.getJSON("DappTokenSale.json", function (dappTokenSale) {
      App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
      App.contracts.DappTokenSale.setProvider(App.web3Provider);
      App.contracts.DappTokenSale.deployed().then(function (dappTokenSaleInstance) {
        App.dappTokenSaleInstance = dappTokenSaleInstance;
        console.log("Dapp Token Sale Address:", App.dappTokenSaleInstance.address);
        return App.loadContracts();
      });
    });
  },

  loadContracts: function () {
    $.getJSON("DappToken.json", function (dappToken) {
      App.contracts.DappToken = TruffleContract(dappToken);
      App.contracts.DappToken.setProvider(App.web3Provider);
      App.contracts.DappToken.deployed().then(function (dappTokenInstance) {
        App.dappTokenInstance = dappTokenInstance;
        console.log("Dapp Token Address:", App.dappTokenInstance.address);

        $.getJSON("ArtMarketplace.json", function (artMarketplace) {
          App.contracts.ArtMarketplace = TruffleContract(artMarketplace);
          App.contracts.ArtMarketplace.setProvider(App.web3Provider);
          App.contracts.ArtMarketplace.deployed().then(function (artMarketplaceInstance) {
            App.artMarketplaceInstance = artMarketplaceInstance;
            console.log("Art Marketplace Address:", App.artMarketplaceInstance.address);

            App.listenForEvents();
            return App.render();
          });
        });
      });
    });
  },

  listenForEvents: function () {
    App.dappTokenSaleInstance.Sell({}, {
      fromBlock: 0,
      toBlock: 'latest',
    }).watch(function (error, event) {
      console.log("Sell event triggered", event);
      App.render();
    });

    App.artMarketplaceInstance.ArtPurchased({}, {
      fromBlock: 0,
      toBlock: 'latest',
    }).watch(function (error, event) {
      console.log("ArtPurchased event triggered", event);
      App.render();
    });
  },

  render: function () {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $('#accountAddress').html("Your Account: " + account);
        App.loadBalances();
        App.loadArtItems();
      } else {
        console.error("Error getting coinbase:", err);
        App.loading = false;
        loader.hide();
        content.show();
      }
    });
  },

  loadBalances: function () {
    App.dappTokenInstance.balanceOf(App.account).then(function (balance) {
      $('.dapp-balance').html(balance.toNumber());
      App.loading = false;
      $('#loader').hide();
      $('#content').show();
    });
  },

  loadArtItems: function () {
    App.artMarketplaceInstance.artCount().then(function (artCount) {
      var artResults = $('#artResults');
      artResults.empty();

      for (var i = 1; i <= artCount.toNumber(); i++) {
        App.artMarketplaceInstance.artItems(i).then(function (art) {
          var id = art[0].toNumber();
          var name = art[1];
          var description = art[2];
          var price = art[3].toNumber();
          var owner = art[4];
          var isSold = art[5];

          // Render art item
          var artTemplate = `<tr>
            <td>${id}</td>
            <td>${name}</td>
            <td>${description}</td>
            <td>${price} Tokens</td>
            <td>${isSold ? 'Sold' : 'Available'}</td>
            <td>`;
          if (!isSold && owner !== App.account) {
            artTemplate += `<button class="btn btn-primary" id="buyButton" data-id="${id}" data-price="${price}">Buy</button>`;
          } else if (owner === App.account) {
            artTemplate += `Owned by you`;
          } else {
            artTemplate += `-`;
          }
          artTemplate += `</td></tr>`;

          artResults.append(artTemplate);
        });
      }
    });
  },

  buyTokens: function () {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.dappTokenSaleInstance.buyTokens(numberOfTokens, {
      from: App.account,
      value: numberOfTokens * App.tokenPrice,
      gas: 500000,
    }).then(function (result) {
      console.log("Tokens bought...");
      $('form').trigger('reset'); // Reset number of tokens in form
      // Wait for Sell event
    }).catch(function (error) {
      console.error("Error buying tokens:", error);
      App.loading = false;
      $('#loader').hide();
      $('#content').show();
    });
  },

  purchaseArt: function (event) {
    event.preventDefault();
    var artId = $(event.target).data('id');
    var price = $(event.target).data('price');

    App.dappTokenInstance.approve(App.artMarketplaceInstance.address, price, { from: App.account }).then(function () {
      App.artMarketplaceInstance.purchaseArt(artId, { from: App.account }).then(function (result) {
        console.log("Art purchased:", result);
        App.render();
      }).catch(function (error) {
        console.error("Error purchasing art:", error);
      });
    }).catch(function (error) {
      console.error("Error approving tokens:", error);
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });

  // Event delegation for dynamically generated buttons
  $(document).on('click', '#buyButton', App.purchaseArt);
});