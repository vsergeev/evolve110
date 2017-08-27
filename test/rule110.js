var Rule110 = artifacts.require("Rule110");
var Rule110Factory = artifacts.require("Rule110Factory");

contract('Rule110', function(accounts) {
  it("should initialize state correctly", function () {
    var initial_state = [web3.toBigNumber('0x9ce6a5b47848254f5852feca4c7592ace15a64732879bed96374d2a87a6177ab'),
                         web3.toBigNumber('0x79a9cdb4f50518d658a7afc1a25bdeef043f2f25a4fa7d5e7a48500b7cb5e083'),
                         web3.toBigNumber('0xfb34483988d00694326c60642e6b0bef686b5a757fb71e48623560e8d35b09d9')]

    return Rule110.new(initial_state).then(function (instance) {
      var receipt = web3.eth.getTransactionReceipt(instance.transactionHash);
      assert(receipt.gasUsed < 350000, "Excessive gas used");
      assert.equal(receipt.logs.length, 1, "Invalid number of events produced");
      return instance.state.call();
    }).then(function (state) {
      assert(state[0].equals(initial_state[0]), "Incorrect initial state");
      assert(state[1].equals(initial_state[1]), "Incorrect initial state");
      assert(state[2].equals(initial_state[2]), "Incorrect initial state");
    })
  });
  it("should evolve correctly", function () {
    var initial_state = [web3.toBigNumber("0x007363cd3e305be98eee6f89be269beef89be26f8e26e9be26f89bef8ee26f89"),
                         web3.toBigNumber("0xbe269beef89be26f8e26e9be26f89bef8ee26f89be269beef89be26f8e26e9be"),
                         web3.toBigNumber("0x26f89bef8ee26f89be26837c765be26f89be26f89be26f8e04df137c4df137c7")];
    var test_vectors = [
      [web3.toBigNumber("0x00d7e65f6270fe3b9bbaf89be26fbe3b89be26f89a6fbbe26f89be389ba6f89b"),
       web3.toBigNumber("0xe26fbe3b89be26f89a6fbbe26f89be389ba6f89be26fbe3b89be26f89a6fbbe2"),
       web3.toBigNumber("0x6f89be389ba6f89be26f87c4defe26f89be26f89be26f89a0df137c4df137c4d")],
      [web3.toBigNumber("0x01fc2ef1e6d1826ebeef89be26f8e26e9be26f89bef8ee26f89be269beef89be"),
       web3.toBigNumber("0x26f8e26e9be26f89bef8ee26f89be269beef89be26f8e26e9be26f89bef8ee26"),
       web3.toBigNumber("0xf89be269beef89be26f88c4df3826f89be26f89be26f89be1f137c4df137c4df")],
      [web3.toBigNumber("0x03047b932ff386fbe3b89be26f89a6fbbe26f89be389ba6f89be26fbe3b89be2"),
       web3.toBigNumber("0x6f89a6fbbe26f89be389ba6f89be26fbe3b89be26f89a6fbbe26f89be389ba6f"),
       web3.toBigNumber("0x89be26fbe3b89be26f899cdf1686f89be26f89be26f89be23137c4df137c4df1")],
      [web3.toBigNumber("0x070cceb778168f8e26e9be26f89bef8ee26f89be269beef89be26f8e26e9be26"),
       web3.toBigNumber("0xf89bef8ee26f89be269beef89be26f8e26e9be26f89bef8ee26f89be269beef8"),
       web3.toBigNumber("0x9be26f8e26e9be26f89bb5f13f8f89be26f89be26f89be26737c4df137c4df13")],
      [web3.toBigNumber("0x0d1ddbfdc83f989a6fbbe26f89be389ba6f89be26fbe3b89be26f89a6fbbe26f"),
       web3.toBigNumber("0x89be389ba6f89be26fbe3b89be26f89a6fbbe26f89be389ba6f89be26fbe3b89"),
       web3.toBigNumber("0xbe26f89a6fbbe26f89beff1360989be26f89be26f89be26ed7c4df137c4df137")],
      [web3.toBigNumber("0x1f377e075860b9bef8ee26f89be269beef89be26f8e26e9be26f89bef8ee26f8"),
       web3.toBigNumber("0x9be269beef89be26f8e26e9be26f89bef8ee26f89be269beef89be26f8e26e9b"),
       web3.toBigNumber("0xe26f89bef8ee26f89be38137e1b9be26f89be26f89be26fbfc4df137c4df137d")],
      [web3.toBigNumber("0x317dc20df8e1ebe389ba6f89be26fbe3b89be26f89a6fbbe26f89be389ba6f89"),
       web3.toBigNumber("0xbe26fbe3b89be26f89a6fbbe26f89be389ba6f89be26fbe3b89be26f89a6fbbe"),
       web3.toBigNumber("0x26f89be389ba6f89be26837c23ebe26f89be26f89be26f8e04df137c4df137c7")],
      [web3.toBigNumber("0x73c7461f09a33e269beef89be26f8e26e9be26f89bef8ee26f89be269beef89b"),
       web3.toBigNumber("0xe26f8e26e9be26f89bef8ee26f89be269beef89be26f8e26e9be26f89bef8ee2"),
       web3.toBigNumber("0x6f89be269beef89be26f87c4663e26f89be26f89be26f89a0df137c4df137c4d")],
      [web3.toBigNumber("0xd64dce311be7626fbe3b89be26f89a6fbbe26f89be389ba6f89be26fbe3b89be"),
       web3.toBigNumber("0x26f89a6fbbe26f89be389ba6f89be26fbe3b89be26f89a6fbbe26f89be389ba6"),
       web3.toBigNumber("0xf89be26fbe3b89be26f88c4cee626f89be26f89be26f89be1f137c4df137c4df")],
      [web3.toBigNumber("0x7edf5a733e2de6f8e26e9be26f89bef8ee26f89be269beef89be26f8e26e9be2"),
       web3.toBigNumber("0x6f89bef8ee26f89be269beef89be26f8e26e9be26f89bef8ee26f89be269beef"),
       web3.toBigNumber("0x89be26f8e26e9be26f899cddbae6f89be26f89be26f89be23137c4df137c4df0")],
    ];

    return Rule110.new(initial_state).then(function (instance) {
      return test_vectors.reduce(function (acc, vector) {
        return acc.then(function () {
          return instance.evolve().then(function (result) {
            assert(result.receipt.gasUsed < 50000, "Excessive gas used");
            assert.equal(result.logs.length, 1, "Invalid number of events produced");
            assert.equal(result.logs[0].event, "GameStateUpdated", "Invalid event produced");
            assert(web3.toBigNumber(result.logs[0].args.cells[0].toString()).equals(vector[0]), "Invalid state");
            assert(web3.toBigNumber(result.logs[0].args.cells[1].toString()).equals(vector[1]), "Invalid state");
            assert(web3.toBigNumber(result.logs[0].args.cells[2].toString()).equals(vector[2]), "Invalid state");
          });
        });
      }, Promise.resolve()).then(function () {
        return instance.state.call().then(function (state) {
          final_state = test_vectors[test_vectors.length - 1];

          assert(state[0].equals(final_state[0]), "Invalid final state");
          assert(state[1].equals(final_state[1]), "Invalid final state");
          assert(state[2].equals(final_state[2]), "Invalid final state");
        });
      });
    });
  });
})

