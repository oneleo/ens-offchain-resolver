import * as path from "path"
import { BigNumber, Overrides, providers } from "ethers"
import { ethers, network, config } from "hardhat"
import * as utils from "~/scripts/utils"

async function main() {
    const domainOwnerAddress = "0xC6c5Dc218E535E0D6783aadB83DfFEB232c17058"
    const ensRegiAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"
    const ethUnit = ethers.utils.parseEther("1")

    //
    const domainOwner = ethers.provider.getSigner(domainOwnerAddress)
    await utils.getEthFromHardhatAccounts(domainOwner, ethUnit.mul(100))

    // Set contract instance
    const ensRegiJSON = require(path.join(
        config.paths["root"],
        "artifacts",
        "contracts",
        "ENSRegistryWithFallback.sol",
        "ENSRegistryWithFallback.json",
    ))
    const ensRegiContract = await ethers.getContractAt(ensRegiJSON.abi, ensRegiAddress)

    // const etherscanURL = `https://${
    //     network.name === "mainnet" ? "" : network.name + "."
    // }etherscan.io`
    // console.log(
    //     `ENSRegistry contract on etherscan: ${etherscanURL}/address/${ensRegiContract.address}`,
    // )

    // Set TX overrides extra argument
    const overrides: Overrides = {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await ethers.provider.getFeeData()).maxFeePerGas!,
        maxPriorityFeePerGas: (await ethers.provider.getFeeData()).maxPriorityFeePerGas!,
    }

    const defaultNameHash = "0x" + "00".repeat(32)
    const labelTLD = "eth" // Label of top level domain (TLD)
    const labelSLD = "token" // Label of second level domain (SLD)
    const domainName = `${labelSLD}.${labelTLD}`

    let tx: providers.TransactionResponse
    let txReceipt: providers.TransactionReceipt

    // // Set ethdomain manager to Owner by Deployer
    // tx = await ensRegiContract.connect(ensRegistryOwner).setSubnodeOwner(
    //     defaultNameHash,
    //     ethers.utils.id(labelTLD), // Node hash of TLD label
    //     domainOwnerAddress,
    //     overrides,
    // )
    // txReceipt = await tx.wait() // Wait for transaction to confirm that block has been mined
    // console.log(
    //     `Set TLD \"${labelTLD}\" owner, TX: ${etherscanURL}/tx/${txReceipt.transactionHash}`,
    // )

    // // Set maindomain manager to Owner by above setting Owner
    // tx = await ensRegiContract.connect(domainOwner).setSubnodeOwner(
    //     ethers.utils.namehash(labelTLD), // Namehash of TLD
    //     ethers.utils.id(labelSLD), // Node hash of SLD label
    //     domainOwnerAddress,
    //     overrides,
    // )
    // txReceipt = await tx.wait() // Wait for transaction to confirm that block has been mined
    // console.log(
    //     `Set SLD \"${labelSLD}\" owner, TX: ${etherscanURL}/tx/${txReceipt.transactionHash}`,
    // )

    await utils.impersonateAccounts([domainOwnerAddress])

    // Set fulldomain resolver contract to OffchainResolver by Owner
    tx = await ensRegiContract.connect(domainOwner).setResolver(
        ethers.utils.namehash(domainName), // Namehash of the domain
        offResvContract.address,
        overrides,
    )
    txReceipt = await tx.wait() // Wait for transaction to confirm that block has been mined
    // console.log(
    //     `Set domain \"${domainName}\" resolver contract, TX: ${etherscanURL}/tx/${txReceipt.transactionHash}`,
    // )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
