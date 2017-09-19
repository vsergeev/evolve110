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
    networks: {}
  };

  var tipAddresses = {
    1:    "0x0",
    2:    "0x0",
    1234: "0xecf0744f2f71a16b831125d6cffafd6095617adf",
  }

  for (var network in Rule110FactoryInfo.networks) {
    config.networks[network] = {
      factoryAddress: Rule110FactoryInfo.networks[network].address,
      defaultGasPrice: 4,
      tipAddress: tipAddresses[network],
      defaultTipAmount: "0.003",
    }
  }

  fs.writeFile(configPath, JSON.stringify(config), function (err) {
    if (err) throw err;
  });
}
