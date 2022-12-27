# ENS Offchain Resolver

![CI](https://github.com/ensdomains/offchain-resolver/actions/workflows/main.yml/badge.svg)

This repository contains smart contracts and a node.js gateway server that together allow hosting ENS names offchain using [EIP 3668](https://eips.ethereum.org/EIPS/eip-3668) and [ENSIP 10](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution).

## Overview

ENS resolution requests to the resolver implemented in this repository are responded to with a directive to query a gateway server for the answer. The gateway server generates and signs a response, which is sent back to the original resolver for decoding and verification. Full details of this request flow can be found in EIP 3668.

All of this happens transparently in supported clients (such as ethers.js with the ethers-ccip-read-provider plugin, or future versions of ethers.js which will have this functionality built-in).

## [Gateway Server](packages/gateway)

The gateway server implements CCIP Read (EIP 3668), and answers requests by looking up the names in a backing store. By default this is a JSON file, but the backend is pluggable and alternate backends can be provided by implementing a simple interface. Once a record is retrieved, it is signed using a user-provided key to assert its validity, and both record and signature are returned to the caller so they can be provided to the contract that initiated the request.

## [Contracts](packages/contracts)

The smart contract provides a resolver stub that implement CCIP Read (EIP 3668) and ENS wildcard resolution (ENSIP 10). When queried for a name, it directs the client to query the gateway server. When called back with the gateway server response, the resolver verifies the signature was produced by an authorised signer, and returns the response to the client.

## Trying it out

### Prerequisite: generate private keys

Start by generating an Ethereum private key; this will be used as a signing key for any messages signed by your gateway service. You can use a variety of tools for this; for instance, this Python snippet will generate one for you:

```
python3 -c "import os; import binascii; print('0x%s' % binascii.hexlify(os.urandom(32)).decode('utf-8'))"
```

### Prerequisite: set environment variables

Please set the signing key and alchemy api token in `.env` file:

```bash
cp ./.env.example ./.env
code ./.env
```

> :notebook_with_decorative_cover: Explanation of `.env`:
>
> - SIGNING_KEY is used by the gateway to sign the domain.
> - ALCHEMY_TOKEN is used to connect the blockchain network.

After setting the env variables, export them: `yarn export-env`

### Begin running gateway server and resolve names

First, install dependencies and build all packages:

```bash
yarn clean && yarn install && yarn build
```

Next, run the gateway with the private key on the `Goerli` testnet:

```bash
yarn start-goerli:gateway --data token.eth.json
```

The value for the private key should be the key you set earlier in the .env file.

You will see output similar to the following:

```
yarn run v1.22.19
$ yarn workspace @ensdomains/offchain-resolver-gateway start-goerli --data token.eth.json
$ eval $(grep '^SIGNING_KEY' .env) && node dist/index.js --private-key ${SIGNING_KEY} --data token.eth.json

Serving on port 8080 with signing address 0x3B7D34d0E7e807A9D7aD74F094C5379aca61460D
```

Take a look at the data in `token.eth.json` under `packages/gateway/`; it specifies addresses for the name `token.eth` and the `labs.token.eth`.

Next, edit `packages/contracts/deployments/goerli/AddressRecord.json`; replacing the address of `Signer` with the one output when you ran the command above (0x3B7D34... = Gateway & Domain Signer).

```json
{
  "Signer": "0x3B7D34d0E7e807A9D7aD74F094C5379aca61460D"
}
```

And, in a new terminal, edit contracts .env file under `packages/contracts/`:

```bash
cp ./packages/contracts/.env.example ./packages/contracts/.env
code ./packages/contracts/.env
```

> :notebook_with_decorative_cover: Explanation of `packages/contracts/.env`:
>
> - ENS_REGISTRY_OWNER_PRIVATE_KEY is used to deploy `ENSRegistry` contract (deployer is also owner of the `ENSRegistry` contract).
> - ENS_DOMAIN_OWNER_PRIVATE_KEY will be the private key of the owner of `eth` and `token.eth` domains.
> - DEPLOYER_PRIVATE_KEY is used to deploy `OffchainResolver` contract.
> - ETHERSCAN_API_KEY is used to verify the contract code.

Then, connect to `Goerli` testnet and deploy ENS registry and the offchain resolver:

```bash
cd ./packages/contracts
npx hardhat run ./scripts/deploy/ENSRegistry.ts --network goerli
npx hardhat run ./scripts/deploy/OffchainResolver.ts --network goerli
```

Set the domain owner and resolver address:

```bash
npx hardhat run ./scripts/operating/OffchainResolver/SetResolver.ts --network goerli
```

You will see output similar to the following:

```
ENSRegistry contract on etherscan: https://goerli.etherscan.io/address/0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18
OffchainResolver contract on etherscan: https://goerli.etherscan.io/address/0x8f620Ed5Bfc61792e4757F48B686fB3678977Ce7
Set ethdomain "eth" owner, TX: https://goerli.etherscan.io/tx/0x3f093c0bd1c6b616c46c72032025af64080dcd193c85e615446e84d9eacee52d
Set maindomain "token" owner, TX: https://goerli.etherscan.io/tx/0x980097bcd976d39ea30cc928e8753d4d74a349f7db5a04c16711096f02b94e9a
Set fulldomain "token.eth" resolver contract, TX: https://goerli.etherscan.io/tx/0xc112ad0ed9497c8f6ee1cf7c966534f16e717d351285cce218f624b97fc5d352
```

Take note of the address to which the ENSRegistry was deployed (0x12315f...).

Finally, run the example client to demonstrate resolving a name:

```bash
yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 token.eth
yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 labs.token.eth
```

> :notebook: This address (0x12315f...) tells ethers.js the address of the ENSRegistry contract we deployed earlier in the Goerli testnet.

You should see output similar to the following:

```
% yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 token.eth

yarn run v1.22.19
$ yarn workspace @ensdomains/offchain-resolver-client start-goerli --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 token.eth
$ eval $(grep '^ALCHEMY_TOKEN' .env) && node dist/index.js --chainId 5 --chainName goerli --provider https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN} --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 token.eth
Resolver contract address: 0x8f620Ed5Bfc61792e4757F48B686fB3678977Ce7
ETH address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
LTC address: Ld797g7vcD34F4m3pCR5fb1Z98yEswMLGX
        └─ decode to onchain hex: 0x76a914c428696e02ed7f5b41a9f180367bebb2b408422088ac
BTC address: 1Ei9UmLQv4o4UJTy5r5mnGFeC9auM3W5P1
        └─ decode to onchain hex: 0x76a9149661c46c94700b2cc891109fffc3a49b26d1f78e88ac
Email: test@token.im
Content: ipfs://QmTeW79w7QQ6Npa3b1d5tANreCDxF2iDaAPsDvW6KtLmfB
✨  Done in 18.76s.

% yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 labs.token.eth

yarn run v1.22.19
$ yarn workspace @ensdomains/offchain-resolver-client start-goerli --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 labs.token.eth
$ eval $(grep '^ALCHEMY_TOKEN' .env) && node dist/index.js --chainId 5 --chainName goerli --provider https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN} --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 labs.token.eth
Resolving labs.token.eth domain...
Resolver contract address: 0x8f620Ed5Bfc61792e4757F48B686fB3678977Ce7
ETH address: 0xE3c19B6865f2602f30537309e7f8D011eF99C1E0
LTC address: LLw6U7XG323u8X1KZM79iiesXxs7PKP7J6
        └─ decode to onchain hex: 0x76a91412c00790d4a77a778a796b7c1aef16817af0a1f688ac
BTC address: 1AmqV2m6pmvcBTs8kXb3A8pmHsBJhSrTuY
        └─ decode to onchain hex: 0x76a9146b33e7fb4d6bc23b0803326fd25367e6b2ad63ed88ac
Email: labs@token.im
Content: ipfs://QmTeW79w7QQ6Npa3b1d5tANreCDxF2iDaAPsDvW6KtLmfB
✨  Done in 22.72s.
```

Postscript: If you want to specify the eth or btc address of the token.eth domain, you can use eth + dot + domain or btc + dot + domain to resolve:

```bash
yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 eth.token.eth
yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 btc.token.eth
yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 ltc.token.eth
```

You should see output similar to the following:

```
% yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 eth.token.eth

yarn run v1.22.19
$ yarn workspace @ensdomains/offchain-resolver-client start-goerli --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 eth.token.eth
$ eval $(grep '^ALCHEMY_TOKEN' .env) && node dist/index.js --chainId 5 --chainName goerli --provider https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN} --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 eth.token.eth
Resolving token.eth domain...
ETH address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        └─ decode to onchain hex: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
✨  Done in 10.53s.

% yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 btc.token.eth

yarn run v1.22.19
$ yarn workspace @ensdomains/offchain-resolver-client start-goerli --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 btc.token.eth
$ eval $(grep '^ALCHEMY_TOKEN' .env) && node dist/index.js --chainId 5 --chainName goerli --provider https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN} --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 btc.token.eth
Resolving token.eth domain...
BTC address: 1Ei9UmLQv4o4UJTy5r5mnGFeC9auM3W5P1
        └─ decode to onchain hex: 0x76a9149661c46c94700b2cc891109fffc3a49b26d1f78e88ac
✨  Done in 10.27s.

% yarn start-goerli:client --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 ltc.token.eth

yarn run v1.22.19
$ yarn workspace @ensdomains/offchain-resolver-client start-goerli --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 ltc.token.eth
$ eval $(grep '^ALCHEMY_TOKEN' .env) && node dist/index.js --chainId 5 --chainName goerli --provider https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN} --registry 0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18 ltc.token.eth
Resolving token.eth domain...
LTC address: Ld797g7vcD34F4m3pCR5fb1Z98yEswMLGX
        └─ decode to onchain hex: 0x76a914c428696e02ed7f5b41a9f180367bebb2b408422088ac
✨  Done in 9.96s.
```

Check these addresses against the gateway's `token.eth.json` and you will see that they match.

## Real-world usage

There are 5 main steps to using this in production:

1.  Optionally, write a new backend for the gateway that queries your own data store. Or, use the JSON one and write your records to a JSON file in the format described in the gateway repository.
2.  Generate one or more signing keys. Secure these appropriately; posession of the signing keys makes it possible to forge name resolution responses!
3.  Start up a gateway server using your name database and a signing key. Publish it on a publicly-accessible URL.
4.  Deploy `OffchainResolver` to Ethereum, providing it with the gateway URL and list of signing key addresses.
5.  Set the newly deployed resolver as the resolver for one or more ENS names.

## Early access to the UI version

You Just execute the following command to start the React server:

> :warning: You still need to run the gateway server in another terminal first.

```bash
yarn start:webapp
```

Then, Open http://localhost:3000 in your browser.

You can use the UI with MetaMask wallet to resolve the coin address/owner email and set a new domain owner to the ENSRegistry contract.