contract('Rule110Factory', function(accounts) {
  it("should deploy correctly", function () {
    var initial_state = [web3.toBigNumber('0x9ce6a5b47848254f5852feca4c7592ace15a64732879bed96374d2a87a6177ab'),
                         web3.toBigNumber('0x79a9cdb4f50518d658a7afc1a25bdeef043f2f25a4fa7d5e7a48500b7cb5e083'),
                         web3.toBigNumber('0xfb34483988d00694326c60642e6b0bef686b5a757fb71e48623560e8d35b09d9')]
    var description = "foobar";

    return Rule110Factory.deployed().then(function (instance) {
      return instance.newRule110(initial_state[0], initial_state[1], initial_state[2], description).then(function (result) {
        assert(result.receipt.gasUsed < 300000, "Excessive gas used");
        assert.equal(result.logs.length, 1, "Invalid number of events produced");
        assert.equal(result.logs[0].event, "GameCreated", "Invalid event produced");
        assert.equal(web3.toUtf8(result.logs[0].args.description), description, "Invalid description");

        return Rule110.at(result.logs[0].args.game).then(function (instance) {
          return instance.state.call().then(function (state) {
            assert(state[0].equals(initial_state[0]), "Incorrect initial state");
            assert(state[1].equals(initial_state[1]), "Incorrect initial state");
            assert(state[2].equals(initial_state[2]), "Incorrect initial state");
          });
        });
      });
    })
  });
})
