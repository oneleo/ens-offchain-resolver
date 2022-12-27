import * as utils from "~/scripts/utils"
import { ethers, network } from "hardhat"
import { BigNumber, Overrides } from "ethers"
import * as ENSRegistry from "~/artifacts/@ensdomains/ens-contracts/contracts/registry/ENSRegistry.sol/ENSRegistry.json"

async function main() {
    const contractName = "ENSRegistry"
    const addrRecord = await utils.openAddrRecord()
    const ensRegistryOwner = await utils.getENSRegistryOwner()

    // Deploy ENSRegistry contract
    console.log("Deploying ENSRegistry contract...")
    await utils.confirmNextContractAddr(ensRegistryOwner)

    // Auto set TX overrides extra argument
    const overrides: Overrides = {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await ethers.provider.getFeeData()).maxFeePerGas!,
        maxPriorityFeePerGas: (await ethers.provider.getFeeData()).maxPriorityFeePerGas!,
    }

    // Set deployment info
    const contractInstance = await (
        await ethers.getContractFactory(ENSRegistry.abi, ENSRegistry.bytecode, ensRegistryOwner)
    ).deploy(overrides)

    // Deploy contract
    await contractInstance.deployed()
    console.log(`ENSRegistry contract address: ${contractInstance.address}`)

    // Record contract addresses and update file
    addrRecord[contractName] = contractInstance.address
    await utils.updateAddrRecord(addrRecord)

    // Write ENSRegistry contract JSON
    utils.writeContractJson(contractName, {
        address: contractInstance.address,
        commit: await utils.getLatestGitHash(),
        abi: ENSRegistry.abi,
    })

    // Verify contract
    const verifyCmd = `npx hardhat verify --network ${network.name} ${contractInstance.address}`
    await utils.verifyContract(verifyCmd)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
