import { Command } from "commander"
import ethers from "ethers"
import { addressToOnchainHex, getCoinType, isCoin, splitFirstLabel } from "./utils"

const program = new Command()
program
    .requiredOption("-r --registry <address>", "ENS registry address")
    .option("-p --provider <url>", "web3 provider URL", "http://localhost:8545/")
    .option("-i --chainId <chainId>", "chainId", "1337")
    .option("-n --chainName <name>", "chainName", "unknown")
    .argument("<name>")

program.parse(process.argv)
const options = program.opts()
const ensAddress = options.registry
const chainId = parseInt(options.chainId)
const chainName = options.chainName
const provider = new ethers.providers.JsonRpcProvider(options.provider, {
    chainId,
    name: chainName,
    ensAddress,
})
;(async () => {
    const domainName = program.args[0]
    let firstLabel, restDomainName
    try {
        ;({ firstLabel, restDomainName } = splitFirstLabel(domainName))
    } catch (error) {
        console.log(error)
        process.exit(0)
    }

    console.log(`Resolving ${domainName} domain...`)

    if (firstLabel.toUpperCase() == "EMAIL") {
        await resolveEmail(restDomainName)
    } else if (isCoin(firstLabel)) {
        await resolveCoinAddress(firstLabel, restDomainName)
    } else {
        await resolveAllData(domainName)
    }
})()

async function getResolver(domainName: string) {
    const resolver = await provider.getResolver(domainName)
    if (!resolver) {
        console.log(`[Error] No resolver contract found for domain: ${domainName}`)
        process.exit(0)
    }
    return resolver
}

// Resolve email of given domain name
async function resolveEmail(domainName: string) {
    const resolver = await getResolver(domainName)
    const emailAddress = await resolver.getText("email")
    console.log(`Email address: ${emailAddress}`)
}

// Resolve coin address of given domain name
async function resolveCoinAddress(coinName: string, domainName: string) {
    const coinType = getCoinType(coinName)
    const coinNameToUpper = coinName.toUpperCase()

    const resolver = await getResolver(domainName)
    const coinAddress = await resolver.getAddress(coinType!)
    console.log(`${coinNameToUpper} address: ${coinAddress}`)
    console.log(
        `\t└─ decode to onchain hex: ${addressToOnchainHex(
            coinAddress,
            coinNameToUpper, // Uppercase english required
        )}`,
    )
}

// Resolve all info of given domain name
async function resolveAllData(domainName: string) {
    const resolver = await getResolver(domainName)
    const ethAddress = await resolver.getAddress()
    const btcAddress = await resolver.getAddress(0)
    const ltcAddress = await resolver.getAddress(2)
    const email = await resolver.getText("email")
    const content = await resolver.getContentHash()

    console.log(`ETH address: ${ethAddress}`)
    console.log(`LTC address: ${ltcAddress}`)
    console.log(`\t└─ decode to onchain hex: ${addressToOnchainHex(ltcAddress, "LTC")}`)
    console.log(`BTC address: ${btcAddress}`)
    console.log(`\t└─ decode to onchain hex: ${addressToOnchainHex(btcAddress, "BTC")}`)
    console.log(`Email: ${email}`)
    console.log(`Content: ${content}`)
}
