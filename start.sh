#!/bin/sh

# Start testrpc
testrpc -i 1234 --account="0x9933f4c423eebf2ecd1320150a901c1727991a93ce9619549352c8b4377aef26,100000000000000000000" --account="0x5e33dcd69f9501cd02432ac5c9fab48e1a53357c3b7e97e59faf2c088a94b8df,1000000000000000000" -u 0 &
TESTRPC_PID=$!

sleep 1

# Run migration
truffle migrate --network local

function cleanup() {
    echo "Stopping testrpc..."
    kill $TESTRPC_PID
}
trap cleanup 2

# Start webserver
browser-sync start -s docs -f docs
