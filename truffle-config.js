module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,         // Match the port in Ganache
      network_id: "*",    // Match any network id
    },
    // Other network configurations...
  },
  compilers: {
    solc: {
      version: "0.4.24",  // Use Solidity version 0.4.24
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};