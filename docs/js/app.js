/*
 * evolve110
 * https://github.com/vsergeev/evolve110
 *
 * Copyright (c) 2017 Ivan (Vanya) A. Sergeev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/******************************************************************************/
/* Helper Functions */
/******************************************************************************/

function toBitString(size, bigNumber) {
  var s = bigNumber.toString(2);
  if (s.length < size) {
    s = "0".repeat(size-s.length) + s;
  } else if (s.length > size) {
    s = s.substring(s.length-size);
  }
  return s;
}

/******************************************************************************/
/* Model */
/******************************************************************************/

var Model = function (web3) {
  /* web3 interface */
  this.web3 = web3;
  this.FactoryContract = null;
  this.GameContract = null;

  /* Configuration and network status */
  this.config = {defaultGasPrice: null, tipAddress: null, defaultTipAmount: null, factoryAddress: null};
  this.networkStatus = {factoryVersion: null, networkId: null, hasWallet: false};

  /* State */
  this.factoryInstance = null;
  this.gameInstance = null;
  this.gameList = [];
  this.activeGame = {address: null, size: null, description: null, cells: null};

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

    /* Look up network id */
    self.web3.version.getNetwork(function (error, result) {
      if (error) {
        Logger.log('[Model] Error determining network version');
        Logger.error(error);
      } else {
        self.networkStatus.networkId = result;

        /* Look up wallet accounts */
        self.web3.eth.getAccounts(function (error, result) {
          if (error) {
            Logger.log('[Model] Error determining accounts');
            Logger.error(error);
          } else {
            self.networkStatus.hasWallet = result.length > 0;

            /* Set a default account, if it's not set (e.g. Mist) */
            if (self.networkStatus.hasWallet && self.web3.eth.defaultAccount == undefined)
              self.web3.eth.defaultAccount = result[0];

            /* Look up config */
            $.getJSON('config.json', function (config) {
              /* Create contract classes */
              self.GameContract = self.web3.eth.contract(config.contracts.Rule110);
              self.FactoryContract = self.web3.eth.contract(config.contracts.Rule110Factory);

              var networkId = self.networkStatus.networkId;

              /* Check if this network is supported */
              if (!config.networks[networkId] || !config.networks[networkId].factoryAddress) {
                Logger.log('[Model] Not deployed on network id ' + networkId);
              } else {
                Logger.log('[Model] Loading model for network id ' + networkId);

                /* Look up configuration constants */
                self.config.tipAddress = config.networks[networkId].tipAddress;
                self.config.defaultGasPrice = web3.toBigNumber(web3.toWei(config.networks[networkId].defaultGasPrice, "gwei"));
                self.config.factoryAddress = config.networks[networkId].factoryAddress;
                self.config.factoryBlockNumber = config.networks[networkId].factoryBlockNumber;
                self.config.defaultTipAmount = config.defaultTipAmount;
                self.config.evolveGasLimit = config.evolveGasLimit;
                self.config.createGasLimit = config.createGasLimit;
                self.config.tipGasLimit = config.tipGasLimit;

                /* Create factory instance */
                self.factoryInstance = self.FactoryContract.at(self.config.factoryAddress);
              }
            }).done(function () {
              if (!self.factoryInstance) {
                self.connectedCallback(self.config, self.networkStatus);
                return;
              }

              /* Look up factory version */
              self.factoryInstance.VERSION(function (error, version) {
                if (error) {
                  Logger.error(error);

                  self.connectedCallback(self.config, self.networkStatus);
                } else {
                  self.networkStatus.factoryVersion = version;

                  Logger.log("[Model] Configuration:");
                  Logger.log(self.config);

                  Logger.log("[Model] Network Status:");
                  Logger.log(self.networkStatus);

                  self.connectedCallback(self.config, self.networkStatus);

                  /* Create event watcher to get game list */
                  if (self.factoryInstance)
                    self.gameCreatedEvent = self.factoryInstance.GameCreated(null, {fromBlock: self.config.factoryBlockNumber, toBlock: 'latest'},
                                                                             self.handleGameCreatedEvent.bind(self));
                }
              });
            });
          }
        });
      }
    });
  },

  /* Blockchain event handlers */

  handleGameCreatedEvent: function (error, result) {
    if (error) {
      Logger.error(error);
    } else {
      var address = result.args.game;
      var size = result.args.size;
      var description = web3.toUtf8(result.args.description);

      Logger.log("[Model] Game created at " + address + ", with size " + size + ", and description " + description);

      var index = this.gameList.length;

      /* Save it to our list */
      this.gameList.push({address: address, size: size, description: description, blockNumber: result.blockNumber});

      /* Notify our callback */
      this.gameAddedCallback(index, address, size, description, result.transactionHash);
    }
  },

  handleGameStateUpdatedEvent: function (error, result) {
    if (error) {
      Logger.error(error);
    } else {
      var cells = toBitString(this.activeGame.size, result.args.cells);
      var txid = result.transactionHash;

      this.activeGame.cells.push(cells);
      var numEvolutions = this.activeGame.cells.length-1;

      Logger.log("[Model] Game state updated with cells " + cells + " from txid " + txid);

      /* Notify our callback */
      this.gameStateUpdatedCallback(cells, numEvolutions, txid);
    }
  },

  /* Operations */

  selectGame: function (index, callback) {
    /* Look up by game by index */
    var address = this.gameList[index].address;
    var size = this.gameList[index].size;
    var description = this.gameList[index].description;
    var blockNumber = this.gameList[index].blockNumber;

    Logger.log("[Model] Selecting game at address " + address + ", with size " + size + ", and description " + description);

    /* Form contract instance */
    this.gameInstance = this.GameContract.at(address);

    /* Save active game information */
    this.activeGame.address = address;
    this.activeGame.description = description;
    this.activeGame.size = size;
    this.activeGame.cells = [];

    /* Cancel existing watch handler */
    var cancelFunction = this.gameStateUpdatedEvent ? this.gameStateUpdatedEvent.stopWatching.bind(this.gameStateUpdatedEvent)
                                                    : function (f) { f(); };

    var self = this;

    cancelFunction(function (error, result) {
      if (error) {
        callback(error, null)
      } else {
        /* Register watch handler for game state events */
        self.gameStateUpdatedEvent = self.gameInstance.GameStateUpdated(null, {fromBlock: blockNumber, toBlock: 'latest'},
                                                                        self.handleGameStateUpdatedEvent.bind(self));

        /* Notify our callback */
        callback(null, {address: address, size: size, description: description});
      }
    });
  },

  evolveGame: function (callback) {
    if (!this.gameInstance)
      callback("No game selected.", null);
    else
      this.gameInstance.evolve({gas: this.config.evolveGasLimit, gasPrice: this.config.defaultGasPrice}, callback);
  },

  createGame: function (size, initialCells, description, callback) {
    if (!this.factoryInstance)
      callback("Factory instance not found.", null);
    else
      this.factoryInstance.newRule110(size, initialCells, description, {gas: this.config.createGasLimit, gasPrice: this.config.defaultGasPrice}, callback);
  },

  tip: function (amount, callback) {
    this.web3.eth.sendTransaction({to: this.config.tipAddress, value: web3.toWei(amount, 'ether'), gas: this.config.tipGasLimit, gasPrice: this.config.defaultGasPrice}, callback);
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
  /* Configuration and network status */
  this.config = {};
  this.networkStatus = {};

  /* State */
  this.gameListHighlightedElement = null;
  this.highlightTxids = {};

  /* Callbacks */
  this.buttonGameSelectCallback = null;
  this.buttonEvolveCallback = null;
  this.buttonCreateCallback = null;
  this.buttonTipCallback = null;
};

