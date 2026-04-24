// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_StartsAtZero() public view {
        assertEq(counter.get(), 0);
    }

    function test_IncrementIncreasesCount() public {
        counter.increment();
        assertEq(counter.get(), 1);
    }

    function test_MultipleIncrements() public {
        counter.increment();
        counter.increment();
        counter.increment();
        assertEq(counter.get(), 3);
    }
}
