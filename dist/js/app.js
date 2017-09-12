/******************************************************************************/
/* Helper Functions */
/******************************************************************************/

function toBitString(bigNumber) {
  var s = bigNumber.toString(2);
  return "0".repeat(256-s.length) + s;
}

/******************************************************************************/
/* Model */
/******************************************************************************/

var Model = function (web3) {
  /* web3 interface */
  this.web3 = web3;
  this.FactoryContract = null;
  this.GameContract = null;
  this.defaultGasPrice = null;
  this.tipAddress = null;

  /* State */
  this.factoryInstance = null;
  this.gameInstance = null;
  this.gameList = [];
  this.activeGame = {address: null, description: null, cells: null};

  /* Blockchain event watchers */
  this.gameCreatedEvent = null;
  this.gameStateUpdatedEvent = null;

  /* Callbacks */
  this.connectedCallback = null;
  this.gameAddedCallback = null;
  this.gameStateUpdatedCallback = null;
};

Model.prototype = {
  init: function () {
    var self = this;

    $.getJSON('config.json', function (config) {
      var network_id = self.web3.version.network;

      self.GameContract = self.web3.eth.contract(config.contracts.Rule110);
      self.FactoryContract = self.web3.eth.contract(config.contracts.Rule110Factory);

      var isConnected = self.web3.isConnected();
      var hasWallet = web3.eth.defaultAccount != undefined;

      if (config.networks[network_id] == undefined) {
        console.log('[Model] Not deployed on network id ' + network_id);

        self.connectedCallback(network_id, null, isConnected, hasWallet);
      } else {
        console.log('[Model] Loading model for network id ' + network_id);

        self.tipAddress = config.networks[network_id].tipAddress;
        self.defaultGasPrice = web3.toBigNumber(web3.toWei(config.networks[network_id].defaultGasPrice, "gwei"));
        self.factoryInstance = self.FactoryContract.at(config.networks[network_id].factoryAddress);

        self.connectedCallback(network_id, self.factoryInstance.address, isConnected, hasWallet);

        self.gameCreatedEvent = self.factoryInstance.GameCreated(null, {fromBlock: 0, toBlock: 'latest'}, self.handleGameCreatedEvent.bind(self));
      }
    });
  },

  /* Blockchain event handlers */

  handleGameCreatedEvent: function (error, result) {
    if (error) {
      console.error(error);
    } else {
      var address = result.args.game;
      var description = this.web3.toUtf8(result.args.description);

      console.log("[Model] Game created at " + address + " with description " + description);

      var index = this.gameList.length;

      /* Save it to our list */
      this.gameList.push({address: address, description: description});

      /* Notify our callback */
      this.gameAddedCallback(index, address, description);
    }
  },

  handleGameStateUpdatedEvent: function (error, result) {
    if (error) {
      console.error(error);
    } else {
      var cells = result.args.cells.map(toBitString).join("");
      var txid = result.transactionHash;

      cells = cells.substring(512); // FIXME

      this.activeGame.cells.push(cells);

      console.log("[Model] Game state updated with cells " + cells + " from txid " + txid);

      /* Notify our callback */
      this.gameStateUpdatedCallback(cells, txid);
    }
  },

  /* Operations */

  selectGame: function (index, callback) {
    /* Look up by game by index */
    var address = this.gameList[index].address;
    var description = this.gameList[index].description;

    console.log("[Model] Selecting game at address " + address + ", with description " + description);

    /* Form contract instance */
    this.gameInstance = this.GameContract.at(address);

    /* Save active game information */
    this.activeGame.address = address;
    this.activeGame.description = description;
    this.activeGame.cells = [];

    /* Cancel existing watch handler */
    if (this.gameStateUpdatedEvent)
      this.gameStateUpdatedEvent.stopWatching();

    /* Register watch handler for game state events */
    this.gameStateUpdatedEvent = this.gameInstance.GameStateUpdated(null, {fromBlock: 0, toBlock: 'latest'}, this.handleGameStateUpdatedEvent.bind(this));

    /* Notify our callback */
    callback({address: address, description: description});
  },

  evolveGame: function (callback) {
    if (!this.gameInstance)
      callback("No game selected.", null);
    else
      this.gameInstance.evolve({gasPrice: this.defaultGasPrice}, callback);
  },

  createGame: function (cells, description, callback) {
    if (!this.factoryInstance)
      callback("Factory instance not found.", null);
    else
      this.factoryInstance.newRule110(...cells, description, {gasPrice: this.defaultGasPrice}, callback);
  },

  tip: function (amount, callback) {
    web3.eth.sendTransaction({to: this.tipAddress, value: web3.toWei(amount, 'ether'), gasPrice: this.defaultGasPrice}, callback);
  },
};

