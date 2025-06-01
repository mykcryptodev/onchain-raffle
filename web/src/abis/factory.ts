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
 * Represents the filters for the "RaffleCreated" event.
 */
export type RaffleCreatedEventFilters = Partial<{
  creator: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"creator","type":"address"}>
}>;

/**
 * Creates an event object for the RaffleCreated event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { raffleCreatedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  raffleCreatedEvent({
 *  creator: ...,
 * })
 * ],
 * });
 * ```
 */
export function raffleCreatedEvent(filters: RaffleCreatedEventFilters = {}) {
  return prepareEvent({
    signature: "event RaffleCreated(address indexed creator, address raffle, uint256 index)",
    filters,
  });
};
  

/**
* Contract read functions
*/

/**
 * Represents the parameters for the "getRaffle" function.
 */
export type GetRaffleParams = {
  index: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"index","type":"uint256"}>
};

/**
 * Calls the "getRaffle" function on the contract.
 * @param options - The options for the getRaffle function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRaffle } from "TODO";
 *
 * const result = await getRaffle({
 *  index: ...,
 * });
 *
 * ```
 */
export async function getRaffle(
  options: BaseTransactionOptions<GetRaffleParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xe4dafec9",
  [
    {
      "internalType": "uint256",
      "name": "index",
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
    params: [options.index]
  });
};




/**
 * Calls the "getRaffles" function on the contract.
 * @param options - The options for the getRaffles function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getRaffles } from "TODO";
 *
 * const result = await getRaffles();
 *
 * ```
 */
export async function getRaffles(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xa18723c5",
  [],
  [
    {
      "internalType": "address[]",
      "name": "",
      "type": "address[]"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "raffles" function.
 */
export type RafflesParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "raffles" function on the contract.
 * @param options - The options for the raffles function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { raffles } from "TODO";
 *
 * const result = await raffles({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function raffles(
  options: BaseTransactionOptions<RafflesParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x5d4bc0ce",
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
 * Calls the "rafflesCount" function on the contract.
 * @param options - The options for the rafflesCount function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { rafflesCount } from "TODO";
 *
 * const result = await rafflesCount();
 *
 * ```
 */
export async function rafflesCount(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x4d2c53cd",
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
* Contract write functions
*/

/**
 * Represents the parameters for the "createRaffle" function.
 */
export type CreateRaffleParams = {
  token: AbiParameterToPrimitiveType<{"internalType":"address","name":"token","type":"address"}>
};

/**
 * Calls the "createRaffle" function on the contract.
 * @param options - The options for the "createRaffle" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { createRaffle } from "TODO";
 *
 * const transaction = createRaffle({
 *  token: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function createRaffle(
  options: BaseTransactionOptions<CreateRaffleParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xc72da53e",
  [
    {
      "internalType": "address",
      "name": "token",
      "type": "address"
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
    params: [options.token]
  });
};


