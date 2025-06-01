// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {VrfRaffle} from "../src/VrfRaffle.sol";
import {VrfRaffleFactory} from "../src/RaffleFactory.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 token (was MockUSDC)
contract MockToken is IERC20 {
    error InsufficientAllowance();
    error InsufficientBalance();

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance < amount) revert InsufficientAllowance();
        if (_balances[from] < amount) revert InsufficientBalance();
        
        _allowances[from][msg.sender] = currentAllowance - amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    // Test helper to mint tokens
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
}

// Mock VRF V2.5 Wrapper for Base mainnet
contract MockVRFV2PlusWrapper {
    error InsufficientPayment();
    error WrapperRefundFailed();
    error InvalidRequestID();
    error FulfillmentFailed();

    uint256 private requestIdCounter;
    mapping(uint256 => address) private requestIdToConsumer;
    uint256 public constant mockRequestPrice = 0.001 ether; // Make it constant
    
    // Base mainnet LINK token address
    address public constant link = 0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196;

    function calculateRequestPriceNative(uint32, uint32) external pure returns (uint256) {
        return mockRequestPrice;
    }
    
    function estimateRequestPriceNative(uint32, uint32, uint256) external pure returns (uint256) {
        return mockRequestPrice;
    }

    function requestRandomWordsInNative(
        uint32,
        uint16,
        uint32,
        bytes memory // extraArgs parameter added
    ) external payable returns (uint256 requestId) {
        if (msg.value < mockRequestPrice) revert InsufficientPayment();
        
        // Only keep the exact amount needed, refund excess
        if (msg.value > mockRequestPrice) {
            (bool success,) = msg.sender.call{value: msg.value - mockRequestPrice}("");
            if (!success) revert WrapperRefundFailed();
        }
        
        requestIdCounter++;
        requestId = requestIdCounter;
        requestIdToConsumer[requestId] = msg.sender;
    }
    
    function lastRequestId() external view returns (uint256) {
        return requestIdCounter;
    }

    // Test helper to fulfill random words
    function fulfillRandomWordsTest(uint256 requestId, uint256[] memory randomWords) external {
        address consumer = requestIdToConsumer[requestId];
        if (consumer == address(0)) revert InvalidRequestID();
        
        // Call rawFulfillRandomWords on the consumer
        (bool success,) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        if (!success) revert FulfillmentFailed();
    }
    
    // Allow receiving ETH
    receive() external payable {}
}

