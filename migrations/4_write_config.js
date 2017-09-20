var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

var fs = require("fs");
var path = require("path");

module.exports = function(deployer, network) {
  var configPath = path.join(deployer.basePath, '..', 'docs', 'config.json');

  var Rule110FactoryInfo = Rule110Factory.toJSON();
  var Rule110Info = Rule110.toJSON();

  var config = {
    contracts: {
      Rule110Factory: Rule110FactoryInfo.abi,
      Rule110: Rule110Info.abi,
    },
    networks: {
      1: {
        factoryAddress: null,
        defaultGasPrice: "4",
        tipAddress: "0x77609A77DF4Bb5c8464ee1c84B17F934297D35F5",
        defaultTipAmount: "0.003",
      },
      3: {
        factoryAddress: null,
        defaultGasPrice: "20",
        tipAddress: "0x77609A77DF4Bb5c8464ee1c84B17F934297D35F5",
        defaultTipAmount: "0.003",
      },
      4: {
        factoryAddress: null,
        defaultGasPrice: "20",
        tipAddress: "0x77609A77DF4Bb5c8464ee1c84B17F934297D35F5",
        defaultTipAmount: "0.003",
      },
      42: {
        factoryAddress: null,
        defaultGasPrice: "20",
        tipAddress: "0x77609A77DF4Bb5c8464ee1c84B17F934297D35F5",
        defaultTipAmount: "0.003",
      },
      1234: {
        factoryAddress: null,
        defaultGasPrice: "4",
        tipAddress: "0xecf0744f2f71a16b831125d6cffafd6095617adf",
        defaultTipAmount: "0.003",
      },
    }
  };

  /* evolve() gas cost: (42438 gas * 4 gwei)/(1000000000 gwei/ETH) = 0.0001697520 ETH */

  /* Populate factory addresses */
  for (var network in Rule110FactoryInfo.networks) {
    if (config.networks[network])
      config.networks[network].factoryAddress = Rule110FactoryInfo.networks[network].address;
  }

  fs.writeFile(configPath, JSON.stringify(config), function (err) {
    if (err)
      throw err;
  });
}
