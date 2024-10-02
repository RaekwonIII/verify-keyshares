import * as retry from "retry"

export type ClusterSnapshot = {
  validatorCount: number;
  networkFeeIndex: number;
  index: number;
  active: boolean;
  balance: number;
};

export type ShareObject = {
  keySharesFilePath: string;
  data: {
    ownerNonce: number;
    ownerAddress: string;
    publicKey: string;
    operators: 
      {
        id: number;
        operatorKey: string;
      }[];
  };
  payload: {
    publicKey: string;
    operatorIds: number[];
    sharesData: string;
  };
};

export type ValidatorRegistrationData = {
  sharesObjArr: ShareObject[],
  blockNumber: number,
  ownerAddress: string
}

export function debug(args: any) {

  if (process.env.DEBUG) {
    console.debug(args);
  }
}

export function retryWithExponentialBackoff(operation: (operationOptions: any) => Promise<any>, operationOptions: any, options: any) {
  return new Promise((resolve, reject) => {
    const operationRetry = retry.operation(options)

    operationRetry.attempt(() => {
      operation(operationOptions)
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {
          if (operationRetry.retry(err)) {
            return
          }
          reject(operationRetry.mainError())
        })
    })
  })
}
