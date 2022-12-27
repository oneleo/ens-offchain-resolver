import * as path from "path"
import { BigNumber, Overrides, providers } from "ethers"
import { ethers, network, config } from "hardhat"
import * as utils from "~/scripts/utils"
import * as OffchainResolver from "~/artifacts/contracts/OffchainResolver.sol/OffchainResolver.json"

async function main() {
    const ethUnit = ethers.utils.parseEther("1")
    let tx: providers.TransactionResponse
    let txReceipt: providers.TransactionReceipt

    // Get domain name
    const labelTLD = "eth" // Label of top level domain (TLD)
    const labelSLD = "token" // Label of second level domain (SLD)
    const domainName = `${labelSLD}.${labelTLD}`
    const node = ethers.utils.namehash(labelTLD)
    const label = ethers.utils.id(labelSLD)
    const subnode = ethers.utils.solidityKeccak256(
        ["bytes"],
        [ethers.utils.solidityPack(["bytes32", "bytes32"], [node, label])],
    )

    // Get gateway URL
    const gatewayURL = network.config["gatewayurl"]
    console.log("gatewayURL:", gatewayURL)

    // Get ENSRegistry contract instance
    const ensRegiJson = await utils.getENSRegiFallbackJson()
    const ensRegiContract = await ethers.getContractAt(ensRegiJson.abi, ensRegiJson.address)
    console.log("ensRegiContract.address:", ensRegiContract.address)

    // Auto set TX overrides extra argument
    const overrides: Overrides = {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await ethers.provider.getFeeData()).maxFeePerGas!,
        maxPriorityFeePerGas: (await ethers.provider.getFeeData()).maxPriorityFeePerGas!,
    }

    // ---------- Mainnet ----------

    // Please set ENS_DOMAIN_OWNER_PRIVATE_KEY and DEPLOYER_PRIVATE_KEY in .env file
    // Get signer from private key in .env file
    const OffResvDeployer = await utils.getDeployer()
    const OffResvDeployerAddr = OffResvDeployer.address

    const domainOwner = await utils.getDomainOwner()
    const domainOwnerAddr = domainOwner.address

    console.log("offchainResolverDeployer:", OffResvDeployerAddr)
    console.log("domainOwner:", domainOwnerAddr)

    // ---------- Fork Mainnet ----------

    if (network.name === "hardhat") {
        // Get original domain owner and its signer
        const oriDomainOwnerAddr = await ensRegiContract.owner(subnode)
        const oriDomainOwner = await ethers.getSigner(oriDomainOwnerAddr)
        console.log(
            "oriDomainOwner:",
            oriDomainOwner.address,
            ", balance:",
            await oriDomainOwner.getBalance(),
        )
        console.log("CCC")
        // Transfer 100 ETH to original domain owner and new fake owner
        await utils.getEthFromHardhatAccounts(oriDomainOwner, ethUnit.mul(100))
        await utils.getEthFromHardhatAccounts(domainOwner, ethUnit.mul(100))

        console.log("balance:", await oriDomainOwner.getBalance())

        // Only impersonate the domain owner can set new fake owner
        await utils.impersonateAccounts([oriDomainOwnerAddr])
        console.log("BBB")
        console.log("New DomainOwner", await ensRegiContract.owner(subnode))
        tx = await ensRegiContract.connect(oriDomainOwner).setOwner(
            ethers.utils.namehash(domainName), // Namehash of the domain
            domainOwnerAddr, // New fake owner
            overrides,
        )
        txReceipt = await tx.wait() // Wait for transaction to confirm that block has been mined
        // Check new domain owner
        console.log("New DomainOwner", await ensRegiContract.owner(subnode))

        // ----------
        //await utils.impersonateAccounts([domainOwnerAddr])
        console.log("Ori Domain Resolver", await ensRegiContract.resolver(subnode))
        tx = await ensRegiContract.connect(domainOwner).setResolver(
            ethers.utils.namehash(domainName), // Namehash of the domain
            "0x0000000000000000000000000000000000000001",
            overrides,
        )
        console.log("AAA")
        txReceipt = await tx.wait() // Wait for transaction to confirm that block has been mined

        // Check new domain resolver
        console.log("New Domain Resolver", await ensRegiContract.resolver(subnode))
    }

    // ---------- Signer setting done ----------

    // // Deploy OffchainResolver contract
    // console.log("Deploying OffchainResolver contract...")
    // await utils.confirmNextContractAddr(OffResvDeployer)

    // // Set deployment info
    // const OffResvContract = await (
    //     await ethers.getContractFactory(OffchainResolver.abi, OffchainResolver.bytecode, deployer)
    // ).deploy(gatewayURL, [OffResvDeployerAddr], overrides)

    // // Deploy contract
    // await OffResvContract.deployed()
    // console.log(`OffchainResolver contract address: ${OffResvContract.address}`)

    // ----------

    // const domainOwnerAddress = "0xC6c5Dc218E535E0D6783aadB83DfFEB232c17058"
    // const ensRegiAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"

    //
    // const domainOwner = ethers.provider.getSigner(domainOwnerAddress)
    // await utils.getEthFromHardhatAccounts(domainOwner, ethUnit.mul(100))

    // Set contract instance
    // const ensRegiJSON = require(path.join(
    //     config.paths["root"],
    //     "artifacts",
    //     "contracts",
    //     "ENSRegistryWithFallback.sol",
    //     "ENSRegistryWithFallback.json",
    // ))
    // const ensRegiContract = await ethers.getContractAt(ensRegiJSON.abi, ensRegiAddress)

    // const etherscanURL = `https://${
    //     network.name === "mainnet" ? "" : network.name + "."
    // }etherscan.io`
    // console.log(
    //     `ENSRegistry contract on etherscan: ${etherscanURL}/address/${ensRegiContract.address}`,
    // )

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

    // // Set fulldomain resolver contract to OffchainResolver by Owner
    // tx = await ensRegiContract.connect(domainOwner).setResolver(
    //     ethers.utils.namehash(domainName), // Namehash of the domain
    //     offResvContract.address,
    //     overrides,
    // )
    // txReceipt = await tx.wait() // Wait for transaction to confirm that block has been mined
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
