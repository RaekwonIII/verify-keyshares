/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState } from "react";
import "./App.css";
import { Switch } from "@headlessui/react";
import { getOwnerNonceAtBlock, getValidatorRegistrationData } from "./subgraph";
import { areKeysharesValid } from "./ssv-keys";

function App() {
  const [pubKeysArray, setPubKeysArray] = useState<[string, boolean][]>([]);
  const [loading, setLoading] = useState(false);
  const [tableFull, setTableFull] = useState(false);
  const [testnet, setTestnet] = useState(false);
  const [error, setError] = useState("");

  async function fetchData(transactionHash: string) {
    if (!transactionHash) return;
    setPubKeysArray([]);
    setTableFull(false);
    setLoading(true);
    setError("");

    let url;
    if (testnet) {
      url = process.env.REACT_APP_SUBGRAPH_API_HOLESKY;
    } else {
      url = process.env.REACT_APP_SUBGRAPH_API_MAINNET;
    }

    try {
      if (!url) throw Error("Subgraph endpoint is not set");
      let validatorRegistrationData = await getValidatorRegistrationData(
        transactionHash,
        url
      );
      if (!validatorRegistrationData)
        throw Error("No validator data found at this transaction hash");
      let { sharesObjArr, blockNumber, ownerAddress } =
        validatorRegistrationData;

      let initialNonce = await getOwnerNonceAtBlock(
        ownerAddress,
        blockNumber,
        url
      );
      console.info(
        `Starting owner nonce ${initialNonce} for owner ${ownerAddress} on block ${blockNumber}`
      );

      console.info("Verifying Keyshares validity");

      // test keyshares validity
      let res = await areKeysharesValid(
        sharesObjArr,
        initialNonce,
        ownerAddress
      );
      setPubKeysArray([...res.entries()]);

      console.info(`All Keyshares validated`);
    } catch (e) {
      if (typeof e === "string") {
        setError(e);
      } else if (e instanceof Error) {
        setError(e.message);
      }
    } finally {
      setTableFull(true);
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0E0E52]">
      <div className="bg-[#0E0E52] shadow-md rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="https://ssv.network/wp-content/uploads/2024/09/Symbol.png"
            alt="SSV Network Logo"
            className="h-21 w-16"
          />
        </div>

        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Keyshares Validity Check
        </h2>

        <div className="flex justify-center items-center my-6 mx-5">
          <span className="text-white font-medium mr-4">Mainnet</span>
          <Switch
            checked={testnet}
            onChange={setTestnet}
            className={`${testnet ? "bg-blue-600" : "bg-blue-600"}
            relative inline-flex h-[21px] w-[45px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
          >
            <span
              aria-hidden="true"
              className={`${testnet ? "translate-x-6" : "translate-x-0"}
              pointer-events-none inline-block h-[17px] w-[17px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
          <span className="text-white font-medium ml-4">Holesky</span>
        </div>

        <div className="flex justify-center mb-4">
          <input
            onChange={(event) => fetchData(event.target.value)}
            placeholder="Paste registration txhash..."
            className="w-[300px] px-4 py-2 border border-gray-500 rounded-lg bg-[#0E0E52] text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex justify-center items-center">
          {loading && (
            <div className="flex justify-center items-center space-x-2">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
              <span className="text-blue-400 font-medium">
                Fetching balances...
              </span>
            </div>
          )}
        </div>

        {tableFull !== false && (
          <div className="w-full overflow-visible">
            <div className="min-w-max">
              <table className="w-full bg-[#0E0E52] table-auto">
                <thead>
                  <tr className="bg-[#0E0E52] text-white text-center">
                    <th className="px-4 py-2 whitespace-nowrap">Pubkey</th>
                    <th className="px-4 py-2 whitespace-nowrap">Is Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {pubKeysArray.map((pubkey, index) => (
                    <tr
                      key={index}
                      className="text-center align-middle text-white"
                    >
                      <td className="px-4 py-2 break-all">
                        <div className="inline-flex items-center gap-x-3">
                          <button
                            type="button"
                            className="btn"
                            data-clipboard-text={pubkey[0]}
                            data-clipboard-action="copy"
                            data-clipboard-success-text="Copied"
                          >
                            <svg
                              className="h-6 w-6 text-white-500"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              stroke-width="2"
                              stroke="currentColor"
                              fill="none"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              {" "}
                              <path stroke="none" d="M0 0h24v24H0z" />{" "}
                              <rect x="8" y="8" width="12" height="12" rx="2" />{" "}
                              <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
                            </svg>
                            <svg
                              className="js-clipboard-success hidden size-4 text-blue-600"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <span>
                            {pubkey[0].substring(0, 8)} ...{" "}
                            {pubkey[0].substring(pubkey[0].length - 6)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {pubkey[1] ? "True" : "False"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
      </div>
    </div>
  );
}

export default App;
