// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MyContract {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function setMessage(string memory _newMessage) public {
        message = _newMessage;
    }
}

