// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";
import {DeployCounter} from "../script/DeployCounter.s.sol";

contract DeployCounterTest is Test {
    function _path(string memory suffix) internal pure returns (string memory) {
        return string.concat("test/tmp/registry-", suffix, ".json");
    }

    function _clean(string memory path) internal {
        if (vm.exists(path)) vm.removeFile(path);
    }

    function test_DeployScriptDeploysCounterAndRecordsAddress() public {
        string memory path = _path("deploy-counter");
        _clean(path);

        DeployCounter script = new DeployCounter();
        address deployed = script.deployTo(path);

        assertGt(deployed.code.length, 0);
        assertEq(Counter(deployed).get(), 0);

        string memory contents = vm.readFile(path);
        assertEq(vm.parseJsonAddress(contents, ".Counter"), deployed);

        _clean(path);
    }
}