/******************************************************************************/
/* View */
/******************************************************************************/

var NETWORK_NAME = {
  1: "Mainnet",
  3: "Ropsten",
  4: "Rinkeby",
  42: "Kovan",
};

var NETWORK_BLOCK_EXPLORER = {
  1: "https://etherscan.io",
  3: "https://ropsten.etherscan.io",
  4: "https://rinkeby.etherscan.io",
  42: "https://kovan.etherscan.io",
};

var View = function () {
  /* State */
  this.gameSelectedElement = null;
  this.networkState = {id: null, factoryAddress: null, isConnected: false, hasWallet: false};

  /* Callbacks */
  this.buttonGameSelectCallback = null;
  this.buttonEvolveCallback = null;
  this.buttonCreateCallback = null;
  this.buttonTipCallback = null;
};

View.prototype = {
  init: function () {
    /* Bind buttons */
    $('#evolve-button').click(this.handleButtonEvolve.bind(this));
    $('#create-button').click(this.handleButtonCreate.bind(this));
    $('#tip-button').click(this.handleButtonTip.bind(this));

    /* Bind create inputs */
    $('#create-initial-cells-1').on('input', this.handleCreateInputsChange.bind(this));
    $('#create-initial-cells-2').on('input', this.handleCreateInputsChange.bind(this));
    $('#create-initial-cells-3').on('input', this.handleCreateInputsChange.bind(this));

    /* Update create initial board */
    this.handleCreateInputsChange();
  },

  /* Event update handlers */

  handleConnectedEvent: function (networkId, factoryAddress, isConnected, hasWallet) {
    this.networkState.id = networkId;
    this.networkState.factoryAddress = factoryAddress;
    this.networkState.isConnected = isConnected;
    this.networkState.hasWallet = hasWallet;

    /* Update network name in status bar */
    var networkName = NETWORK_NAME[networkId] || "Unknown";
    $('#status-bar-network').append($('<b></b>').addClass('text-info').text(networkName));

    /* Update connected status in status bar */
    if (isConnected)
      $('#status-bar-connected').append($('<b></b>').addClass('text-info').text("True"));
    else
      $('#status-bar-connected').append($('<b></b>').addClass('text-danger').text("False"));

    /* Update factory address in status bar */
    if (factoryAddress) {
      $('#status-bar-game-factory').append($('<b></b>')
                                           .addClass('text-info')
                                           .append(this.formatAddressLink(
                                              factoryAddress,
                                              factoryAddress.substring(0, 6) + "...",
                                              true)));
    } else {
      $('#status-bar-game-factory').append($('<b></b>').addClass('text-danger').text("Not Deployed"));
      this.showResultModal(false, "Unsupported network", "This DApp has not been deployed to this network.<br>Please try mainnet or a testnet network.");
    }

    /* Update wallet status in status bar */
    if (hasWallet) {
      $('#status-bar-wallet').append($('<b></b>').addClass('text-info').text("True"));
    } else {
      $('#status-bar-wallet').append($('<b></b>').addClass('text-danger').text("False"));
    }

    /* Enable tip button if connected and user has wallet */
    if (isConnected && hasWallet)
      $('#tip-button').prop('disabled', false);

    /* Enable create button if connected, deployed, and user has wallet */
    if (isConnected && factoryAddress && hasWallet)
      $('#create-button').prop('disabled', false);
  },

  handleGameAddedEvent: function (index, address, description) {
    console.log("[View] Adding game with address " + address + " and description " + description);

    /* Create row for game list */
    var elem = $('<tr></tr>')
                .append($('<td></td>')
                  .addClass('mono')
                  .append($('<a />')
                    .attr('href', '#')
                    .text(address)
                    .click(this.handleButtonGameSelect.bind(this, index))))
                .append($('<td></td>')
                    .text(description));

    /* Add to game list */
    $('#game-list').find("tbody").first().append(elem);

    /* Select first game, if a game hasn't been selected yet */
    if (this.gameSelectedElement == null)
      this.handleButtonGameSelect(0);
  },

  handleGameStateUpdatedEvent: function (cells, txid) {
    console.log("[View] Updating game cells");

    /* Replace bit strings with spaces / unicode blocks */
    cells = cells.replace(/0/g, " ");
    cells = cells.replace(/1/g, "█");

    /* Add row to game board */
    $('#game .board').append($('<span></span>')
                              .html(this.formatTxidLink(txid, cells)))
                     .append($('<br/>'));
  },

  /* Button handlers */

  handleButtonGameSelect: function (index) {
    console.log("[View] Game select button clicked, index " + index);

    /* Disable evolve button until game is loaded */
    $('#evolve-button').prop('disabled', true);

    /* Clear game address */
    $('#game-address').text("");

    /* Clear game description */
    $('#game-description').text("");

    /* Clear game board */
    $('#game .board').empty();

    var self = this;

    this.buttonGameSelectCallback(index, function (result) {
      console.log("[View] Game select, index " + index);

      /* Update active element in game list */
      if (self.gameSelectedElement)
        self.gameSelectedElement.removeClass('table-info');

      self.gameSelectedElement = $('#game-list').find("tbody")
                                                .find("tr")
                                                .eq(index)
                                                .addClass('table-info');

      /* Enable evolve button if connected and user has wallet */
      if (self.networkState.isConnected && self.networkState.hasWallet)
        $('#evolve-button').prop('disabled', false);

      /* Update game address */
      $('#game-address').append(self.formatAddressLink(result.address, result.address, true));

      /* Update game description */
      $('#game-description').text(result.description);
    });
  },

  handleButtonEvolve: function () {
    console.log("[View] Evolve button clicked");

    var self = this;

    this.buttonEvolveCallback(function (error, txid) {
      if (error) {
        console.log("[View] Evolve failed");
        console.error(error);

        var msg = $("<span></span>").text(error.message.split('\n')[0]);
        self.showResultModal(false, "Evolve failed", msg);
      } else {
        console.log("[View] Evolve succeeded, txid " + txid);

        var msg = $("<span></span>").text("Transaction ID: ")
                                    .append(self.formatTxidLink(txid, txid, true));
        self.showResultModal(true, "Evolve succeeded", msg);
      }
    });
  },

  handleButtonCreate: function () {
    console.log("[View] Create button clicked");

    var initialCells1 = $('#create-initial-cells-1').val();
    var initialCells2 = $('#create-initial-cells-2').val();
    var initialCells3 = $('#create-initial-cells-3').val();
    var description = $('#create-description').val();

    /* Validate cells are a number */
    try {
      var cells = [web3.toBigNumber(initialCells1),
                   web3.toBigNumber(initialCells2),
                   web3.toBigNumber(initialCells3)];
    } catch (err) {
      this.showResultModal(false, "Error", "Game initial cells is not a number.");
      return;
    }

    /* Validate description is 32 chars or less */
    if (description.length > 32) {
      this.showResultModal(false, "Error", "Game description is too long: got " + description.length + " characters, max is 32.");
      return;
    }

    var self = this;

    this.buttonCreateCallback(cells, description, function (error, txid) {
      if (error) {
        console.log("[View] Create failed");
        console.error(error);

        var msg = $("<span></span>").text(error.message.split('\n')[0]);
        self.showResultModal(false, "Create game failed", msg);
      } else {
        console.log("[View] Create succeeded, txid " + txid);

        /* FIXME get new game address */

        var msg = $("<span></span>").text("Transaction ID: ")
                                    .append(self.formatTxidLink(txid, txid, true));
        self.showResultModal(true, "Create game succeeded", msg);
      }
    });
  },

  handleButtonTip: function () {
    console.log("[View] Tip button clicked");

    var amount = $('#tip-amount').val();

    /* Validate amount is a number */
    if (isNaN(amount)) {
      this.showResultModal(false, "Error", "Tip amount is not a number.");
      return;
    }

    var self = this;

    this.buttonTipCallback(amount, function (error, txid) {
      if (error) {
        console.log("[View] Tip failed");
        console.error(error);

        var msg = $("<span></span>").text(error.message.split('\n')[0]);
        self.showResultModal(false, "Tip failed", msg);
      } else {
        console.log("[View] Tip succeeded, txid " + txid);

        var msg = $("<span></span>").text("Transaction ID: ")
                                    .append(self.formatTxidLink(txid, txid, true));
        self.showResultModal(true, "Tip succeeded", msg);
      }
    });
  },

  /* From input handlers */

  handleCreateInputsChange: function () {
    var initialCells1 = $('#create-initial-cells-1').val();
    var initialCells2 = $('#create-initial-cells-2').val();
    var initialCells3 = $('#create-initial-cells-3').val();

    try {
      cells = "";
      cells += toBitString(web3.toBigNumber(initialCells1));
      cells += toBitString(web3.toBigNumber(initialCells2));
      cells += toBitString(web3.toBigNumber(initialCells3));

      cells = cells.substring(512); // FIXME

      /* Replace bit strings with spaces / unicode blocks */
      cells = cells.replace(/0/g, " ");
      cells = cells.replace(/1/g, "■");

      /* Add to game create board */
      $('#game-create .board').html($('<span></span>')
                                     .text(cells));
    } catch (err) { }
  },

  /* Success/failure Modal */

  showResultModal: function (success, heading, body) {
    if (success) {
      $('#result-modal .modal-title').text(heading)
                                     .removeClass('text-danger')
                                     .addClass('text-info');
    } else {
      $('#result-modal .modal-title').text(heading)
                                     .removeClass('text-info')
                                     .addClass('text-danger');
    }

    $('#result-modal .modal-body').html(body);

    $('#result-modal').modal();
  },

  /* Helper functions to format block explorer links */

  formatTxidLink: function (txid, text, addIcon) {
    var baseUrl = NETWORK_BLOCK_EXPLORER[this.networkState.id];

    if (baseUrl) {
      var elem = $('<a></a>')
                 .attr('href', baseUrl + "/tx/" + txid)
                 .attr('target', '_blank')
                 .text(text);

      if (addIcon)
        elem = elem.append($('<i></i>').addClass('icon-link-ext'));

      return elem;
    } else {
      return text;
    }
  },

  formatAddressLink: function (address, text, addIcon) {
    var baseUrl = NETWORK_BLOCK_EXPLORER[this.networkState.id];

    if (baseUrl) {
      var elem = $('<a></a>')
                 .attr('href', baseUrl + "/address/" + address)
                 .attr('target', '_blank')
                 .text(text);

      if (addIcon)
        elem = elem.append($('<i></i>').addClass('icon-link-ext'));

      return elem;
    } else {
      return text;
    }
  },
};

