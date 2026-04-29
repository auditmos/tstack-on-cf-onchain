// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";
import {DeploymentRegistry} from "./DeploymentRegistry.sol";

contract DeployCounter is Script {
    function run() external {
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        deployTo(path);
    }

    function deployTo(string memory registryPath) public returns (address) {
        vm.startBroadcast();
        Counter counter = new Counter();
        vm.stopBroadcast();

        DeploymentRegistry.record(registryPath, "Counter", address(counter));
        return address(counter);
    }
}
