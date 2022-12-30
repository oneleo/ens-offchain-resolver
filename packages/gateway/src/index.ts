import { makeApp } from "./server"
import { Command } from "commander"
import { readFileSync } from "fs"
import { ethers } from "ethers"
import { JSONDatabase } from "./json"
import { abi as OffResvAbi } from "./OffchainResolver.json"
const program = new Command()
program
    .requiredOption(
        "-k --private-key <key>",
        "Private key to sign responses with. Prefix with @ to read from a file",
    )
    .requiredOption("-d --data <file>", "JSON file to read data from")
    .option("-t --ttl <number>", "TTL for signatures", "300")
    .option("-p --port <number>", "Port number to serve on", "8080")
    .option("-r --resolver <address>", "Offchain resolver contract address", "")
    .option("-a --alchemy <key>", "When the resolver is set, the Alchemy token is required", "")
    .option("-n --network <key>", "When the resolver is set, the blockchain type is required", "")
program.parse(process.argv)
const options = program.opts()
let privateKey = options.privateKey
if (privateKey.startsWith("@")) {
    privateKey = ethers.utils.arrayify(readFileSync(privateKey.slice(1), { encoding: "utf-8" }))
}
const address = ethers.utils.computeAddress(privateKey)
// Check the signer of OffchainResolver is the same as the signer of this gateway
if (options.resolver !== "") {
    const provider = new ethers.providers.JsonRpcProvider(
        `https://eth-${options.network.toLowerCase()}.alchemyapi.io/v2/${options.alchemy}`,
    )
    const OffResvContract = new ethers.Contract(options.resolver, OffResvAbi, provider)
    OffResvContract.signers(address).then((result: any) => {
        console.log("Verifying the signer...")
        if (typeof result !== "boolean") {
            throw new Error("The result of OffchainResolver signers is not a boolean type")
        }
        if (!result) {
            throw new Error(
                "The signer of OffchainResolver is not the same as the signer of this gateway",
            )
        }
        if (result) {
            console.log(
                "Success! The signer of OffchainResolver is the same as the signer of this gateway",
            )
        }
    })
}
const signer = new ethers.utils.SigningKey(privateKey)
const db = JSONDatabase.fromFilename(options.data, parseInt(options.ttl))
const app = makeApp(signer, "/", db)
console.log(`Serving on port ${options.port} with signing address ${address}`)
app.listen(parseInt(options.port))

module.exports = app
