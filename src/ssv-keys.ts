import * as ethUtil from "ethereumjs-util";
import bls from "bls-eth-wasm";
import { ethers } from "ethers";
import { ShareObject } from "./utils";

const SIGNATURE_LENGHT = 192;
const PUBLIC_KEY_LENGHT = 96;

export interface IKeySharesFromSignatureData {
  ownerAddress: string;
  ownerNonce: number;
  publicKey: string;
}

async function validateSingleShares(
  shares: string,
  fromSignatureData: IKeySharesFromSignatureData
): Promise<void> {
  const { ownerAddress, ownerNonce, publicKey } = fromSignatureData;

  if (!Number.isInteger(ownerNonce) || ownerNonce < 0) {
    throw new Error(`Owner nonce is not positive integer ${ownerNonce}`);
  }
  const address = ethers.getAddress(ownerAddress);
  const signaturePt = shares.replace("0x", "").substring(0, SIGNATURE_LENGHT);

  if (!bls.deserializeHexStrToSecretKey) {
    await bls.init(bls.BLS12_381);
  }

  const blsPublicKey = bls.deserializeHexStrToPublicKey(
    publicKey.replace("0x", "")
  );
  const signature = bls.deserializeHexStrToSignature(
    `0x${signaturePt}`.replace("0x", "")
  );

  const messageHash = ethUtil.keccak256(
    Buffer.from(`${address}:${ownerNonce}`)
  );
  if (!blsPublicKey.verify(signature, new Uint8Array(messageHash))) {
    throw new Error(
      `Single shares signature is invalid 0x${signaturePt}, expected address: ${address} and nonce: ${ownerNonce} for pubkey: ${publicKey}"`
    );
  }
}

function splitArray(parts: number, arr: Uint8Array) {
  const partLength = Math.floor(arr.length / parts);
  const partsArr = [];
  for (let i = 0; i < parts; i++) {
    const start = i * partLength;
    const end = start + partLength;
    partsArr.push(arr.slice(start, end));
  }
  return partsArr;
}

/**
 * Build shares from bytes string and operators list length
 * @param bytes
 * @param operatorCount
 */
function buildSharesFromBytes(bytes: string, operatorCount: number): any {
  // Validate the byte string format (hex string starting with '0x')
  if (!bytes.startsWith("0x") || !/^(0x)?[0-9a-fA-F]*$/.test(bytes)) {
    throw new Error("Invalid byte string format");
  }

  // Validate the operator count (positive integer)
  if (operatorCount <= 0 || !Number.isInteger(operatorCount)) {
    throw new Error("Invalid operator count");
  }

  const sharesPt = bytes.replace("0x", "").substring(SIGNATURE_LENGHT);

  const pkSplit = sharesPt.substring(0, operatorCount * PUBLIC_KEY_LENGHT);
  const pkArray = ethers.getBytes("0x" + pkSplit);
  const sharesPublicKeys = splitArray(operatorCount, pkArray).map((item) =>
    ethers.hexlify(item)
  );

  const eSplit = bytes.substring(operatorCount * PUBLIC_KEY_LENGHT);
  const eArray = ethers.getBytes("0x" + eSplit);
  const encryptedKeys = splitArray(operatorCount, eArray).map((item) =>
    Buffer.from(ethers.hexlify(item).replace("0x", ""), "hex").toString(
      "base64"
    )
  );

  return { sharesPublicKeys, encryptedKeys };
}

export async function areKeysharesValid(
  keysharesObjArray: ShareObject[],
  ownerNonce: number,
  owner: string
): Promise<Map<string, boolean>> {
  let result: Map<string, boolean> = new Map();
  for (let keysharesObj of keysharesObjArray) {
    try {
      let pubkey = keysharesObj.payload.publicKey;
      let sharesData = keysharesObj.payload.sharesData;
      let fromSignatureData = {
        ownerNonce,
        publicKey: pubkey,
        ownerAddress: owner,
      };

      const shares: { sharesPublicKeys: string[]; encryptedKeys: string[] } =
        buildSharesFromBytes(
          sharesData,
          keysharesObj.payload.operatorIds.length
        );
      const { sharesPublicKeys, encryptedKeys } = shares;
      await validateSingleShares(sharesData, fromSignatureData);

      const cantDeserializeSharePublicKeys = [];
      for (const sharesPublicKey of sharesPublicKeys) {
        try {
          bls.deserializeHexStrToPublicKey(sharesPublicKey.replace("0x", ""));
        } catch (e) {
          cantDeserializeSharePublicKeys.push(sharesPublicKey);
        }
      }
      if (cantDeserializeSharePublicKeys.length || !sharesPublicKeys.length) {
        throw new Error(JSON.stringify(cantDeserializeSharePublicKeys));
      }
      bls.deserializeHexStrToPublicKey(pubkey.replace("0x", ""));
      result.set(pubkey, true);
    } catch (e) {
      let pubkey = keysharesObj.payload.publicKey;
      if (typeof e === "string") {
        console.error(
          `Keyshares verification failed for pubkey ${pubkey}:\n${e}`
        );
      } else if (e instanceof Error) {
        console.error(
          `Keyshares verification failed for pubkey ${pubkey}:\n${e.message}`
        );
      }
      result.set(pubkey, false);
    } finally {
      ownerNonce += 1;
    }
  }
  return result;
}
