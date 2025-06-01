// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VRFV2PlusWrapperConsumerBase} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract VrfRaffle is VRFV2PlusWrapperConsumerBase {
    error TransferFailed();
    error WinnerAlreadySelected();
    error NoEligibleAddresses();
    error InsufficientETHPayment();
    error RefundFailed();
    error NoWinnerSelected();
    error PrizeAlreadyDistributed();
    error NoPrizeFunds();
    error PrizeTransferFailed();
    error OnlyOwner();

    IERC20 public immutable token;
    address public immutable owner;

    // Base mainnet VRF v2.5 configuration
    uint32 public constant CALLBACK_GAS_LIMIT = 200000; // Conservative gas limit for callback
    uint16 public constant REQUEST_CONFIRMATIONS = 3; // 3 confirmations for security
    uint32 public constant NUM_WORDS = 1; // We only need 1 random number

    address[] public eligibleAddresses;
    address public winner;
    bool public prizeDistributed;
    uint256 public lastRequestId;

    event PrizeFunded(address indexed from, uint256 amount);
    event RandomRequested(uint256 requestId, uint256 requestPrice);
    event WinnerSelected(address winner);
    event PrizeDistributed(address winner, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address _owner, address _token) 
        VRFV2PlusWrapperConsumerBase(
            0xb0407dbe851f8318bd31404A49e658143C982F23
        ) 
    {
        owner = _owner;
        token = IERC20(_token);
    }

    function fundPrize(uint256 amount) external {
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit PrizeFunded(msg.sender, amount);
    }

    function requestRandomWinner(address[] calldata addresses) external payable onlyOwner returns (uint256) {
        if (winner != address(0)) revert WinnerAlreadySelected();
        if (addresses.length == 0) revert NoEligibleAddresses();
        
        address[] memory tempEligible = new address[](addresses.length);
        for (uint256 i = 0; i < addresses.length; i++) {
            tempEligible[i] = addresses[i];
        }
        eligibleAddresses = tempEligible;

        // Calculate the request price first
        uint256 requestPrice = i_vrfV2PlusWrapper.calculateRequestPriceNative(CALLBACK_GAS_LIMIT, NUM_WORDS);
        
        // Ensure enough native token was sent
        if (msg.value < requestPrice) revert InsufficientETHPayment();
        
        // Create extraArgs for VRF v2.5 - specify native payment
        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(
            VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
        );
        
        // Request randomness paying with native token (ETH on Base)
        (uint256 requestId, ) = requestRandomnessPayInNative(
            CALLBACK_GAS_LIMIT,
            REQUEST_CONFIRMATIONS,
            NUM_WORDS,
            extraArgs
        );
        
        // Refund excess payment
        if (msg.value > requestPrice) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - requestPrice}("");
            if (!success) revert RefundFailed();
        }

        lastRequestId = requestId;
        emit RandomRequested(requestId, requestPrice);
        
        return requestId;
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        if (eligibleAddresses.length == 0) revert NoEligibleAddresses();
        uint256 winnerIndex = randomWords[0] % eligibleAddresses.length;
        winner = eligibleAddresses[winnerIndex];

        emit WinnerSelected(winner);
    }

    function distributePrize() external {
        if (winner == address(0)) revert NoWinnerSelected();
        if (prizeDistributed) revert PrizeAlreadyDistributed();

        uint256 prizeAmount = token.balanceOf(address(this));
        if (prizeAmount == 0) revert NoPrizeFunds();

        prizeDistributed = true;
        if (!token.transfer(winner, prizeAmount)) revert PrizeTransferFailed();

        emit PrizeDistributed(winner, prizeAmount);
    }

    // Function to estimate the cost of requesting randomness
    // Uses a gas price parameter since calculateRequestPriceNative relies on tx.gasprice which is 0 in view calls
    function estimateRequestPrice(uint256 gasPriceWei) external view returns (uint256) {
        return i_vrfV2PlusWrapper.estimateRequestPriceNative(CALLBACK_GAS_LIMIT, NUM_WORDS, gasPriceWei);
    }
    
    // Convenience function that uses a default gas price (can be used for rough estimates)
    function estimateRequestPriceWithDefaultGas() external view returns (uint256) {
        // Default to 1 gwei for Base mainnet (typical gas price)
        return i_vrfV2PlusWrapper.estimateRequestPriceNative(CALLBACK_GAS_LIMIT, NUM_WORDS, 1 gwei);
    }
    
    // Debug function to check VRF wrapper address
    function getVRFWrapperAddress() external view returns (address) {
        return address(i_vrfV2PlusWrapper);
    }
    
    // Debug function to get callback gas limit
    function getCallbackGasLimit() external pure returns (uint32) {
        return CALLBACK_GAS_LIMIT;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
