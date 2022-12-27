import { ethers, network } from "hardhat"
import * as utils from "~/scripts/utils"

async function main() {
    // Set contract instance
    const ENSRegiJson = await utils.getENSRegiJson()
    const ensRegiContract = await ethers.getContractAt(ENSRegiJson.abi, ENSRegiJson.address)
    const etherscanURL = `https://${
        network.name === "mainnet" ? "" : network.name + "."
    }etherscan.io`
    console.log(
        `ENSRegistry contract on etherscan: ${etherscanURL}/address/${ensRegiContract.address}`,
    )

    const labelTLD = "eth" // Label of top level domain (TLD)
    const labelSLD = "token" // Label of second level domain (SLD)
    const domainName = `${labelSLD}.${labelTLD}`

    // Get ethdomain owner
    const tldOwner = await ensRegiContract.owner(ethers.utils.namehash(labelTLD))
    console.log(`Get TLD \"${labelTLD}\" owner: ${tldOwner}`)

    // Get domain owner
    const domainOwner = await ensRegiContract.owner(ethers.utils.namehash(domainName))
    console.log(`Get domain \"${domainName}\" owner: ${domainOwner}`)

    // Get domain resolver
    const domainNodeHash = ethers.utils.namehash(domainName)
    const domainResolver = await ensRegiContract.resolver(domainNodeHash)
    console.log(`Get domain \"${domainName}\" resolver contract: ${domainResolver}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