contract VrfRaffleTest is Test {
    VrfRaffle public raffle;
    MockToken public token;
    MockVRFV2PlusWrapper public vrfWrapper;

    // Base mainnet VRF wrapper address
    address payable constant BASE_VRF_WRAPPER = payable(0xb0407dbe851f8318bd31404A49e658143C982F23);
    
    // Test parameters
    uint256 constant PRIZE_AMOUNT = 1000 * 10**6; // 1000 tokens (assuming 6 decimals like USDC)

    // Test addresses
    address constant OWNER = address(0x99);
    address constant FUNDER = address(0x1);
    address constant ALICE = address(0x2);
    address constant BOB = address(0x3);
    address constant CHARLIE = address(0x4);

    event PrizeFunded(address indexed from, uint256 amount);
    event RandomRequested(uint256 requestId, uint256 requestPrice);
    event WinnerSelected(address winner);
    event PrizeDistributed(address winner, uint256 amount);

    function setUp() public {
        // Deploy mocks
        token = new MockToken();
        vrfWrapper = new MockVRFV2PlusWrapper();
        
        // Deploy the VRF wrapper mock at the expected Base mainnet address
        vm.etch(BASE_VRF_WRAPPER, address(vrfWrapper).code);

        // Deploy raffle with OWNER as the owner
        raffle = new VrfRaffle(OWNER, address(token));
        
        // Update vrfWrapper to point to the correct address
        vrfWrapper = MockVRFV2PlusWrapper(BASE_VRF_WRAPPER);

        // Setup initial balances
        token.mint(FUNDER, PRIZE_AMOUNT * 10);
        vm.deal(OWNER, 10 ether);
        vm.deal(FUNDER, 10 ether);
        vm.deal(ALICE, 1 ether);
        vm.deal(BOB, 1 ether);
    }

    function testConstructor() public {
        assertEq(raffle.owner(), OWNER);
        assertEq(address(raffle.token()), address(token));
        assertEq(raffle.CALLBACK_GAS_LIMIT(), 200000);
        assertEq(raffle.REQUEST_CONFIRMATIONS(), 3);
        assertEq(raffle.NUM_WORDS(), 1);
    }

    function testFundPrize() public {
        vm.startPrank(FUNDER);
        token.approve(address(raffle), PRIZE_AMOUNT);

        vm.expectEmit(true, false, false, true);
        emit PrizeFunded(FUNDER, PRIZE_AMOUNT);

        raffle.fundPrize(PRIZE_AMOUNT);
        vm.stopPrank();

        assertEq(token.balanceOf(address(raffle)), PRIZE_AMOUNT);
    }

    function testFundPrizeFails_InsufficientAllowance() public {
        vm.startPrank(FUNDER);
        // No approval given
        vm.expectRevert(MockToken.InsufficientAllowance.selector);
        raffle.fundPrize(PRIZE_AMOUNT);
        vm.stopPrank();
    }

    function testRequestRandomWinner() public {
        address[] memory participants = new address[](3);
        participants[0] = ALICE;
        participants[1] = BOB;
        participants[2] = CHARLIE;

        uint256 requiredPayment = 0.001 ether;
        
        vm.expectEmit(false, false, false, true);
        emit RandomRequested(1, requiredPayment);

        vm.prank(OWNER);
        raffle.requestRandomWinner{value: requiredPayment}(participants);

        // Check eligible addresses are stored
        assertEq(raffle.eligibleAddresses(0), ALICE);
        assertEq(raffle.eligibleAddresses(1), BOB);
        assertEq(raffle.eligibleAddresses(2), CHARLIE);
        assertEq(raffle.lastRequestId(), 1);
    }

    function testRequestRandomWinner_FailsWithNonOwner() public {
        address[] memory participants = new address[](1);
        participants[0] = ALICE;
        
        vm.prank(ALICE); // Not the owner
        vm.expectRevert(VrfRaffle.OnlyOwner.selector);
        raffle.requestRandomWinner{value: 0.1 ether}(participants);
    }

    function testRequestRandomWinner_FailsWithNoAddresses() public {
        address[] memory participants = new address[](0);
        
        vm.prank(OWNER);
        vm.expectRevert(VrfRaffle.NoEligibleAddresses.selector);
        raffle.requestRandomWinner{value: 0.1 ether}(participants);
    }

    function testRequestRandomWinner_RefundsExcessPayment() public {
        address[] memory participants = new address[](1);
        participants[0] = ALICE;

        uint256 requiredPayment = 0.001 ether;
        uint256 excessPayment = requiredPayment + 0.5 ether;
        
        vm.startPrank(OWNER);
        uint256 balanceBefore = OWNER.balance;
        
        raffle.requestRandomWinner{value: excessPayment}(participants);
        
        // Should refund excess
        assertEq(OWNER.balance, balanceBefore - requiredPayment);
        vm.stopPrank();
    }

    function testRequestRandomWinner_FailsWithInsufficientPayment() public {
        address[] memory participants = new address[](1);
        participants[0] = ALICE;

        uint256 requiredPayment = 0.001 ether; // Use the constant value directly
        
        vm.prank(OWNER);
        vm.expectRevert(VrfRaffle.InsufficientETHPayment.selector);
        raffle.requestRandomWinner{value: requiredPayment - 0.0001 ether}(participants);
    }

    function testRequestRandomWinner_FailsIfWinnerAlreadySelected() public {
        // First request
        address[] memory participants = new address[](1);
        participants[0] = ALICE;
        vm.prank(OWNER);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);

        // Fulfill to set winner
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 12345;
        vrfWrapper.fulfillRandomWordsTest(1, randomWords);

        // Second request should fail
        vm.prank(OWNER);
        vm.expectRevert(VrfRaffle.WinnerAlreadySelected.selector);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);
    }

    function testFulfillRandomWords() public {
        // Setup eligible addresses
        address[] memory participants = new address[](3);
        participants[0] = ALICE;
        participants[1] = BOB;
        participants[2] = CHARLIE;
        
        vm.prank(OWNER);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);

        // Test different random values
        uint256[] memory randomWords = new uint256[](1);
        
        // Random word that should select BOB (index 1)
        randomWords[0] = 1; // 1 % 3 = 1
        
        vm.expectEmit(true, false, false, false);
        emit WinnerSelected(BOB);

        vrfWrapper.fulfillRandomWordsTest(1, randomWords);
        
        assertEq(raffle.winner(), BOB);
    }

    function testDistributePrize() public {
        // Fund the prize
        vm.startPrank(FUNDER);
        token.approve(address(raffle), PRIZE_AMOUNT);
        raffle.fundPrize(PRIZE_AMOUNT);
        vm.stopPrank();

        // Select winner
        address[] memory participants = new address[](1);
        participants[0] = ALICE;
        vm.prank(OWNER);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 0;
        vrfWrapper.fulfillRandomWordsTest(1, randomWords);

        // Distribute prize
        uint256 aliceBalanceBefore = token.balanceOf(ALICE);

        vm.expectEmit(true, false, false, true);
        emit PrizeDistributed(ALICE, PRIZE_AMOUNT);

        raffle.distributePrize();

        assertEq(token.balanceOf(ALICE), aliceBalanceBefore + PRIZE_AMOUNT);
        assertEq(token.balanceOf(address(raffle)), 0);
        assertTrue(raffle.prizeDistributed());
    }

    function testDistributePrize_FailsIfNoWinner() public {
        vm.expectRevert(VrfRaffle.NoWinnerSelected.selector);
        raffle.distributePrize();
    }

    function testDistributePrize_FailsIfAlreadyDistributed() public {
        // Setup and distribute once
        vm.startPrank(FUNDER);
        token.approve(address(raffle), PRIZE_AMOUNT);
        raffle.fundPrize(PRIZE_AMOUNT);
        vm.stopPrank();

        address[] memory participants = new address[](1);
        participants[0] = ALICE;
        vm.prank(OWNER);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 0;
        vrfWrapper.fulfillRandomWordsTest(1, randomWords);

        raffle.distributePrize();

        // Try to distribute again
        vm.expectRevert(VrfRaffle.PrizeAlreadyDistributed.selector);
        raffle.distributePrize();
    }

    function testDistributePrize_FailsIfNoPrizeFunds() public {
        // Select winner without funding
        address[] memory participants = new address[](1);
        participants[0] = ALICE;
        vm.prank(OWNER);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 0;
        vrfWrapper.fulfillRandomWordsTest(1, randomWords);

        vm.expectRevert(VrfRaffle.NoPrizeFunds.selector);
        raffle.distributePrize();
    }

    function testEstimateRequestPrice() public {
        uint256 estimatedPrice = raffle.estimateRequestPrice(1 gwei);
        assertEq(estimatedPrice, 0.001 ether);
        
        // Also test the convenience function
        uint256 estimatedPriceDefault = raffle.estimateRequestPriceWithDefaultGas();
        assertEq(estimatedPriceDefault, 0.001 ether);
    }

    function testFullRaffleFlow() public {
        // 1. Fund the prize
        vm.startPrank(FUNDER);
        token.approve(address(raffle), PRIZE_AMOUNT);
        raffle.fundPrize(PRIZE_AMOUNT);
        vm.stopPrank();

        // 2. Request random winner with multiple participants
        address[] memory participants = new address[](3);
        participants[0] = ALICE;
        participants[1] = BOB;
        participants[2] = CHARLIE;
        vm.prank(OWNER);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);

        // 3. Fulfill random request (selecting CHARLIE at index 2)
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 5; // 5 % 3 = 2
        vrfWrapper.fulfillRandomWordsTest(1, randomWords);

        assertEq(raffle.winner(), CHARLIE);

        // 4. Distribute prize
        uint256 charlieBalanceBefore = token.balanceOf(CHARLIE);
        raffle.distributePrize();

        assertEq(token.balanceOf(CHARLIE), charlieBalanceBefore + PRIZE_AMOUNT);
        assertEq(token.balanceOf(address(raffle)), 0);
        assertTrue(raffle.prizeDistributed());
    }

    function testMultipleFunders() public {
        address funder2 = address(0x5);
        token.mint(funder2, PRIZE_AMOUNT);

        // First funder
        vm.startPrank(FUNDER);
        token.approve(address(raffle), PRIZE_AMOUNT);
        raffle.fundPrize(PRIZE_AMOUNT);
        vm.stopPrank();

        // Second funder
        vm.startPrank(funder2);
        token.approve(address(raffle), PRIZE_AMOUNT);
        raffle.fundPrize(PRIZE_AMOUNT);
        vm.stopPrank();

        assertEq(token.balanceOf(address(raffle)), PRIZE_AMOUNT * 2);
    }

    function testFuzzWinnerSelection(uint256 randomSeed, uint8 numParticipants) public {
        vm.assume(numParticipants > 0 && numParticipants <= 100);

        // Create participants array
        address[] memory participants = new address[](numParticipants);
        for (uint8 i = 0; i < numParticipants; i++) {
            participants[i] = address(uint160(i + 100));
        }

        vm.prank(OWNER);
        raffle.requestRandomWinner{value: 0.001 ether}(participants);

        // Fulfill with fuzzed random value
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomSeed;
        vrfWrapper.fulfillRandomWordsTest(1, randomWords);

        // Verify winner is one of the participants
        address selectedWinner = raffle.winner();
        uint256 expectedIndex = randomSeed % numParticipants;
        assertEq(selectedWinner, participants[expectedIndex]);
    }

    function testFactoryDeployment() public {
        // Deploy factory
        VrfRaffleFactory factory = new VrfRaffleFactory();
        
        // Deploy raffle through factory as ALICE
        vm.prank(ALICE);
        address raffleAddress = factory.createRaffle(address(token));
        
        // Verify ALICE is the owner of the new raffle, not the factory
        VrfRaffle newRaffle = VrfRaffle(payable(raffleAddress));
        assertEq(newRaffle.owner(), ALICE);
        assertNotEq(newRaffle.owner(), address(factory));
        
        // Verify ALICE can call requestRandomWinner
        address[] memory participants = new address[](1);
        participants[0] = BOB;
        
        vm.prank(ALICE);
        newRaffle.requestRandomWinner{value: 0.001 ether}(participants);
        
        // Verify non-owner cannot call requestRandomWinner
        vm.prank(BOB);
        vm.expectRevert(VrfRaffle.OnlyOwner.selector);
        newRaffle.requestRandomWinner{value: 0.001 ether}(participants);
    }
} 