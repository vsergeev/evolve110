var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

contract('Rule110', function(accounts) {
  it("should initialize state correctly", function () {
    var initialCells = web3.toBigNumber('0x788b997abd8e68126f0c93181afa5d2fd645a353f490e96af75760f2ac01032');

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
    var initialCells = web3.toBigNumber("0x788b997abd8e68126f0c93181afa5d2fd645a353f490e96af75760f2ac01032");

    var testVectors = [
      web3.toBigNumber('0xc99ebbcfe79af836f91db7383f8ef7787ecfe7f61db1bbff9dfde197fc03076'),
      web3.toBigNumber('0xdbb3ee582cbf887f8b37fd68609b9dc8c3d82c1e37f3ee00b70723bc04070df'),
      web3.toBigNumber('0x7ef63af87de098c09f7c07f8e1beb759c6787c327c163a01fd0d66e40c0d1f0'),
      web3.toBigNumber('0xc39e6f88c721b9c1b1c40c09a3e3fdfb4ec8c476c43e6e03071fefac1c1f310'),
      web3.toBigNumber('0xc6b2f899cd63eb43f34c1c1be626070fdbd9ccdfcc62fa070d3038fc3431731'),
      web3.toBigNumber('0x4ff789bb5fe63fc617dc343e2e6e0d187e7b5df05ce78e0d1f7069847c73d73'),
      web3.toBigNumber('0xd81c9beff02e604e3c747c627afa1f38c2cff710f5ac9a1f31d0fb8cc4d67d7'),
      web3.toBigNumber('0x7835be38107ae0da64dcc4e6cf8e3169c7d81d319ffdbe3173718e9dcdfec7c'),
      web3.toBigNumber('0xc87fe26830cfa1feedf5cdafd89a73fb4c783773b007e273d7d39bb75f03cc4'),
      web3.toBigNumber('0xd8c026f871d8e303bf1f5ff879bed60fdcc87dd6f00c26d67c76befdf1065cd'),
    ]

    return Rule110.new(initialCells).then(function (instance) {
      return testVectors.reduce(function (acc, vector) {
        return acc.then(function () {
          return instance.evolve().then(function (result) {
            assert(result.receipt.gasUsed < 30000, "Excessive gas used");
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
    var initialCells = web3.toBigNumber('0x788b997abd8e68126f0c93181afa5d2fd645a353f490e96af75760f2ac01032');
    var description = "foobar";

    return Rule110Factory.deployed().then(function (instance) {
      return instance.newRule110(initialCells, description).then(function (result) {
        assert(result.receipt.gasUsed < 200000, "Excessive gas used");
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