/******************************************************************************/
/* Controller */
/******************************************************************************/

var Controller = function (model, view) {
  this.model = model;
  this.view = view;
};

Controller.prototype = {
  init: function () {
    /* Bind model -> view */
    this.model.connectedCallback = this.view.handleConnectedEvent.bind(this.view);
    this.model.gameAddedCallback = this.view.handleGameAddedEvent.bind(this.view);
    this.model.gameStateUpdatedCallback = this.view.handleGameStateUpdatedEvent.bind(this.view);

    /* Bind view -> model */
    this.view.buttonGameSelectCallback = this.model.selectGame.bind(this.model);
    this.view.buttonEvolveCallback = this.model.evolveGame.bind(this.model);
    this.view.buttonCreateCallback = this.model.createGame.bind(this.model);
    this.view.buttonTipCallback = this.model.tip.bind(this.model);

    /* Initialize view */
    this.view.init();

    /* Initialize model */
    this.model.init();
  },
};

/******************************************************************************/
/* Top-level */
/******************************************************************************/

App = {
  model: null,
  view: null,
  controller: null,

  init: function () {
    if (typeof web3 !== 'undefined') {
      window.web3 = new Web3(web3.currentProvider);
    } else {
      window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    }

    App.model = new Model(window.web3);
    App.view = new View();
    App.controller = new Controller(App.model, App.view);

    App.controller.init();
  },
};

$(function () {
  $(window).ready(function () {
    App.init();
  });
});
