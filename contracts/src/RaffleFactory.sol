// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VrfRaffle.sol";

contract VrfRaffleFactory {
    event RaffleCreated(address indexed creator, address raffle, uint256 index);

    address[] public raffles;

    function createRaffle(address token) external returns (address) {
        VrfRaffle raffle = new VrfRaffle(msg.sender, token);
        raffles.push(address(raffle));
        emit RaffleCreated(msg.sender, address(raffle), raffles.length - 1);
        return address(raffle);
    }

    function getRaffles() external view returns (address[] memory) {
        return raffles;
    }

    function getRaffle(uint256 index) external view returns (address) {
        require(index < raffles.length, "Invalid index");
        return raffles[index];
    }

    function rafflesCount() external view returns (uint256) {
        return raffles.length;
    }
}