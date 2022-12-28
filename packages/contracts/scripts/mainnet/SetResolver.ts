import { BigNumber, Overrides, providers } from "ethers"
import { ethers } from "hardhat"
import * as utils from "~/scripts/utils"

async function main() {
    // ---------- Declare and get variables ----------

    // Declare utility variables
    let tx: providers.TransactionResponse
    let txReceipt: providers.TransactionReceipt

    // Declare and calculate domain name data
    const labelTld = "eth" // Label of top level domain (TLD)
    const labelSld = "token" // Label of second level domain (SLD)
    const labelTldNameHash = ethers.utils.namehash(labelTld)
    const labelSldId = ethers.utils.id(labelSld)
    const domainName = `${labelSld}.${labelTld}`
    const domainNameEncodePacked = ethers.utils.solidityKeccak256(
        ["bytes"],
        [ethers.utils.solidityPack(["bytes32", "bytes32"], [labelTldNameHash, labelSldId])],
    )

    // Declare transaction overrides extra arguments
    const overrides: Overrides = {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await ethers.provider.getFeeData()).maxFeePerGas!,
        maxPriorityFeePerGas: (await ethers.provider.getFeeData()).maxPriorityFeePerGas!,
    }

    // Get the ENSRegistry contract instance deployed to the mainnet
    const ensRegiJson = await utils.getENSRegiFallbackJson()
    const ensRegiContract = await ethers.getContractAt(ensRegiJson.abi, ensRegiJson.address)

    // Get the signer of ENS_DOMAIN_OWNER_PRIVATE_KEY for owning token.eth domain name from the .env file
    const domainOwner = await utils.getDomainOwner()

    // ---------- Set the OffchainResolver address as the resolver of the token.eth domain ----------

    const OffResvJson = await utils.getOffResvJson()

    tx = await ensRegiContract.connect(domainOwner).setResolver(
        ethers.utils.namehash(domainName), // Namehash of the domain
        OffResvJson.address,
        overrides,
    )
    txReceipt = await tx.wait() // Wait for the transaction to be confirmed by the block being mined
    console.log(
        "The new OffchainRresolver of the domain:",
        await ensRegiContract.resolver(domainNameEncodePacked),
    )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
