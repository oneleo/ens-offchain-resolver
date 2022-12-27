import "dotenv/config"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "tsconfig-paths/register"

const accounts = {
    mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
}
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const ALCHEMY_TOKEN = process.env.ALCHEMY_TOKEN || ""

const exampleGatewayurl = "https://offchain-resolver-example.uc.r.appspot.com/{sender}/{data}.json"
const localGatewayURL = "http://localhost:8080/{sender}/{data}.json"
const gatewayURL = "http://imkeyserver.com:9003/{sender}/{data}.json"

module.exports = {
    solidity: "0.8.10",
    networks: {
        arbitrum: {
            url: "https://arb1.arbitrum.io/rpc",
        },
        arbitrum_kovan: {
            url: "https://kovan5.arbitrum.io/rpc",
            gasPrice: 0,
        },
        arbitrum_rinkeby: {
            url: "https://rinkeby.arbitrum.io/rpc",
            gasPrice: 0,
        },
        hardhat: {
            chainId: 1,
            forking: {
                url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_TOKEN}`,
                blockNumber: 14340000,
            },
            gatewayurl: gatewayURL,
        },
        goerli: {
            url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN}`,
            tags: ["test", "demo"],
            chainId: 5,
            accounts,
            gatewayurl: gatewayURL,
        },
        mainnet: {
            url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_TOKEN}`,
            tags: ["demo"],
            chainId: 1,
            accounts,
        },
    },
    etherscan: {
        apiKey: `${ETHERSCAN_API_KEY}`,
    },
}
