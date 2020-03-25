var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

var createGames = function (network) {
  return async function() {
    var initialGames = [
      {description: "single cell", size: 256, evolutions: 0,
       cells: web3.utils.toBN("0x1")},
      {description: "repeating background", size: 252, evolutions: 0,
       cells: new web3.utils.BN("000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111", 2)},
      {description: "A glider", size: 244, evolutions: 0,
       cells: new web3.utils.BN("1110001001101001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011", 2)},
      {description: "C1 glider", size: 205, evolutions: 0,
       cells: new web3.utils.BN("0001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101110110101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111", 2)},
      {description: "glider gun", size: 251, evolutions: 0,
       cells: new web3.utils.BN("00010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111000110000111011101011011100110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111", 2)},
    ]

    if (network == "development") {
      /* skip creating initial games for testing environment */
      initialGames = [];
    } else if (network == "local") {
      initialGames[0].evolutions = 100;
      initialGames[1].evolutions = 25;
      initialGames[2].evolutions = 25;
      initialGames[3].evolutions = 25;
      initialGames[4].evolutions = 25;
    } else {
      initialGames[0].evolutions = 50;
      initialGames[1].evolutions = 15;
      initialGames[2].evolutions = 30;
      initialGames[3].evolutions = 30;
      initialGames[4].evolutions = 15;
    }

    var totalGasUsed = 0;

    /* Get the factory instance */
    var factoryInstance = await Rule110Factory.deployed();

    /* Check for deployed games from a previous failed run */
    var gamesCreated = await factoryInstance.getPastEvents('GameCreated', {fromBlock: 0, toBlock: 'latest'});
    if (gamesCreated.length > 0) {
      console.log("[Migration] Previous run deployed " + gamesCreated.length + " games.");

      /* Remove successfully deployed games from our initial game list */
      initialGames = initialGames.slice(gamesCreated.length - 1);

      /* Check how far the very last deployed game got */
      var gameInstance = await Rule110.at(gamesCreated[gamesCreated.length-1].args.game);
      var gameStateUpdates = await gameInstance.getPastEvents('GameStateUpdated', {fromBlock: 0, toBlock: 'latest'});
      var numEvolutions = gameStateUpdates.length - 1;

      console.log("[Migration] Last deployed game at " + gameInstance.address + " got " + numEvolutions + " evolutions.");

      /* Adjust remaining evolutions for this game */
      initialGames[0].evolutions -= numEvolutions;

      /* Remove game if it's fully deployed, otherwise save its instance */
      if (initialGames[0].evolutions == 0)
        initialGames = initialGames.slice(1);
      else
        initialGames[0].instance = gameInstance;

      console.log("[Migration] Adjusted initial games. New initial games: ");
      console.log(initialGames);
    }

    /* Create and evolve each game */
    for (var i = 0; i < initialGames.length; i++) {
      var initialGame = initialGames[i];
      var gameInstance;

      /* Get the game instance */
      if (!initialGame.instance) {
        var result = await factoryInstance.newRule110(initialGame.size, initialGame.cells, web3.utils.asciiToHex(initialGame.description));
        totalGasUsed += result.receipt.gasUsed;
        gameInstance = await Rule110.at(result.logs[0].args.game);
      } else {
        /* Previously deployed game */
        gameInstance = initialGame.instance;
      }

      /* Evolve the game */
      for (var j = 0; j < initialGame.evolutions; j++) {
        var result = await gameInstance.evolve();
        totalGasUsed += result.receipt.gasUsed;
      }
    }

    console.log("[Gas Usage] Creating initial games used " + totalGasUsed + " total gas.");
  }
}

module.exports = function(deployer, network) {
  deployer.then(createGames(network));
}
