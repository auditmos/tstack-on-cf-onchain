// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {DeploymentRegistry} from "../script/DeploymentRegistry.sol";

contract DeploymentRegistryTest is Test {
    function _path(string memory suffix) internal pure returns (string memory) {
        return string.concat("test/tmp/registry-", suffix, ".json");
    }

    function _clean(string memory path) internal {
        if (vm.exists(path)) vm.removeFile(path);
    }

    function test_WritesEntryToFreshFile() public {
        string memory path = _path("fresh");
        _clean(path);

        DeploymentRegistry.record(path, "Counter", address(0xC0));

        string memory contents = vm.readFile(path);
        assertEq(vm.parseJsonAddress(contents, ".Counter"), address(0xC0));

        _clean(path);
    }

    function test_PreservesExistingEntriesOnRedeploy() public {
        string memory path = _path("preserve");
        _clean(path);

        vm.writeFile(path, '{"Token":"0x0000000000000000000000000000000000000a11"}');

        DeploymentRegistry.record(path, "Counter", address(0xC0));

        string memory contents = vm.readFile(path);
        assertEq(
            vm.parseJsonAddress(contents, ".Token"),
            address(0x0000000000000000000000000000000000000a11)
        );
        assertEq(vm.parseJsonAddress(contents, ".Counter"), address(0xC0));

        _clean(path);
    }

    function test_CreatesParentDirectoryIfMissing() public {
        string memory dir = "test/tmp/nested-registry";
        string memory path = string.concat(dir, "/31337.json");
        if (vm.exists(path)) vm.removeFile(path);
        if (vm.exists(dir)) vm.removeDir(dir, true);

        DeploymentRegistry.record(path, "Counter", address(0xC0));

        string memory contents = vm.readFile(path);
        assertEq(vm.parseJsonAddress(contents, ".Counter"), address(0xC0));

        vm.removeFile(path);
        vm.removeDir(dir, true);
    }

    function test_OverwritesEntryForSameContract() public {
        string memory path = _path("overwrite");
        _clean(path);

        DeploymentRegistry.record(path, "Counter", address(0xAA));
        DeploymentRegistry.record(path, "Counter", address(0xBB));

        string memory contents = vm.readFile(path);
        assertEq(vm.parseJsonAddress(contents, ".Counter"), address(0xBB));
        string[] memory keys = vm.parseJsonKeys(contents, "$");
        assertEq(keys.length, 1);

        _clean(path);
    }
}
