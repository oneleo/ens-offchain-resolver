import * as path from "path"
import { config, network } from "hardhat"

const networkName = network.name === "hardhat" ? "mainnet" : network.name

// Get Signer address from AddressRecord.json
const addrRecordPath = require(path.join(
    config.paths["root"],
    "deployments",
    networkName,
    "AddressRecord.json",
))
const signerAddress = addrRecordPath["Signer"]

// Get gateway URL from Hardhat config
const gatewayURL = network.config["gatewayurl"]

console.log(
    `Verify OffchainResolver info:\n\tsignerAddress: ${signerAddress}\n\tgatewayURL: ${gatewayURL}`,
)

// Export
module.exports = [gatewayURL, [signerAddress]]
