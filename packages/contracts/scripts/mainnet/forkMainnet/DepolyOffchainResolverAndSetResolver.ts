import { BigNumber, Overrides, providers } from "ethers"
import { ethers, network } from "hardhat"
import * as utils from "~/scripts/utils"
import * as OffResvJson from "~/artifacts/contracts/OffchainResolver.sol/OffchainResolver.json"

async function main() {
    // ---------- Declare and get variables ----------

    // Declare utility variables
    const ethUnit = ethers.utils.parseEther("1")
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

    // Declare the domain name and we want to know the information about it
    const domainUnknown = "neal12.token.eth"
    //const domainUnknown = "token.eth" // main domain

    // Get address data from the deployments/mainnet/AddressRecord.json file
    const addrRecord = await utils.openAddrRecord()

    // Get the ENSRegistry contract instance deployed to the mainnet
    const ensRegiJson = await utils.getENSRegiFallbackJson()
    const ensRegiContract = await ethers.getContractAt(ensRegiJson.abi, ensRegiJson.address)

    // Get gateway url from the hardhat.config.ts file
    const gatewayURL = network.config["gatewayurl"]

    // Get the signer of ENS_DOMAIN_OWNER_PRIVATE_KEY for owning token.eth domain name from the .env file
    const domainOwner = await utils.getDomainOwner()
    const domainOwnerAddr = domainOwner.address

    // Get the signer of DEPLOYER_PRIVATE_KEY for deploying OffchainResolver contract from the .env file
    const OffResvDeployer = await utils.getDeployer()
    const OffResvDeployerAddr = OffResvDeployer.address

    // ---------- In the fork mainnet, need to change the owner of the domain name ----------

    if (network.name === "hardhat") {
        // Get the original owner of the token.eth domain name and its signer
        const oriDomainOwnerAddr = await ensRegiContract.owner(domainNameEncodePacked)
        const oriDomainOwner = await ethers.getSigner(oriDomainOwnerAddr)

        // Transfer 100 ETH to original owner of the domain name and new fake owner
        await utils.getEthFromHardhatAccounts(oriDomainOwner, ethUnit.mul(100))
        await utils.getEthFromHardhatAccounts(domainOwner, ethUnit.mul(100))

        // Only impersonate the domain owner can set new fake owner
        await utils.impersonateAccounts([oriDomainOwnerAddr])
        tx = await ensRegiContract.connect(oriDomainOwner).setOwner(
            ethers.utils.namehash(domainName), // Namehash of the domain
            domainOwnerAddr, // New fake owner
            overrides,
        )
        txReceipt = await tx.wait() // Wait for the transaction to be confirmed by the block being mined
        console.log(
            "The new owner of the domain:",
            await ensRegiContract.owner(domainNameEncodePacked),
        )
    }

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

    // ---------- Set the OffchainResolver address as the resolver of the token.eth domain ----------

    tx = await ensRegiContract.connect(domainOwner).setResolver(
        ethers.utils.namehash(domainName), // Namehash of the domain
        OffResvContract.address,
        overrides,
    )
    txReceipt = await tx.wait() // Wait for the transaction to be confirmed by the block being mined
    console.log(
        "The new OffchainRresolver of the domain:",
        await ensRegiContract.resolver(domainNameEncodePacked),
    )

    // ---------- Try to resolve the subdomain of the token.eth domain using ethers.js ----------

    const resolver = await ethers.provider.getResolver(domainUnknown)
    if (!resolver) {
        console.log(`[Error] No resolver contract found for domain: ${domainName}`)
        process.exit(0)
    }
    const ethAddress = await resolver.getAddress()
    const email = await resolver.getText("email")
    console.log(
        `Resolve the ETH address associated with the domain: ${ethAddress}\nResolve the email associated with the domain: ${email}`,
    )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
