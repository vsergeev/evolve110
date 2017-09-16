var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

module.exports = async function(deployer, network) {
  if (network == "development") {
    var initialGames = [
      {description: "single cell", size: 256, evolutions: 25,
       initialCells:  web3.toBigNumber("0x1")},
      {description: "repeating background", size: 252, evolutions: 25,
       initialCells: web3.toBigNumber("0b000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
      {description: "space ship", size: 248, evolutions: 25,
       initialCells: web3.toBigNumber("0b10001110111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111")},
    ]
  } else {
    /* FIXME */
  }

  var factoryInstance = await Rule110Factory.deployed();

  for (let game of initialGames) {
    var result = await factoryInstance.newRule110(game.size, game.initialCells, game.description);

    var gameInstance = await Rule110.at(result.logs[0].args.game);
    for (i = 0; i < game.evolutions; i++) {
        var result = await gameInstance.evolve();
    }
  }
}
