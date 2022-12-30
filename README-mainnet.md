# ENS Offchain Resolver

Assuming that you have obtained a set of ENS (here we use token.eth as an example) from ens.domains, and you have set up an off-chain gateway server.

The following instructions will explain how to link the off-chain gateway server to the on-chain token.eth ENS domain so that ethers.js can successfully query ENS Ethereum addresses from the off-chain gateway server.

Here we assume that your off-chain gateway server information is as follows:

- URL: http://imkeyserver.com:9003/{sender}/{data}.json
- Signer: 0x3B7D34d0E7e807A9D7aD74F094C5379aca61460D
- Subdomain in gateway database: neal12.token.eth
- Account of subdomain: 0x67F7E7dD168Af3D009E4C34Ef7312da6D23289Dd
- Email of subdomain: xyzdumpling@token.im

## A. Preparation

- Clone this repository and checkout to the mainnet_resolver_feature branch, then build

```shell
% git clone git@github.com:consenlabs/ens-offchain-resolver.git
% code ens-offchain-resolver && git checkout mainnet_resolver_feature
% yarn clean && yarn install && yarn build
```

## B. Simulation

1. Change to packages/contracts/ folder and set the .env file

```shell
% cd packages/contracts/
% cp .env.example .env && code .env

### Edit the .env file
### ------------------------------
ENS_REGISTRY_OWNER_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000000"
ENS_DOMAIN_OWNER_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000001"
DEPLOYER_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000002"
ETHERSCAN_API_KEY="Created_by_https://etherscan.io/"
ALCHEMY_TOKEN="Created_by_https://www.alchemy.com/"
### ------------------------------
```

2. Simulation the entire process on the fork mainnet

```shell
% npx hardhat run scripts/operating/forkMainnet/DepolyOffchainResolverAndSetResolver.ts --network hardhat
```

Output:

```
✔ DomainOwner address: 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf, is this correct? … yes
✔ Deployer address: 0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF, is this correct? … yes
The new owner of the domain: 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf
✔ Expected new contract address : 0xfdDE5A7823A0b6c094E73D15FF4A03Ec34e2cd11, is this correct? … yes
The gateway url from the OffchainResolver contract: http://imkeyserver.com:9003/{sender}/{data}.json
The new OffchainRresolver of the domain: 0xfdDE5A7823A0b6c094E73D15FF4A03Ec34e2cd11
Resolve the ETH address associated with the domain: 0x67F7E7dD168Af3D009E4C34Ef7312da6D23289Dd
Resolve the email associated with the domain: xyzdumpling@token.im
```

## C. Deploy the offchain resolver contract on mainnet

> Note: Please ensure that your ETH balance is sufficient.

1. Please check that the signer listed in the deployments/mainnet/AddressRecord.json file is the same as the signer of the off-chain gateway server.

```shell
% code deployments/mainnet/AddressRecord.json

### check the signer address
### ------------------------------
{
  "Signer": "0x3B7D34d0E7e807A9D7aD74F094C5379aca61460D",
...
}
### ------------------------------
```

2. Deploy the offchain resolver contract

```shell
% npx hardhat run scripts/deploy/OffchainResolver.ts --network mainnet
```

Output:

```
✔ Deployer address: 0x3B7D34d0E7e807A9D7aD74F094C5379aca61460D, is this correct? … yes
✔ Expected new contract address : 0xbF975Ba9ad5c242730435c9C133AedAE4B942dfa, is this correct? … yes
✔ Verify contract on etherscan (If fails, please execute this cmd again)
cmd : npx hardhat verify --network mainnet --contract contracts/OffchainResolver.sol:OffchainResolver 0xbF975Ba9ad5c242730435c9C133AedAE4B942dfa --constructor-args ./scripts/deploy/OffchainResolverVerifyArguments.ts ? … yes
```

3. Verify the contract on Etherscan again if the above verification fails
   > Please adjust the contract address to suit your actual situation.

```
% npx hardhat verify --network mainnet --contract contracts/OffchainResolver.sol:OffchainResolver 0xbF975Ba9ad5c242730435c9C133AedAE4B942dfa --constructor-args ./scripts/deploy/OffchainResolverVerifyArguments.ts
```

## D. Set the resolver of the token.eth domain

- Go to the [ens.domains](https://app.ens.domains/name/token.eth/details) website to set the resolver of the token.eth domain

## E. Resolve the subdomain

- Try to resolve the subdomain of the token.eth domain using ethers.js

```shell
% npx hardhat run scripts/operating/ResolveSubdomain.ts --network mainnet
```

Output:

```
Resolve the ETH address associated with the domain: 0x67F7E7dD168Af3D009E4C34Ef7312da6D23289Dd
Resolve the email associated with the domain: xyzdumpling@token.im
```
