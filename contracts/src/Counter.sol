// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Counter {
    uint256 private _count;

    function get() external view returns (uint256) {
        return _count;
    }

    function increment() external {
        _count++;
    }
}
