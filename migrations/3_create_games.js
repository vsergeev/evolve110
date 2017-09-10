var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

module.exports = function(deployer, network) {
  if (network == "development") {
    var initialGames = [
      {cells: [web3.toBigNumber("0"),
               web3.toBigNumber("0"),
               web3.toBigNumber("0x1")],
       description: "single cell", evolutions: 25},
      {cells: [web3.toBigNumber("0"),
               web3.toBigNumber("0"),
               web3.toBigNumber("0b1001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001")],
       description: "repeating background", evolutions: 25},
      {cells: [web3.toBigNumber("0"),
               web3.toBigNumber("0b0001001101"),
               web3.toBigNumber("0b1111000111011100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001")],
       description: "space ship", evolutions: 25},
    ]
  } else {
    /* FIXME */
  }

  return Rule110Factory.deployed().then(function (instance) {
    return initialGames.reduce(function (acc, game) {
      return acc.then(function () {
        return instance.newRule110(...game.cells, game.description).then(function (result) {
          return Rule110.at(result.logs[0].args.game).then(function (instance) {
            return (new Array(game.evolutions).fill()).reduce(function (acc, e) {
              return acc.then(function () {
                return instance.evolve().then(function (result) { });
              });
            }, Promise.resolve());
          });
        });
      });
    }, Promise.resolve());
  });
}
