import {
  prepareEvent,
  prepareContractCall,
  readContract,
  type BaseTransactionOptions,
  type AbiParameterToPrimitiveType,
} from "thirdweb";

/**
* Contract events
*/



/**
 * Creates an event object for the PrizeDistributed event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { prizeDistributedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  prizeDistributedEvent()
 * ],
 * });
 * ```
 */
export function prizeDistributedEvent() {
  return prepareEvent({
    signature: "event PrizeDistributed(address winner, uint256 amount)",
  });
};
  

/**
 * Represents the filters for the "PrizeFunded" event.
 */
export type PrizeFundedEventFilters = Partial<{
  from: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"from","type":"address"}>
}>;

/**
 * Creates an event object for the PrizeFunded event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { prizeFundedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  prizeFundedEvent({
 *  from: ...,
 * })
 * ],
 * });
 * ```
 */
export function prizeFundedEvent(filters: PrizeFundedEventFilters = {}) {
  return prepareEvent({
    signature: "event PrizeFunded(address indexed from, uint256 amount)",
    filters,
  });
};
  



/**
 * Creates an event object for the RandomRequested event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { randomRequestedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  randomRequestedEvent()
 * ],
 * });
 * ```
 */
export function randomRequestedEvent() {
  return prepareEvent({
    signature: "event RandomRequested(uint256 requestId, uint256 requestPrice)",
  });
};
  



/**
 * Creates an event object for the WinnerSelected event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { winnerSelectedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  winnerSelectedEvent()
 * ],
 * });
 * ```
 */
export function winnerSelectedEvent() {
  return prepareEvent({
    signature: "event WinnerSelected(address winner)",
  });
};
  

/**
* Contract read functions
*/



/**
 * Calls the "CALLBACK_GAS_LIMIT" function on the contract.
 * @param options - The options for the CALLBACK_GAS_LIMIT function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { CALLBACK_GAS_LIMIT } from "TODO";
 *
 * const result = await CALLBACK_GAS_LIMIT();
 *
 * ```
 */
