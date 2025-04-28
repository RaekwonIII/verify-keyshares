# Verify SSV keyshares

This simple webapp allows users to verify that generated keyshares are valid and will be accepted by SSV nodes.

It is possible to verify keyshares validity in two ways:

* Before registering them
* After a registration transaction

## Verify keyshares before registering them

In the first case, the webapp accepts a `keyshares.json` file as an input, it will fetch the owner's `nonce` on the SSV smart contract, querying a SubGraph, and it will check the validity of all keyshares contained in the file.

The `nonce` is fetched using this query (you can find more information on the [official SSV docs](https://docs.ssv.network/developers/tools/ssv-subgraph/subgraph-examples#account-nonce)):

```graphql
query accountNonce($owner: ID!, $block: Int) {
    account(id: $owner) {
        nonce
    }
}
```

Then, the keyshares validity is tested using the `areKeysharesValid` function, defined in the [`ssv-keys.ts`](./src/ssv-keys.ts) file.
The function takes three input parameters: an array of objects representing keyshares (`keysharesObjArray`), the owner's nonce (`ownerNonce`) and the owner address (`owner`).
To test keyshares, the function will:
- attempt to split the shares data into and array of public and encrypted shares for each operator
- attempt to deserialize each public share in the array, to confirm these are valid BLS public keys
- attempt to deserialize the validator public key, to confirm it is a valid BLS public key
- validate the signature portion of the shares data, confirming that the signed message `${address}:${ownerNonce}` matches the provided input

> ⚠️ Please note: although keyshares verified this way might be deemed `valid`, this is only true if no other validators are registered by the same address before the same file is used in a registration transaction.

## Verify keyshares after registering them

In the second case, the webapp expects the transaction hash of a `registerValidator`, or `bulkRegisterValidator` transaction performed by the SSV smart contract. The webapp logic will query the SubGraph for the events emitted in this transaction, fetch the keyshares used, and will verify their validity using the user `nonce` in these shares, against the **actual** `nonce` **at the block before the transaction**.

This verification can often be redundant, if the pre-registration was done right before submitting the transaction. It can almost be considered a "paranoid" check, in cases where multiple parties can manage the same owner address wallet, or when the owner address wallet is a multi-sig, and there can be a delay between the time when the transaction is submitted and enough signatures are collected to finally execute the transaction.

The checks performed are exactly the same as the ones explained in the previous section, with one important difference: the owner `nonce` used is not the *current* one, rather the *`nonce` at the block right before the transaction took place*. It is possible to fetch this data, thanks to the following query:

```graphql
query accountNonce($owner: ID!, $block: Int) {
    account(id: $owner, block: {number: $block}) {
        nonce
    }
}
```

## Dependencies installation

To install dependencies:

```bash
npm install
```

## Usage

From the project's main directory launch the command:
```bash
npm start
```

To run the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

## Environment variables

The webapp needs two environment variables, indicating the endpoint of a Subgraph API. One for Mainnet, and one for Hoodi:

```sh
# e.g.: "https://api.studio.thegraph.com/query/71118/ssv-network-hoodi/version/latest"
REACT_APP_SUBGRAPH_API_HOODI=
# e.g. "https://api.studio.thegraph.com/query/71118/ssv-network-ethereum/version/latest"
REACT_APP_SUBGRAPH_API_MAINNET=
```