View.prototype = {
  init: function () {
    /* Bind buttons to handlers */
    $('#evolve-button').click(this.handleButtonEvolve.bind(this));
    $('#create-button').click(this.handleButtonCreate.bind(this));
    $('#tip-button').click(this.handleButtonTip.bind(this));

    /* Bind create inputs to handler */
    $('#create-initial-cells').on('input', this.handleCreateInputsChange.bind(this));
    $('#create-size').on('input', this.handleCreateInputsChange.bind(this));

    /* Generate random 256 initial cells for create game */
    var s = "0x";
    for (var i = 0; i < 64; i++)
        s = s + Math.floor(16*Math.random()).toString("16");
    $('#create-initial-cells').val(s);
    $('#create-size').val("256");
    $('#create-description').val("random");

    /* Update create game initial board */
    this.handleCreateInputsChange();
  },

  /* Event update handlers */

  handleConnectedEvent: function (config, networkStatus) {
    /* Store configuration and network status */
    this.config = config;
    this.networkStatus = networkStatus;

    /* Update network name in status bar */
    var networkName = NETWORK_NAME[networkStatus.networkId] || ("Unknown (" + networkStatus.networkId + ")");
    $('#status-bar-network').append($('<b></b>').addClass('text-info').text(networkName));

    /* Update version in status bar */
    if (networkStatus.factoryVersion) {
      $('#status-bar-version').append($('<b></b>')
                                .addClass('text-info')
                                .append(this.formatAddressLink(
                                   config.factoryAddress,
                                   "v" + networkStatus.factoryVersion,
                                   true)));
    } else {
      $('#status-bar-version').append($('<b></b>').addClass('text-danger').text("Not Deployed"));
      this.showResultModal(false, "Unsupported network", "This Ðapp has not been deployed to this network.<br><br>Please try mainnet or a testnet network.");
    }

    /* Update wallet status in status bar */
    if (networkStatus.hasWallet)
      $('#status-bar-wallet').append($('<b></b>').addClass('text-info').text("True"));
    else
      $('#status-bar-wallet').append($('<b></b>').addClass('text-danger').text("False"));

    /* Update tip amount with default */
    $('#tip-amount').val(config.defaultTipAmount);

    /* Enable tip button if connected and user has wallet */
    if (networkStatus.hasWallet) {
      $('#tip-button').prop('disabled', false);
    } else {
      $('#tip-button').prop('data-toggle', 'tooltip')
                      .prop('title', 'Please enable a wallet.');
    }

    /* Enable create button if deployed, and user has wallet */
    if (networkStatus.factoryVersion && networkStatus.hasWallet) {
      $('#create-button').prop('disabled', false);
    } else if (!networkStatus.factoryVersion) {
      $('#create-button').prop('data-toggle', 'tooltip')
                         .prop('title', 'Unsupported network.');
    } else if (!networkStatus.hasWallet) {
      $('#create-button').prop('data-toggle', 'tooltip')
                         .prop('title', 'Please enable a wallet.');
    }

    /* Add tooltip to disabled evolve button if not deployed */
    if (!networkStatus.factoryVersion) {
      $('#evolve-button').prop('data-toggle', 'tooltip')
                         .prop('title', 'Unsupported network.');
    }
  },

  handleGameAddedEvent: function (index, address, size, description, txid) {
    Logger.log("[View] Adding game with address " + address + ", size " + size + ", and description " + description);

    /* Create row for game list */
    var elem = $('<tr></tr>')
                .click(this.handleButtonGameSelect.bind(this, index, true))
                .toggleClass('table-success', Boolean(this.highlightTxids[txid]))
                .append($('<td></td>')
                          .addClass('mono')
                          .text(address))
                .append($('<td></td>')
                          .text(size))
                .append($('<td></td>')
                          .text(description));

    /* Add to game list */
    $('#game-list').find("tbody").first().append(elem);

    /* Select first game, if a game hasn't been selected yet */
    if (this.gameListHighlightedElement == null)
      this.handleButtonGameSelect(0, false);
  },

  handleGameStateUpdatedEvent: function (cells, numEvolutions, txid) {
    Logger.log("[View] Updating game cells");

    /* Replace bit strings with spaces / unicode blocks */
    cells = cells.replace(/0/g, " ");
    cells = cells.replace(/1/g, "█");

    /* Add row to game board */
    $('#game .board').append($('<span></span>')
                              .html(this.formatTxidLink(txid, cells))
                              .toggleClass('highlight', Boolean(this.highlightTxids[txid])))
                     .append($('<br/>'));

    /* Update number of evolutions */
    $('#game-evolutions').text(numEvolutions);
  },

  /* Button handlers */

  handleButtonGameSelect: function (index, scroll) {
    Logger.log("[View] Game select button clicked, index " + index);

    /* Disable evolve button until game is loaded */
    $('#evolve-button').prop('disabled', true);

    /* Clear game information */
    $('#game-address').text("");
    $('#game-size').text("");
    $('#game-description').text("");
    $('#game-evolutions').text("");

    /* Clear game board */
    $('#game .board').empty();

    var self = this;

    this.buttonGameSelectCallback(index, function (error, result) {
      if (error) {
        Logger.log("[View] Game select failed");
        Logger.error(error);

        var msg = $("<span></span>").text(error.message.split('\n')[0]);
        self.showResultModal(false, "Game select failed", msg);
      } else {
        Logger.log("[View] Game select, index " + index);

        /* Update active element in game list */
        if (self.gameListHighlightedElement)
          self.gameListHighlightedElement.removeClass('table-info');

        self.gameListHighlightedElement = $('#game-list').find("tbody")
                                                         .find("tr")
                                                         .eq(index)
                                                         .addClass('table-info');

        /* Enable evolve button if connected and user has wallet */
        if (self.networkStatus.hasWallet) {
          $('#evolve-button').prop('disabled', false);
        } else {
          $('#evolve-button').prop('data-toggle', 'tooltip')
                             .prop('title', 'Please enable a wallet.');
        }

        /* Update game information */
        $('#game-address').append(self.formatAddressLink(result.address, result.address, true));
        $('#game-size').text(result.size);
        $('#game-description').text(result.description);

        /* Scroll up to the game */
        if (scroll)
          $("html, body").animate({ scrollTop: $('#game').prev().offset().top - $('#status-bar').height() }, 500);
      }
    });
  },

  handleButtonEvolve: function () {
    Logger.log("[View] Evolve button clicked");

    var self = this;

    this.buttonEvolveCallback(function (error, txid) {
      if (error) {
        Logger.log("[View] Evolve failed");
        Logger.error(error);

        var msg = $("<span></span>").text(error.message.split('\n')[0]);
        self.showResultModal(false, "Evolve failed", msg);
      } else {
        Logger.log("[View] Evolve succeeded, txid " + txid);

        self.highlightTxids[txid] = true;

        var msg = $("<span></span>").text("Transaction ID: ")
                    .append($("<span></span>").addClass("mono")
                              .append(self.formatTxidLink(txid, txid, true)))
                    .append("<br><br>New cells will be appear in green on the game board, once the transaction has been mined.");
        self.showResultModal(true, "Evolve succeeded", msg);
      }
    });
  },

  handleButtonCreate: function () {
    Logger.log("[View] Create button clicked");

    /* Look up form inputs */
    var initialCells = $('#create-initial-cells').val();
    var size = $('#create-size').val();
    var description = $('#create-description').val();

    /* Validate cells are a number */
    try {
      initialCells = web3.toBigNumber(initialCells);
    } catch (err) {
      this.showResultModal(false, "Error", "Invalid game initial cells: initial cells must be a number.");
      return;
    }

    /* Validate size is a number */
    size = Number(size);
    if (isNaN(size)) {
      this.showResultModal(false, "Error", "Invalid game size: game size must be a number.");
      return;
    }

    /* Validate number of cells is in range */
    if (size < 3 || size > 256) {
      this.showResultModal(false, "Error", "Invalid game size: size is out of range, got " + size + ", min is 3, max is 256.");
      return;
    }

    /* Validate initial cells are in range */
    if (initialCells.greaterThan(web3.toBigNumber(2).pow(size).minus(1))) {
      this.showResultModal(false, "Error", "Invalid game initial cells: greater than game size.");
      return;
    }

    /* Validate description is 32 chars or less */
    if (description.length > 32) {
      this.showResultModal(false, "Error", "Invalid game description: length is too long, got " + description.length + " characters, max is 32.");
      return;
    }

    var self = this;

    this.buttonCreateCallback(size, initialCells, description, function (error, txid) {
      if (error) {
        Logger.log("[View] Create failed");
        Logger.error(error);

        var msg = $("<span></span>").text(error.message.split('\n')[0]);
        self.showResultModal(false, "Create game failed", msg);
      } else {
        Logger.log("[View] Create succeeded, txid " + txid);

        self.highlightTxids[txid] = true;

        var msg = $("<span></span>").text("Transaction ID: ")
                    .append($("<span></span>").addClass("mono")
                              .append(self.formatTxidLink(txid, txid, true)))
                    .append("<br><br>New game will appear in green on the game list, once the transaction has been mined.");
        self.showResultModal(true, "Create game succeeded", msg);
      }
    });
  },

  handleButtonTip: function () {
    Logger.log("[View] Tip button clicked");

    /* Look up form input */
    var amount = $('#tip-amount').val();

    /* Validate amount is a number */
    if (isNaN(amount)) {
      this.showResultModal(false, "Error", "Invalid tip amount: tip amount must be a number.");
      return;
    }

    var self = this;

    this.buttonTipCallback(amount, function (error, txid) {
      if (error) {
        Logger.log("[View] Tip failed");
        Logger.error(error);

        var msg = $("<span></span>").text(error.message.split('\n')[0]);
        self.showResultModal(false, "Tip failed", msg);
      } else {
        Logger.log("[View] Tip succeeded, txid " + txid);

        var msg = $("<span></span>").text("Transaction ID: ")
                    .append($("<span></span>").addClass("mono")
                              .append(self.formatTxidLink(txid, txid, true)))
                    .append("<br><br>Thank you!");
        self.showResultModal(true, "Tip succeeded", msg);
      }
    });
  },

  /* From input handlers */

  handleCreateInputsChange: function () {
    /* Look up form inputs */
    var initialCells = $('#create-initial-cells').val();
    var size = $('#create-size').val();

    try {
      /* Clamp size between 3 to 256 */
      size = Math.max(Math.min(Number(size), 256), 3);

      /* Convert cells to big number */
      initialCells = web3.toBigNumber(initialCells);

      /* Convert initial cells from number to bit string */
      initialCells = toBitString(size, initialCells);

      /* Replace bit strings with spaces / unicode blocks */
      initialCells = initialCells.replace(/0/g, " ");
      initialCells = initialCells.replace(/1/g, "█");

      /* Update game create board */
      $('#game-create .board').html($('<span></span>').text(initialCells));
    } catch (err) {
    }
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

  formatTxidLink: function (txid, text, showLinkIcon) {
    var baseUrl = NETWORK_BLOCK_EXPLORER[this.networkStatus.networkId];

    if (baseUrl) {
      var elem = $('<a></a>')
                 .attr('href', baseUrl + "/tx/" + txid)
                 .attr('target', '_blank')
                 .text(text);

      if (showLinkIcon)
        elem = elem.append($('<i></i>').addClass('icon-link-ext'));

      return elem;
    } else {
      return text;
    }
  },

  formatAddressLink: function (address, text, showLinkIcon) {
    var baseUrl = NETWORK_BLOCK_EXPLORER[this.networkStatus.networkId];

    if (baseUrl) {
      var elem = $('<a></a>')
                 .attr('href', baseUrl + "/address/" + address)
                 .attr('target', '_blank')
                 .text(text);

      if (showLinkIcon)
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

Logger = {
  enabled: false,

  log: function (s) {
    if (Logger.enabled && console)
      console.log(s);
  },

  error: function (s) {
    console.error(s);
  },
};

App = {
  model: null,
  view: null,
  controller: null,

  init: function () {
    if (typeof web3 !== 'undefined') {
      window.web3 = new Web3(web3.currentProvider);
    } else {
      var provider = new ZeroClientProvider({getAccounts: function (cb) { cb(null, []); }, rpcUrl: 'https://kovan.infura.io/rdkuEWbeKAjSR9jZ6P1h'});
      window.web3 = new Web3(provider);
    }

    App.model = new Model(window.web3);
    App.view = new View();
    App.controller = new Controller(App.model, App.view);

    App.controller.init();
  },
};

window.onload = function () {
  App.init();
}
