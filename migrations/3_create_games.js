var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

module.exports = async function(deployer, network) {
  if (network == "development") {
    var initialGames = [
      {description: "single cell", size: 256, evolutions: 25,
       initialCells:  web3.toBigNumber("0x1")},
      {description: "repeating background", size: 252, evolutions: 25,
       initialCells: web3.toBigNumber("0b000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
      {description: "A glider", size: 244, evolutions: 25,
       initialCells: web3.toBigNumber("0b1110001001101001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011")},
      {description: "C1 glider", size: 205, evolutions: 25,
       initialCells: web3.toBigNumber("0b0001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101110110101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
      {description: "glider gun", size: 251, evolutions: 25,
       initialCells: web3.toBigNumber("0b00010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111000110000111011101011011100110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
    ]
  } else {
    /* FIXME */
  }

  var factoryInstance = await Rule110Factory.deployed();

  var totalGasUsed = 0;

  for (let game of initialGames) {
    var result = await factoryInstance.newRule110(game.size, game.initialCells, game.description);
    totalGasUsed += result.receipt.gasUsed;

    var gameInstance = await Rule110.at(result.logs[0].args.game);
    for (i = 0; i < game.evolutions; i++) {
        var result = await gameInstance.evolve();
        totalGasUsed += result.receipt.gasUsed;
    }
  }

  console.log("[Gas Usage] Creating initial games used " + totalGasUsed + " total gas.");
}