export async function CALLBACK_GAS_LIMIT(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x33d608f1",
  [],
  [
    {
      "internalType": "uint32",
      "name": "",
      "type": "uint32"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "NUM_WORDS" function on the contract.
 * @param options - The options for the NUM_WORDS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { NUM_WORDS } from "TODO";
 *
 * const result = await NUM_WORDS();
 *
 * ```
 */
export async function NUM_WORDS(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x72cf6e34",
  [],
  [
    {
      "internalType": "uint32",
      "name": "",
      "type": "uint32"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "REQUEST_CONFIRMATIONS" function on the contract.
 * @param options - The options for the REQUEST_CONFIRMATIONS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { REQUEST_CONFIRMATIONS } from "TODO";
 *
 * const result = await REQUEST_CONFIRMATIONS();
 *
 * ```
 */
export async function REQUEST_CONFIRMATIONS(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x67f082b0",
  [],
  [
    {
      "internalType": "uint16",
      "name": "",
      "type": "uint16"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "eligibleAddresses" function.
 */
export type EligibleAddressesParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "eligibleAddresses" function on the contract.
 * @param options - The options for the eligibleAddresses function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { eligibleAddresses } from "TODO";
 *
 * const result = await eligibleAddresses({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function eligibleAddresses(
  options: BaseTransactionOptions<EligibleAddressesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xeda1d5fd",
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
 * Represents the parameters for the "estimateRequestPrice" function.
 */
export type EstimateRequestPriceParams = {
  gasPriceWei: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"gasPriceWei","type":"uint256"}>
};

/**
 * Calls the "estimateRequestPrice" function on the contract.
 * @param options - The options for the estimateRequestPrice function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { estimateRequestPrice } from "TODO";
 *
 * const result = await estimateRequestPrice({
 *  gasPriceWei: ...,
 * });
 *
 * ```
 */
export async function estimateRequestPrice(
  options: BaseTransactionOptions<EstimateRequestPriceParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x6b562b09",
  [
    {
      "internalType": "uint256",
      "name": "gasPriceWei",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.gasPriceWei]
  });
};




/**
 * Calls the "estimateRequestPriceWithDefaultGas" function on the contract.
 * @param options - The options for the estimateRequestPriceWithDefaultGas function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { estimateRequestPriceWithDefaultGas } from "TODO";
 *
 * const result = await estimateRequestPriceWithDefaultGas();
 *
 * ```
 */
export async function estimateRequestPriceWithDefaultGas(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x52bb4850",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "finalPrizeAmount" function on the contract.
 * @param options - The options for the finalPrizeAmount function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { finalPrizeAmount } from "TODO";
 *
 * const result = await finalPrizeAmount();
 *
 * ```
 */
export async function finalPrizeAmount(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x4e022635",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "getBalance" function on the contract.
 * @param options - The options for the getBalance function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getBalance } from "TODO";
 *
 * const result = await getBalance();
 *
 * ```
 */
export async function getBalance(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x12065fe0",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "getCallbackGasLimit" function on the contract.
 * @param options - The options for the getCallbackGasLimit function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getCallbackGasLimit } from "TODO";
 *
 * const result = await getCallbackGasLimit();
 *
 * ```
 */
export async function getCallbackGasLimit(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xde8be8e7",
  [],
  [
    {
      "internalType": "uint32",
      "name": "",
      "type": "uint32"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "getLinkToken" function on the contract.
 * @param options - The options for the getLinkToken function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getLinkToken } from "TODO";
 *
 * const result = await getLinkToken();
 *
 * ```
 */
export async function getLinkToken(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xe76d5168",
  [],
  [
    {
      "internalType": "contract LinkTokenInterface",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "getRaffleInfo" function on the contract.
 * @param options - The options for the getRaffleInfo function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRaffleInfo } from "TODO";
 *
 * const result = await getRaffleInfo();
 *
 * ```
 */
export async function getRaffleInfo(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x8166f6b2",
  [],
  [
    {
      "internalType": "address",
      "name": "raffleOwner",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "prizeToken",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "raffleWinner",
      "type": "address"
    },
    {
      "internalType": "bool",
      "name": "isPrizeDistributed",
      "type": "bool"
    },
    {
      "internalType": "uint256",
      "name": "requestId",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "prizeAmount",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "getVRFWrapperAddress" function on the contract.
 * @param options - The options for the getVRFWrapperAddress function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getVRFWrapperAddress } from "TODO";
 *
 * const result = await getVRFWrapperAddress();
 *
 * ```
 */
export async function getVRFWrapperAddress(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x84788a92",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "i_vrfV2PlusWrapper" function on the contract.
 * @param options - The options for the i_vrfV2PlusWrapper function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { i_vrfV2PlusWrapper } from "TODO";
 *
 * const result = await i_vrfV2PlusWrapper();
 *
 * ```
 */
export async function i_vrfV2PlusWrapper(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x9ed0868d",
  [],
  [
    {
      "internalType": "contract IVRFV2PlusWrapper",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "lastRequestId" function on the contract.
 * @param options - The options for the lastRequestId function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { lastRequestId } from "TODO";
 *
 * const result = await lastRequestId();
 *
 * ```
 */
export async function lastRequestId(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xfc2a88c3",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "owner" function on the contract.
 * @param options - The options for the owner function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { owner } from "TODO";
 *
 * const result = await owner();
 *
 * ```
 */
export async function owner(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x8da5cb5b",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "prizeDistributed" function on the contract.
 * @param options - The options for the prizeDistributed function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { prizeDistributed } from "TODO";
 *
 * const result = await prizeDistributed();
 *
 * ```
 */
export async function prizeDistributed(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x3c923600",
  [],
  [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "token" function on the contract.
 * @param options - The options for the token function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { token } from "TODO";
 *
 * const result = await token();
 *
 * ```
 */
export async function token(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xfc0c546a",
  [],
  [
    {
      "internalType": "contract IERC20",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "winner" function on the contract.
 * @param options - The options for the winner function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { winner } from "TODO";
 *
 * const result = await winner();
 *
 * ```
 */
export async function winner(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xdfbf53ae",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};


/**
* Contract write functions
*/



/**
 * Calls the "distributePrize" function on the contract.
 * @param options - The options for the "distributePrize" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { distributePrize } from "TODO";
 *
 * const transaction = distributePrize();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function distributePrize(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x77b6e504",
  [],
  []
],
    params: []
  });
};


/**
 * Represents the parameters for the "fundPrize" function.
 */
export type FundPrizeParams = {
  amount: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"amount","type":"uint256"}>
};

/**
 * Calls the "fundPrize" function on the contract.
 * @param options - The options for the "fundPrize" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { fundPrize } from "TODO";
 *
 * const transaction = fundPrize({
 *  amount: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function fundPrize(
  options: BaseTransactionOptions<FundPrizeParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xb79e815e",
  [
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.amount]
  });
};


/**
 * Represents the parameters for the "rawFulfillRandomWords" function.
 */
export type RawFulfillRandomWordsParams = {
  requestId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"_requestId","type":"uint256"}>
randomWords: AbiParameterToPrimitiveType<{"internalType":"uint256[]","name":"_randomWords","type":"uint256[]"}>
};

/**
 * Calls the "rawFulfillRandomWords" function on the contract.
 * @param options - The options for the "rawFulfillRandomWords" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { rawFulfillRandomWords } from "TODO";
 *
 * const transaction = rawFulfillRandomWords({
 *  requestId: ...,
 *  randomWords: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function rawFulfillRandomWords(
  options: BaseTransactionOptions<RawFulfillRandomWordsParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x1fe543e3",
  [
    {
      "internalType": "uint256",
      "name": "_requestId",
      "type": "uint256"
    },
    {
      "internalType": "uint256[]",
      "name": "_randomWords",
      "type": "uint256[]"
    }
  ],
  []
],
    params: [options.requestId, options.randomWords]
  });
};


/**
 * Represents the parameters for the "requestRandomWinner" function.
 */
export type RequestRandomWinnerParams = {
  addresses: AbiParameterToPrimitiveType<{"internalType":"address[]","name":"addresses","type":"address[]"}>
};

/**
 * Calls the "requestRandomWinner" function on the contract.
 * @param options - The options for the "requestRandomWinner" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { requestRandomWinner } from "TODO";
 *
 * const transaction = requestRandomWinner({
 *  addresses: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function requestRandomWinner(
  options: BaseTransactionOptions<RequestRandomWinnerParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xa2207a72",
  [
    {
      "internalType": "address[]",
      "name": "addresses",
      "type": "address[]"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.addresses]
  });
};


