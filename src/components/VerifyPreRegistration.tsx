import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { getCurrentOwnerNonce } from "../subgraph";
import { areKeysharesValid } from "../ssv-keys";

function VerifyPostRegistration(props: { isTestnet: boolean }) {
  const [pubKeysArray, setPubKeysArray] = useState<[string, boolean][]>([]);
  const [loading, setLoading] = useState(false);
  const [tableFull, setTableFull] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: any) => {
    acceptedFiles.forEach((file: Blob) => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        let res = reader.result;
        if (typeof res === "string") checkKeyshares(res);
      };
      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      accept: {
        "application/json": [".json"],
      },
    });

  const fileRejectionItems = fileRejections.map(({ file, errors }) => {
    return (
      <li key={file.path}>
        {file.path} - {file.size} bytes
        <ul>
          {errors.map((e) => (
            <li key={e.code}>{e.message}</li>
          ))}
        </ul>
      </li>
    );
  });

  async function checkKeyshares(file: string) {
    setPubKeysArray([]);
    setTableFull(false);
    setLoading(true);
    setError("");

    let url;
    if (props.isTestnet) {
      url = process.env.REACT_APP_SUBGRAPH_API_HOODI;
    } else {
      url = process.env.REACT_APP_SUBGRAPH_API_MAINNET;
    }
    try {
      if (!url) throw Error("Subgraph endpoint is not set");
      let keysharesFileObject = JSON.parse(file);

      let ownerAddress = keysharesFileObject.shares[0].data.ownerAddress;
      console.log(`Owner address: ${ownerAddress}`);
      let ownerNonce = keysharesFileObject.shares[0].data.ownerNonce;
      console.log(`Owner nonce: ${ownerNonce}`);
      let currentNonce = await getCurrentOwnerNonce(ownerAddress, url);

      if (ownerNonce !== currentNonce)
        throw Error(
          `First nonce in the file is ${ownerNonce}, current nonce is ${currentNonce}`
        );

      console.info(
        `Current owner nonce ${currentNonce} for owner ${ownerAddress}`
      );

      console.info("Verifying Keyshares validity");

      // test keyshares validity
      let res = await areKeysharesValid(
        keysharesFileObject.shares,
        currentNonce,
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
    <div>
      <div
        {...getRootProps()}
        className="p-8 text-center text-white font-medium mr-4 border-dashed	border-2 border-blue-600"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag 'n' drop keyshare file, or click to select</p>
        )}
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

      {fileRejectionItems && (
        <p className="text-red-500 mb-2">{fileRejectionItems}</p>
      )}
      {error && <p className="text-red-500 text-center mb-2">{error}</p>}
    </div>
  );
}

export default VerifyPostRegistration;
