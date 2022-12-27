#!/bin/bash

SLD_NAME=token.eth
DOMAIN_NAME=labs.token.eth
EMAIL=email.labs.token.eth
COIN=btc.labs.token.eth

ADDRESS_JSON=packages/contracts/deployments/goerli/AddressRecord.json
REGISTRY_ADDRESS=$(grep ENSRegistry $ADDRESS_JSON | sed 's/^ *"ENSRegistry": "\(0x[0-9a-zA-Z][0-9a-zA-Z]*\)",/\1/')

# Start the gateway
yarn start-goerli:gateway --data token.eth.json &

# Start resolving domain names
yarn start-goerli:client --registry $REGISTRY_ADDRESS $SLD_NAME
yarn start-goerli:client --registry $REGISTRY_ADDRESS $DOMAIN_NAME
yarn start-goerli:client --registry $REGISTRY_ADDRESS $EMAIL
yarn start-goerli:client --registry $REGISTRY_ADDRESS $COIN
