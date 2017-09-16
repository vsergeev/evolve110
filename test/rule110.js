var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

contract('Rule110', function(accounts) {
  it("should throw on unsupported sizes", function () {
    /* test 0 1 2 257 */
    /* FIXME assert throws from contract constructor */
  });

  it("should initialize state correctly", function () {
    var size = 256;
    var initialCells = web3.toBigNumber('0x3d271bef962c804c7abab3ad3887d126d4173f1b524e4b2937ba0e9e4228c24e');

    return Rule110.new(size, initialCells).then(function (instance) {
      var receipt = web3.eth.getTransactionReceipt(instance.transactionHash);
      assert(receipt.gasUsed < 600000, "Excessive gas used");
      assert.equal(receipt.logs.length, 1, "Invalid number of events produced");
      return instance.state.call();
    }).then(function (state) {
      assert(state.equals(initialCells), "Incorrect initial state");
    })
  });

  it("should evolve correctly", function () {
    var testVectors = [
      {
        size: 12,
        initialCells: web3.toBigNumber("0x2d8"),
        evolution: [
          web3.toBigNumber('0x7f8'),
          web3.toBigNumber('0xc08'),
          web3.toBigNumber('0xc19'),
          web3.toBigNumber('0x43b'),
          web3.toBigNumber('0xc6f'),
        ]
      },
      {
        size: 100,
        initialCells: web3.toBigNumber("0x4f0641ada80467c68ed5db978"),
        evolution: [
          web3.toBigNumber('0xd90ec3fff80cec4f9bff7ebc8'),
          web3.toBigNumber('0xfb1bc600081dbcd8be01c3e59'),
          web3.toBigNumber('0xf3e4e001837e5f9e203462fb'),
          web3.toBigNumber('0x1962da00387c2f0b2607ce78f'),
          web3.toBigNumber('0x3be7fe0068c4791f6e0c5ac99'),
        ]
      },
      {
        size: 128,
        initialCells: web3.toBigNumber("0x800b77e54479045ee5804c9a8d66b663"),
        evolution: [
          web3.toBigNumber('0x801fdc2fcccb0cf3af80ddbf9feffee6'),
          web3.toBigNumber('0x803074785ddf1d96f881f7e0b03803af'),
          web3.toBigNumber('0x8070dcc8f77137bf89831c21f06806f8'),
          web3.toBigNumber('0x80d1f5d99dd37ce09b87346310f80f89'),
          web3.toBigNumber('0x81f31f7bb777c5a1be8d7ce73188189b'),
        ]
      },
      {
        size: 256,
        initialCells: web3.toBigNumber("0x5334edc9891e950d2067d6cee1f6f32d28071a2c5ad66fa4de42a626450417b5"),
        evolution: [
          web3.toBigNumber('0xf77dbf5b9b33bf1f60ec7fdba31f977f780d3e7cfffef8edf2c7ee6ecf0c3cff'),
          web3.toBigNumber('0x1dc7e1febf76e131e1bcc07ee730bdc1c81f62c5800389bf17cc3afbd91c6580'),
          web3.toBigNumber('0x374c2303e1dfa37323e5c0c3ad71e7435831e7cf80069be13c5c6f8e7b34ef80'),
          web3.toBigNumber('0x7ddc67062370e7d7662f41c6ffd32dc7f8732c58800fbe2364f4f89acf7db880'),
          web3.toBigNumber('0xc774ed0e67d1ac7dee79c34f80777f4c08d77cf98018e267ed9d89bfd9c7e980'),
        ]
      },
    ]

    return testVectors.reduce(function (acc, game) {
      return acc.then(function () {
        return Rule110.new(game.size, game.initialCells).then(function (instance) {
          return game.evolution.reduce(function (acc, expectedCells) {
            return acc.then(function () {
              return instance.evolve().then(function (result) {
                assert(result.receipt.gasUsed < 50000, "Excessive gas used");
                assert.equal(result.logs.length, 1, "Invalid number of events produced");
                assert.equal(result.logs[0].event, "GameStateUpdated", "Invalid event produced");
                assert(web3.toBigNumber(result.logs[0].args.cells.toString()).equals(expectedCells), "Invalid state");
              });
            });
          }, Promise.resolve()).then(function () {
            return instance.state.call().then(function (state) {
              assert(state.equals(game.evolution[game.evolution.length - 1]), "Invalid final state");
            });
          });
        });
      });
    }, Promise.resolve());
  });
})

contract('Rule110Factory', function(accounts) {
  it("should create games correctly", function () {
    var size = 256;
    var initialCells = web3.toBigNumber('0x3d271bef962c804c7abab3ad3887d126d4173f1b524e4b2937ba0e9e4228c24e');
    var description = "foobar";

    return Rule110Factory.deployed().then(function (instance) {
      return instance.newRule110(size, initialCells, description).then(function (result) {
        assert(result.receipt.gasUsed < 600000, "Excessive gas used");
        assert.equal(result.logs.length, 1, "Invalid number of events produced");
        assert.equal(result.logs[0].event, "GameCreated", "Invalid event produced");
        assert.equal(web3.toUtf8(result.logs[0].args.description), description, "Invalid description");

        return Rule110.at(result.logs[0].args.game).then(function (instance) {
          return instance.state.call().then(function (state) {
            assert(state.equals(initialCells), "Incorrect initial state");
          });
        });
      });
    })
  });
})
