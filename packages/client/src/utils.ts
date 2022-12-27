import { formatsByName } from "@ensdomains/address-encoder"

const DOT = "."

export function splitFirstLabel(
    domainName: string,
): { firstLabel: string; restDomainName: string } {
    const domainNameArray = domainName.split(DOT)
    if (domainNameArray.length <= 1) {
        throw new Error(`[Error] Invalid domain name: ${domainName}`)
    }
    const firstLabel = domainNameArray[0]
    return {
        firstLabel,
        restDomainName: domainName.replace(firstLabel + DOT, ""),
    }
}

// Decode address to EIP-2304 onchain hex string
export function addressToOnchainHex(address: string, coinType: string): string {
    const onchain = formatsByName[coinType].decoder(address)
    return `0x${onchain.toString("hex")}`
}

// Get coin type from the name
// Coin type reference: https://github.com/satoshilabs/slips/blob/master/slip-0044.md#registered-coin-types
export function getCoinType(coinName: string): number | null {
    let coinType: number | null = null
    switch (coinName.toUpperCase()) {
        case "ETH": {
            coinType = 60
            break
        }
        case "BTC": {
            coinType = 0
            break
        }
        case "LTC": {
            coinType = 2
            break
        }
    }
    return coinType
}

// Determine if the name is name of a coin
export function isCoin(name: string): boolean {
    const coinType = getCoinType(name)
    return coinType === null ? false : true
}
