import { BigNumber, Overrides, providers } from "ethers"
import { ethers, network } from "hardhat"
import * as utils from "~/scripts/utils"
import * as OffResvJson from "~/artifacts/contracts/OffchainResolver.sol/OffchainResolver.json"

async function main() {
    // ---------- Declare and get variables ----------

    // Declare transaction overrides extra arguments
    const overrides: Overrides = {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await ethers.provider.getFeeData()).maxFeePerGas!,
        maxPriorityFeePerGas: (await ethers.provider.getFeeData()).maxPriorityFeePerGas!,
    }

    // Get address data from the deployments/mainnet/AddressRecord.json file
    const addrRecord = await utils.openAddrRecord()

    // Get gateway url from the hardhat.config.ts file
    const gatewayURL = network.config["gatewayurl"]

    // Get the signer of DEPLOYER_PRIVATE_KEY for deploying OffchainResolver contract from the .env file
    const OffResvDeployer = await utils.getDeployer()
    const OffResvDeployerAddr = OffResvDeployer.address

    // ---------- Deploy OffchainResolver contract ----------

    const contractName = "OffchainResolver"

    // Print expected new contract address
    await utils.confirmNextContractAddr(OffResvDeployer)

    // Set the OffchainResolver contract instance before deployment
    const OffResvContract = await (
        await ethers.getContractFactory(OffResvJson.abi, OffResvJson.bytecode, OffResvDeployer)
    ).deploy(gatewayURL, [OffResvDeployerAddr], overrides)

    // Deploy OffchainResolver contract
    await OffResvContract.deployed()

    // Update the signer of OffchainResolver contract in the deployments/mainnet/AddressRecord.json file
    addrRecord["Signer"] = OffResvDeployerAddr
    await utils.updateAddrRecord(addrRecord)

    // Update the address of OffchainResolver contract in the deployments/mainnet/AddressRecord.json file
    addrRecord["OffchainResolver"] = OffResvContract.address
    await utils.updateAddrRecord(addrRecord)

    // Update the address and Json of OffchainResolver contract in the deployments/mainnet/OffchainResolver.json file
    utils.writeContractJson(contractName, {
        address: OffResvContract.address,
        commit: await utils.getLatestGitHash(),
        abi: OffResvJson.abi,
    })

    // On the mainnet, we need to verify the code of OffchainResolver contract in the etherscan.io website
    if (network.name === "mainnet") {
        // Verify OffchainResolver contract
        const verifyCmd = `npx hardhat verify --network ${utils.networkName} --contract contracts/OffchainResolver.sol:OffchainResolver ${OffResvContract.address} --constructor-args ./scripts/mainnet/etherscanVerification/OffchainResolverVerifyArguments.ts`
        await utils.verifyContract(verifyCmd)
    }
    console.log("The gateway url from the OffchainResolver contract:", await OffResvContract.url())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
