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
      host: "localhost",
      port: 8545,
      network_id: "*",
    },
    local: {
      host: "localhost",
      port: 8545,
      network_id: "1234",
    },
    mainnet: {
      provider: provider,
      gas: "700000",
      gasPrice: "5000000000",
      network_id: "1",
    },
    ropsten: {
      provider: provider,
      gas: "700000",
      gasPrice: "20000000000",
      network_id: "3",
    },
    kovan: {
      provider: provider,
      gas: "700000",
      gasPrice: "20000000000",
      network_id: "42",
    },
    rinkeby: {
      provider: provider,
      gas: "700000",
      gasPrice: "20000000000",
      network_id: "4",
    },
  }
};
