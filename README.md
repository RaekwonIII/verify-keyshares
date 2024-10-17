# Verify SSV keyshares

This simple webapp allows users to verify that generated keyshares are valid and will be accepted by SSV nodes.

It is possible to verify keyshares validity in two ways:

* Before registering them
* After a registration transaction

In the first case, the webapp accepts a `keyshares.json` file as an input, it will fetch the owner's `nonce` on the SSV smart contract, querying a SubGraph, and it will check the validity of all keyshares contained in the file.

> ⚠️ Please note: although keyshares verified this way might be deemed `valid`, this is only true if no other validators are registered by the same address before the same file is used in a registration transaction.

In the second case, the webapp expects the transaction hash of a `registerValidator`, or `bulkRegisterValidator` transaction performed by the SSV smart contract. The webapp logic will query the SubGraph for the events emitted in this transaction, fetch the keyshares used, and will verify their validity using the user `nonce` in these shares, against the **actual** `nonce` **at the block before the transaction**.

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

The webapp needs two environment variables, indicating the endpoint of a Subgraph API. One for Mainnet, and one for Holesky:

```sh
# e.g.: "https://api.studio.thegraph.com/query/71118/ssv-network-holesky/version/latest"
REACT_APP_SUBGRAPH_API_HOLESKY=
# e.g. "https://api.studio.thegraph.com/query/71118/ssv-network-ethereum/version/latest"
REACT_APP_SUBGRAPH_API_MAINNET=
```
