var provider = null;

if (process.env.DEPLOY) {
  var HDWalletProvider = require("truffle-hdwallet-provider");

  var mnemonic = process.env.DEPLOY_WALLET_MNEMONIC;
  var providerUrl = process.env.DEPLOY_PROVIDER_URL;

  if (mnemonic == undefined) {
    console.error("DEPLOY_WALLET_MNEMONIC not specified.");
    process.exit(1);
  }

  if (providerUrl == undefined) {
    console.error("DEPLOY_PROVIDER_URL not specified.");
    process.exit(1);
  }

  provider = new HDWalletProvider(mnemonic, providerUrl);
}

module.exports = {
  networks: {
    development: {
      network_id: "*",
      host: "localhost",
      port: 8545,
    },
    local: {
      network_id: "1234",
      host: "localhost",
      port: 8545,
    },
    mainnet: {
      network_id: "1",
      provider: provider,
      host: "localhost",
      port: 8545,
      gas: "700000",
      gasPrice: "5000000000",
    },
    ropsten: {
      network_id: "3",
      provider: provider,
      host: "localhost",
      port: 8545,
      gas: "700000",
      gasPrice: "20000000000",
    },
    kovan: {
      network_id: "42",
      provider: provider,
      host: "localhost",
      port: 8545,
      gas: "700000",
      gasPrice: "20000000000",
    },
    rinkeby: {
      network_id: "4",
      provider: provider,
      host: "localhost",
      port: 8545,
      gas: "700000",
      gasPrice: "20000000000",
    },
  }
};
