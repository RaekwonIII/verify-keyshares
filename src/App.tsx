/* eslint-disable @typescript-eslint/no-unused-expressions */
import "./App.css";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

import VerifyPostRegistration from "./components/VerifyPostRegistration";
import VerifyPreRegistration from "./components/VerifyPreRegistration";
import { Switch } from "@headlessui/react";
import { useState } from "react";

function App() {
  const [testnet, setTestnet] = useState(false);
  return (
    <div>
      <div className="fixed top-3 right-5">
        <a href="https://github.com/RaekwonIII/verify-keyshares" target="_blank">
        <img
            src="github-mark-white.svg"
            alt="GitHub Logo"
            className="h-8"
          />
          </a>
      </div>
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
        <TabGroup>
          <TabList className="flex justify-center items-center shadow-md rounded-lg w-full max-w-md">
            <Tab className="m-6 p-2 font-medium rounded-lg text-white data-[selected]:bg-blue-600 data-[selected]:text-blue data-[hover]:underline">
              Pre-registration
            </Tab>
            <Tab className="m-6 p-2 font-medium rounded-lg text-white data-[selected]:bg-blue-600 data-[selected]:text-blue data-[hover]:underline">
              Post-registration
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
            <VerifyPreRegistration isTestnet={testnet} />
            </TabPanel>
            <TabPanel>
              <VerifyPostRegistration isTestnet={testnet} />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
    </div>
  );
}

export default App;
