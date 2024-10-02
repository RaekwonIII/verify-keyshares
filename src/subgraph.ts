import axios from "axios";
import { ShareObject, ValidatorRegistrationData } from "./utils";

export async function getValidatorRegistrationData(
  txhash: string,
  subgraph_endpoint: string
): Promise<ValidatorRegistrationData | undefined> {
  let returnData;
  let validatorData: ShareObject[] = [];
  try {
    const response = await axios({
      method: "POST",
      url: subgraph_endpoint,
      headers: {
        "content-type": "application/json",
      },
      data: {
        query: `
            query getValidatorRegistrationData($txhash: Bytes) {
                validatorAddeds(
                  where: {transactionHash: $txhash}
                  orderBy: id
                  orderDirection: asc
                ) {
                  publicKey
                  shares
                  owner
                  operatorIds
                  blockNumber
                }
            }`,
        variables: { txhash: txhash },
      },
    });

    if (response.status !== 200) throw Error("Request did not return OK");
    if (!response.data.data.validatorAddeds) throw Error("Response is empty");
    if (response.data.data.validatorAddeds.length === 0)
      throw Error("No events found");

    let result = response.data.data.validatorAddeds;

    validatorData = result.map((item: any) => {
      console.info(`Found pubkey: ${item.publicKey}`);
      return {
        keySharesFilePath: "",
        data: {
          ownerNonce: 0,
          ownerAddress: item.owner,
          publicKey: item.publicKey,
          operators: [
            {
              id: 0,
              operatorKey: "",
            },
          ],
        },
        payload: {
          publicKey: item.publicKey,
          operatorIds: item.operatorIds.map((id: string) => parseInt(id)),
          sharesData: item.shares,
        },
      };
    });
    returnData = {
      sharesObjArr: validatorData,
      blockNumber: parseInt(result[0].blockNumber) - 1,
      ownerAddress: result[0].owner,
    };
  } catch (err) {
    console.error("ERROR DURING AXIOS REQUEST", err);
  } finally {
    return returnData;
  }
}

export async function getOwnerNonceAtBlock(
  owner: string,
  block: number,
  subgraph_endpoint: string
): Promise<number> {
  let nonce = 0;
  try {
    const response = await axios({
      method: "POST",
      url: subgraph_endpoint,
      headers: {
        "content-type": "application/json",
      },
      data: {
        query: `
          query accountNonce($owner: ID!, $block: Int) {
            account(id: $owner, block: {number: $block}) {
                nonce
            }
          }`,
        variables: { owner: owner, block: block },
      },
    });
    if (response.status !== 200) throw Error("Request did not return OK");
    if (!response.data && !response.data.data && !response.data.data.account) {
      console.error("No data found");
    } else {
      nonce = Number(response.data.data.account.nonce);
    }
  } catch (err) {
    console.error("ERROR DURING AXIOS REQUEST", err);
  } finally {
    return nonce;
  }
}
