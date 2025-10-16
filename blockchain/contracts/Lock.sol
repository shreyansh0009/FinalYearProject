// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MyContract {
    uint count;

    constructor() {
        count = 0;
    }

    function getCount() public view returns(uint) {
        return count;
    }

    function incrementCount() public {
      count = count + 1;
    }
}

