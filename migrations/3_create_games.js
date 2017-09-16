var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

module.exports = function(deployer, network) {
  if (network == "development") {
    var initialGames = [
      {description: "single cell", evolutions: 25,
       initialCells:  web3.toBigNumber("0x1")},
      {description: "repeating background", evolutions: 25,
       initialCells: web3.toBigNumber("0b000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
      {description: "space ship", evolutions: 100,
       initialCells: web3.toBigNumber("0b100011101110001110111000111011100011101110001110111000111011100011101110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111")},
    ]
  } else {
    /* FIXME */
  }

  return Rule110Factory.deployed().then(function (instance) {
    return initialGames.reduce(function (acc, game) {
      return acc.then(function () {
        return instance.newRule110(game.initialCells, game.description).then(function (result) {
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
