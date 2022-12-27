import React, { useEffect, useState } from "react";
import { Button, Input, FormControl, FormLabel } from "@chakra-ui/react";
import { BigNumber, ethers, Overrides } from "ethers";
import { ENSRegistryABI as abi } from "abi/ENSRegistryABI";
import { Contract } from "ethers";
import {
  TransactionResponse,
  TransactionReceipt,
} from "@ethersproject/abstract-provider";

interface Props {
  currentAccount: string | undefined;
}

declare let window: any;

export default function SetOwnerResolver(props: Props) {
  const currentAccount = props.currentAccount;
  const [ensRegistry, setENSRegistry] = useState<string>(
    "0xc67a1473D87b669Bb5658Eb4771BBC3b9e189a18"
  );
  const [offchainResolver, setOffchainResolver] = useState<string>(
    "0x8f620Ed5Bfc61792e4757F48B686fB3678977Ce7"
  );
  const labelTLD = "eth"; // Label of top level domain (TLD)
  const [labelSLD, setMainDomain] = useState<string>("test");

  const [domainName, setFullDomain] = useState<string>(
    `${labelSLD}.${labelTLD}`
  );
  const [domainOwner, setDomainOwner] = useState<string>(
    "0x3b7d34d0e7e807a9d7ad74f094c5379aca61460d"
  );
  const [ownerTX, setOwnerTX] = useState<string>("");
  const [offchainResolverTX, setOffchainResolverTX] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // call when labelSLD change
  useEffect(() => {
    if (!window.ethereum) return;
    if (!labelSLD) return;
    setFullDomain(`${labelSLD}.${labelTLD}`);
  }, [labelSLD]);

  async function setOwnerResolver(event: React.FormEvent) {
    event.preventDefault();
    if (!window.ethereum) return;
    setErrorMessage("");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const ensRegistryContract: Contract = new ethers.Contract(
      ensRegistry,
      abi,
      signer
    );

    // Set TX overrides extra argument
    const overrides: Overrides = {
      gasLimit: BigNumber.from(5000000),
      maxFeePerGas: (await provider.getFeeData()).maxFeePerGas!,
      maxPriorityFeePerGas: (await provider.getFeeData()).maxPriorityFeePerGas!,
    };

    ensRegistryContract
      .setSubnodeOwner(
        ethers.utils.namehash(labelTLD),
        ethers.utils.id(labelSLD),
        domainOwner,
        overrides
      )
      .then((tx: TransactionResponse) => {
        setOwnerTX(tx.hash);
        tx.wait()
          .then((receipt: TransactionReceipt) => {
            console.log("Set domain owner receipt:", receipt);
          })
          .catch((e: Error) => {
            setErrorMessage(e.toString());
          });
      })
      .catch((e: Error) => {
        setErrorMessage(e.toString());
      });

    ensRegistryContract
      .setResolver(
        ethers.utils.namehash(domainName),
        offchainResolver,
        overrides
      )
      .then((tx: TransactionResponse) => {
        setOffchainResolverTX(tx.hash);
        tx.wait()
          .then((receipt: TransactionReceipt) => {
            console.log("Set OffchainResolver receipt:", receipt);
          })
          .catch((e: Error) => {
            setErrorMessage(e.toString());
          });
      })
      .catch((e: Error) => {
        setErrorMessage(e.toString());
      });
  }

  return (
    <div>
      <form onSubmit={setOwnerResolver}>
        <FormControl>
          <FormLabel htmlFor="ensregistry">ENS Address:</FormLabel>
          <Input
            id="ensregistry"
            type="text"
            required
            onChange={(e) => {
              setErrorMessage("");
              setOwnerTX("");
              setOffchainResolverTX("");
              setENSRegistry(e.target.value);
            }}
            defaultValue={ensRegistry}
          />
          <FormLabel htmlFor="maindomain">
            Select Main Domain ({domainName}):
          </FormLabel>
          <Input
            htmlSize={9}
            width="auto"
            id="maindomain"
            type="text"
            required
            onChange={(e) => {
              setErrorMessage("");
              setOwnerTX("");
              setOffchainResolverTX("");
              setMainDomain(e.target.value);
              setFullDomain(`${labelSLD}.${labelTLD}`);
            }}
            defaultValue={labelSLD}
            isInvalid={labelSLD.split(".").length > 1} // Maindomain haven't dot value
          />
          .eth
          <FormLabel htmlFor="domainowner">New Domain Owner:</FormLabel>
          <Input
            id="domainowner"
            type="text"
            required
            onChange={(e) => {
              setErrorMessage("");
              setOwnerTX("");
              setOffchainResolverTX("");
              setDomainOwner(e.target.value);
            }}
            defaultValue={domainOwner}
          />
          <FormLabel htmlFor="offchainresolver">
            New OffchainSolver Contract Address:
          </FormLabel>
          <Input
            id="offchainresolver"
            type="text"
            required
            onChange={(e) => {
              setErrorMessage("");
              setOwnerTX("");
              setOffchainResolverTX("");
              setOffchainResolver(e.target.value);
            }}
            defaultValue={offchainResolver}
          />
          <FormLabel
            htmlFor="setdomainowner"
            color={currentAccount ? "black" : "red"}
          >
            {currentAccount
              ? "Click to set"
              : "Disabled to resolve! Need connect to Metamask first"}
            :
          </FormLabel>
          <Button type="submit" isDisabled={!currentAccount}>
            Set Domain Owner
          </Button>
          <FormLabel htmlFor="setownerresult">Set Owner Result:</FormLabel>
          <Input
            id="setownerresult"
            type="text"
            value={
              errorMessage
                ? ""
                : ["https://goerli.etherscan.io/tx/", ownerTX].join("")
            }
            disabled
          />
          <FormLabel htmlFor="setoffchainresolverresult">
            Set OffchainResolver Result:
          </FormLabel>
          <Input
            id="setoffchainresolverresult"
            type="text"
            value={
              errorMessage
                ? ""
                : ["https://goerli.etherscan.io/tx/", offchainResolverTX].join(
                    ""
                  )
            }
            disabled
          />
          <FormLabel
            htmlFor="setoffchainresolverresult"
            color={errorMessage ? "red" : "black"}
          >
            Error Message: {errorMessage}
          </FormLabel>
        </FormControl>
      </form>
    </div>
  );
}
