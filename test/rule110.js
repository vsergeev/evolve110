var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

contract('Rule110', function(accounts) {
  it("should initialize state correctly", function () {
    var initialCells = web3.toBigNumber('0x9ce6a5b47848254f5852feca4c7592ace15a64732879bed96374d2a87a6177ab');

    return Rule110.new(initialCells).then(function (instance) {
      var receipt = web3.eth.getTransactionReceipt(instance.transactionHash);
      assert(receipt.gasUsed < 350000, "Excessive gas used");
      assert.equal(receipt.logs.length, 1, "Invalid number of events produced");
      return instance.state.call();
    }).then(function (state) {
      assert(state.equals(initialCells), "Incorrect initial state");
    })
  });
  it("should evolve correctly", function () {
    var initialCells = web3.toBigNumber("0x26f89bef8ee26f89be26837c765be26f89be26f89be26f8e04df137c4df137c7");

    var testVectors = [
        web3.toBigNumber('0x6f89be389ba6f89be26f87c4defe26f89be26f89be26f89a0df137c4df137c4d'),
        web3.toBigNumber('0xf89be269beef89be26f88c4df3826f89be26f89be26f89be1f137c4df137c4df'),
        web3.toBigNumber('0x09be26fbe3b89be26f899cdf1686f89be26f89be26f89be23137c4df137c4df0'),
        web3.toBigNumber('0x1be26f8e26e9be26f89bb5f13f8f89be26f89be26f89be26737c4df137c4df10'),
        web3.toBigNumber('0x3e26f89a6fbbe26f89beff1360989be26f89be26f89be26ed7c4df137c4df130'),
        web3.toBigNumber('0x626f89bef8ee26f89be38137e1b9be26f89be26f89be26fbfc4df137c4df1370'),
        web3.toBigNumber('0xe6f89be389ba6f89be26837c23ebe26f89be26f89be26f8e04df137c4df137d0'),
        web3.toBigNumber('0xaf89be269beef89be26f87c4663e26f89be26f89be26f89a0df137c4df137c71'),
        web3.toBigNumber('0xf89be26fbe3b89be26f88c4cee626f89be26f89be26f89be1f137c4df137c4d3'),
        web3.toBigNumber('0x09be26f8e26e9be26f899cddbae6f89be26f89be26f89be23137c4df137c4df6'),
    ]

    return Rule110.new(initialCells).then(function (instance) {
      return testVectors.reduce(function (acc, vector) {
        return acc.then(function () {
          return instance.evolve().then(function (result) {
            assert(result.receipt.gasUsed < 50000, "Excessive gas used");
            assert.equal(result.logs.length, 1, "Invalid number of events produced");
            assert.equal(result.logs[0].event, "GameStateUpdated", "Invalid event produced");
            assert(web3.toBigNumber(result.logs[0].args.cells.toString()).equals(vector), "Invalid state");
          });
        });
      }, Promise.resolve()).then(function () {
        return instance.state.call().then(function (state) {
          finalState = testVectors[testVectors.length - 1];
          assert(state.equals(finalState), "Invalid final state");
        });
      });
    });
  });
})

contract('Rule110Factory', function(accounts) {
  it("should deploy correctly", function () {
    var initialCells = web3.toBigNumber('0x9ce6a5b47848254f5852feca4c7592ace15a64732879bed96374d2a87a6177ab');
    var description = "foobar";

    return Rule110Factory.deployed().then(function (instance) {
      return instance.newRule110(initialCells, description).then(function (result) {
        assert(result.receipt.gasUsed < 300000, "Excessive gas used");
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
