var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

module.exports = function(deployer, network) {
  var initialGames = [
    {description: "single cell", size: 256, evolutions: 0,
     initialCells:  web3.toBigNumber("0x1")},
    {description: "repeating background", size: 252, evolutions: 0,
     initialCells: web3.toBigNumber("0b000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
    {description: "A glider", size: 244, evolutions: 0,
     initialCells: web3.toBigNumber("0b1110001001101001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011")},
    {description: "C1 glider", size: 205, evolutions: 0,
     initialCells: web3.toBigNumber("0b0001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101110110101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
    {description: "glider gun", size: 251, evolutions: 0,
     initialCells: web3.toBigNumber("0b00010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111000100110111000110000111011101011011100110001001101111100010011011111000100110111110001001101111100010011011111000100110111110001001101111100010011011111")},
  ]

  if (network == "development") {
    /* testrpc does not behave well when running `truffle test` after many
     * mined blocks, so make no initial games for the testing environment. */
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

  deployer.then(function () {
    return Rule110Factory.deployed();
  }).then(function (instance) {
    /* Check for deployed games from a previous failed run */
    return new Promise(function (resolve, reject) {
      instance.GameCreated(null, {fromBlock: 0, toBlock: 'latest'}).get(function (error, logs) {
        if (error)
          reject(error);

        if (logs.length > 0) {
          console.log("[Migration] Previous run deployed " + logs.length + " games.");

          /* Remove successfully deployed games from our initial game list */
          initialGames = initialGames.slice(logs.length - 1);

          /* Check how far the very last deployed game got */
          resolve(Rule110.at(logs[logs.length-1].args.game).then(function (instance) {
            return new Promise(function (resolve, reject) {
              instance.GameStateUpdated(null, {fromBlock: 0, toBlock: 'latest'}).get(function (error, logs) {
                if (error)
                  reject(error);

                var numEvolutions = logs.length - 1;

                initialGames[0].evolutions -= numEvolutions;

                if (initialGames[0].evolutions == 0)
                  initialGames = initialGames.slice(1);
                else
                  initialGames[0].instance = instance;

                console.log("[Migration] Last deployed game at " + instance.address + " got " + numEvolutions + " evolutions.");
                console.log("[Migration] Adjusted initial games. New initial games: ");
                console.log(initialGames);
                resolve();
              });
            });
          }));
        } else {
          resolve();
        }
      });
    }).then(function () {
      return instance;
    });
  }).then(function (instance) {
    return initialGames.reduce(function (acc, game) {
      return acc.then(function () {
        if (game.instance) {
          return game.instance;
        } else {
          return instance.newRule110(game.size, game.initialCells, game.description).then(function (result) {
              totalGasUsed += result.receipt.gasUsed;
              return Rule110.at(result.logs[0].args.game);
          });
        }
      }).then(function (instance) {
        return (new Array(game.evolutions).fill()).reduce(function (acc, _) {
          return acc.then(function () {
            return instance.evolve().then(function (result) {
              totalGasUsed += result.receipt.gasUsed;
            });
          });
        }, Promise.resolve());
      });
    }, Promise.resolve());
  }).then(function () {
      console.log("[Gas Usage] Creating initial games used " + totalGasUsed + " total gas.");
  });
}
