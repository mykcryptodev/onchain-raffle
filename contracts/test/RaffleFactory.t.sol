// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {VrfRaffleFactory} from "../src/RaffleFactory.sol";
import {VrfRaffle} from "../src/VrfRaffle.sol";
import {MockToken, MockVRFV2PlusWrapper} from "./VrfRaffle.t.sol";

contract VrfRaffleFactoryTest is Test {
    VrfRaffleFactory public factory;
    MockToken public token;
    MockVRFV2PlusWrapper public vrfWrapper;

    // Base mainnet VRF wrapper address
    address payable constant BASE_VRF_WRAPPER = payable(0xb0407dbe851f8318bd31404A49e658143C982F23);

    event RaffleCreated(address indexed creator, address raffle, uint256 index);

    function setUp() public {
        // Deploy mocks
        token = new MockToken();
        vrfWrapper = new MockVRFV2PlusWrapper();
        
        // Deploy the VRF wrapper mock at the expected Base mainnet address
        vm.etch(BASE_VRF_WRAPPER, address(vrfWrapper).code);

        // Deploy factory
        factory = new VrfRaffleFactory();
    }

    function testCreateRaffle() public {
        // We don't know the exact address that will be created, so we can't test the exact emit
        // But we can check that the event is emitted with correct creator and index
        vm.expectEmit(true, false, true, false);
        emit RaffleCreated(address(this), address(0), 0); // address(0) is placeholder

        address raffleAddress = factory.createRaffle(address(token));

        // Verify raffle was created with correct parameters
        VrfRaffle raffle = VrfRaffle(payable(raffleAddress));
        assertEq(raffle.owner(), address(this)); // Factory caller should be the owner
        assertEq(address(raffle.token()), address(token));
        
        // Verify hardcoded VRF parameters
        assertEq(raffle.CALLBACK_GAS_LIMIT(), 200000);
        assertEq(raffle.REQUEST_CONFIRMATIONS(), 3);
        assertEq(raffle.NUM_WORDS(), 1);

        // Verify factory state
        assertEq(factory.rafflesCount(), 1);
        assertEq(factory.getRaffle(0), raffleAddress);
    }

    function testCreateRaffleWithDifferentCallers() public {
        address alice = address(0x1);
        address bob = address(0x2);

        // Alice creates a raffle
        vm.prank(alice);
        address aliceRaffle = factory.createRaffle(address(token));
        
        // Bob creates a raffle
        vm.prank(bob);
        address bobRaffle = factory.createRaffle(address(token));

        // Verify owners
        assertEq(VrfRaffle(payable(aliceRaffle)).owner(), alice);
        assertEq(VrfRaffle(payable(bobRaffle)).owner(), bob);
    }

    function testGetRaffles() public {
        // Create multiple raffles
        address raffle1 = factory.createRaffle(address(token));
        address raffle2 = factory.createRaffle(address(token));

        // Get all raffles
        address[] memory allRaffles = factory.getRaffles();
        
        // Verify returned array
        assertEq(allRaffles.length, 2);
        assertEq(allRaffles[0], raffle1);
        assertEq(allRaffles[1], raffle2);
    }

    function testGetRaffle() public {
        address raffle = factory.createRaffle(address(token));
        assertEq(factory.getRaffle(0), raffle);
    }

    function testGetRaffle_RevertsForInvalidIndex() public {
        vm.expectRevert("Invalid index");
        factory.getRaffle(0);
    }

    function testRafflesCount() public {
        assertEq(factory.rafflesCount(), 0);

        factory.createRaffle(address(token));
        assertEq(factory.rafflesCount(), 1);
        
        factory.createRaffle(address(token));
        assertEq(factory.rafflesCount(), 2);
    }

    function testMultipleRafflesCreation() public {
        uint256 numRaffles = 5;
        address[] memory raffles = new address[](numRaffles);
        
        for (uint256 i = 0; i < numRaffles; i++) {
            raffles[i] = factory.createRaffle(address(token));
        }
        
        // Verify all raffles were created correctly
        assertEq(factory.rafflesCount(), numRaffles);
        
        for (uint256 i = 0; i < numRaffles; i++) {
            assertEq(factory.getRaffle(i), raffles[i]);
        }
    }
}
