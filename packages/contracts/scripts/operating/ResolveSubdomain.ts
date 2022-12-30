import { ethers } from "hardhat"

async function main() {
    // ---------- Declare and get variables ----------

    // Declare and calculate domain name data
    const labelTld = "eth" // Label of top level domain (TLD)
    const labelSld = "token" // Label of second level domain (SLD)
    const domainName = `${labelSld}.${labelTld}`

    // Declare the domain name and we want to know the information about it
    const domainUnknown = "neal12.token.eth"
    // const domainUnknown = "token.eth" // main domain

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
