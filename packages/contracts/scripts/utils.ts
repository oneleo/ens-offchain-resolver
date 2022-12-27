import * as fs from "fs"
import * as path from "path"
import { Signer, BigNumberish } from "ethers"
import simpleGit from "simple-git"
import { execSync } from "child_process"
import { ethers, config, network } from "hardhat"
import { default as prompts } from "prompts"

const networkName = network.name === "hardhat" ? "mainnet" : network.name

export async function getDeployer() {
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY
    if (deployerPrivateKey === undefined) throw Error("Deployer private key not provided")

    const deployer = new ethers.Wallet(deployerPrivateKey, ethers.provider)
    const promptResult = await prompts(
        {
            type: "confirm",
            name: "correct",
            message: `Deployer address: ${deployer.address}, is this correct?`,
        },
        {
            onCancel: async function () {
                console.log("Exit process")
                process.exit(0)
            },
        },
    )

    if (!promptResult.correct) {
        process.exit(0)
    }
    return deployer
}

export async function getENSRegistryOwner() {
    const ensRegistryOwnerPrivateKey = process.env.ENS_REGISTRY_OWNER_PRIVATE_KEY
    if (ensRegistryOwnerPrivateKey === undefined)
        throw Error("ENSRegistryOwner private key not provided")

    const ensRegistryOwner = new ethers.Wallet(ensRegistryOwnerPrivateKey, ethers.provider)
    const promptResult = await prompts(
        {
            type: "confirm",
            name: "correct",
            message: `EnsRegistryOwner address: ${ensRegistryOwner.address}, is this correct?`,
        },
        {
            onCancel: async function () {
                console.log("Exit process")
                process.exit(0)
            },
        },
    )

    if (!promptResult.correct) {
        process.exit(0)
    }
    return ensRegistryOwner
}

export async function getDomainOwner() {
    const domainOwnerPrivateKey = process.env.ENS_DOMAIN_OWNER_PRIVATE_KEY
    if (domainOwnerPrivateKey === undefined) throw Error("DomainOwner private key not provided")

    const domainOwner = new ethers.Wallet(domainOwnerPrivateKey, ethers.provider)
    const promptResult = await prompts(
        {
            type: "confirm",
            name: "correct",
            message: `DomainOwner address: ${domainOwner.address}, is this correct?`,
        },
        {
            onCancel: async function () {
                console.log("Exit process")
                process.exit(0)
            },
        },
    )

    if (!promptResult.correct) {
        process.exit(0)
    }
    return domainOwner
}

export async function getOperator() {
    const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY
    if (operatorPrivateKey === undefined) throw Error("Operator private key not provided")

    const operator = new ethers.Wallet(operatorPrivateKey, ethers.provider)
    const promptResult = await prompts(
        {
            type: "confirm",
            name: "correct",
            message: `Operator address: ${operator.address}, is this correct?`,
        },
        {
            onCancel: async function () {
                console.log("Exit process")
                process.exit(0)
            },
        },
    )

    if (!promptResult.correct) {
        process.exit(0)
    }
    return operator
}

export async function getLatestGitHash(): Promise<String> {
    const localGit = simpleGit(process.cwd())
    // Get the latest status
    const latest = (await localGit.log()).latest

    // Get the latest hash
    return latest ? latest.hash : ""
}

function getAddrRecordPath() {
    return path.join(config.paths["root"], "deployments", networkName, "AddressRecord.json")
}

export function getENSRegiJson() {
    const ensRegiJSON = require(path.join(
        config.paths["root"],
        "deployments",
        networkName,
        "ENSRegistry.json",
    ))
    return ensRegiJSON
}

export function getOffResvJson() {
    const offResvJSON = require(path.join(
        config.paths["root"],
        "deployments",
        networkName,
        "OffchainResolver.json",
    ))
    return offResvJSON
}

export function writeContractJson(contractName: string, content) {
    const jsonPath = path.join(
        config.paths["root"],
        "deployments",
        networkName,
        `${contractName}.json`,
    )
    // The folder where Json is located
    const folderPath = path.join(config.paths["root"], "deployments", networkName)
    if (fs.existsSync(jsonPath)) {
        fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2))
    } else {
        // Create new folder and file if not exist
        fs.mkdirSync(folderPath, { recursive: true })
        fs.appendFileSync(jsonPath, JSON.stringify(content, null, 2))
    }
}

export async function verifyContract(cmd: string) {
    const promptResult = await prompts(
        {
            type: "confirm",
            name: "doVerify",
            message: `Verify contract on etherscan (If fails, please execute this cmd again)\ncmd : ${cmd} ?`,
        },
        {
            onCancel: async function () {
                console.log("Exit process")
                process.exit(0)
            },
        },
    )

    if (promptResult.doVerify) {
        execSync(cmd, { stdio: "inherit" })
    }
}

export async function updateAddrRecord(addrRecord) {
    // Expect file exists already
    let addrRecordPath = getAddrRecordPath()
    fs.writeFileSync(addrRecordPath, JSON.stringify(addrRecord, null, 2))
    return
}

export async function openAddrRecord() {
    let addrRecordPath = getAddrRecordPath()
    let addrRecord = new Map()
    if (fs.existsSync(addrRecordPath)) {
        let raw = fs.readFileSync(addrRecordPath)
        addrRecord = JSON.parse(raw.toString())
    } else {
        fs.writeFileSync(addrRecordPath, "{}")
    }

    return addrRecord
}

export async function confirmNextContractAddr(deployer: Signer) {
    const contractAddr = ethers.utils.getContractAddress({
        from: await deployer.getAddress(),
        nonce: await deployer.getTransactionCount(),
    })

    const promptResult = await prompts(
        {
            type: "confirm",
            name: "correct",
            message: `Expected new contract address : ${contractAddr}, is this correct?`,
        },
        {
            onCancel: async function () {
                console.log("Exit process")
                process.exit(0)
            },
        },
    )

    if (!promptResult.correct) {
        process.exit(0)
    }

    return
}

export function getENSRegiFallbackJson() {
    const ensRegiJSON = require(path.join(
        config.paths["root"],
        "deployments",
        networkName,
        "ENSRegistryWithFallback.json",
    ))
    return ensRegiJSON
}

// Impersonate multiple accounts
export async function impersonateAccounts(addrs: string[]) {
    for (const addr of addrs) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [addr],
        })
    }
}

// Transfer ETH to user from Hardhat accounts
export async function getEthFromHardhatAccounts(user: Signer, amount: BigNumberish): Promise<void> {
    const accounts = await ethers.getSigners()
    const userAddr = await user.getAddress()
    for (let i = 0; i < 20; i++) {
        const accountBalance = await accounts[i].getBalance()
        if (accountBalance.gte(amount)) {
            // Transfer ETH to user
            await accounts[i].sendTransaction({
                to: userAddr,
                value: amount.toString(),
            })
            return
        }
    }
    throw new Error("Not enough eth to transfer")
}
