# evolve110 [![GitHub release](https://img.shields.io/github/release/vsergeev/evolve110.svg?maxAge=7200)](https://github.com/vsergeev/evolve110) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/vsergeev/evolve110/blob/master/LICENSE)

[Rule 110](https://en.wikipedia.org/wiki/Rule_110) is one of the simplest Turing-complete cellular automatons. This implementation lives on the Ethereum blockchain.

Visit the live Ðapp: https://vsergeev.github.io/evolve110

Visit the live Ðapp via Swarm: bzz://evolve110.eth

Use a browser wallet like [MetaMask](https://metamask.io/), [Parity](https://parity.io/parity.html), or [Mist](https://github.com/ethereum/mist) to evolve an existing game or to create a new one.

## Prerequisites

For development, evolve110 uses the [Truffle](http://truffleframework.com/) framework, [testrpc](https://github.com/ethereumjs/testrpc) Ethereum node, and [browser-sync](https://browsersync.io/) web server.

```
npm install -g truffle ethereumjs-testrpc browser-sync
```

## Unit Testing

Start `testrpc`, and then run `truffle test`.

```
testrpc
```

```
truffle test
```

## Running Locally

Use the `start.sh` script to automatically start `testrpc`, run migrations, and start the `browser-sync` web server.

```
./start.sh
```

Visit the Ðapp locally: http://localhost:3000

## File Structure

* [`contracts/`](contracts/) - Contracts
    * [`Rule110.sol`](contracts/Rule110.sol) - Project contract
    * [`Migrations.sol`](contracts/Migrations.sol) - Truffle migrations contract
* [`test/`](test/) - Contract unit tests
    * [`rule110.js`](test/rule110.js) - Project unit test
* [`migrations/`](migrations/) - Truffle migrations
    * [`1_initial_migration.js`](migrations/1_initial_migration.js) - Migrations contract deployment
    * [`2_deploy_contracts.js`](migrations/2_deploy_contracts.js) - Game factory contract deployment
    * [`3_create_games.js`](migrations/3_create_games.js) - Initial games creation
    * [`4_write_config.js`](migrations/4_write_config.js) - Configuration file creation
* [`build/`](build/) - Compiled contracts and deployment tracking
* [`docs/`](docs/) - Website
    * [`css/`](docs/css)
    * [`js/`](docs/js)
        * [`app.js`](docs/js/app.js) - Website application
    * [`index.html`](docs/index.html) - Website layout
    * [`config.json`](docs/config.json) - Deployed addresses and configuration
* [`py/`](py/) - Python model
    * [`rule110.py`](py/rule110.py) - Python implementation
* [`truffle.js`](truffle.js) - Truffle configuration
* [`start.sh`](start.sh) - Local run script
* [`LICENSE`](LICENSE) - MIT License
* [`README.md`](README.md) - This README

## LICENSE

evolve110 is MIT licensed. See the included [LICENSE](LICENSE) file.

