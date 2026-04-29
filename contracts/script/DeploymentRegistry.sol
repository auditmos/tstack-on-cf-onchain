// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {VmSafe} from "forge-std/Vm.sol";

library DeploymentRegistry {
    VmSafe private constant VM = VmSafe(address(uint160(uint256(keccak256("hevm cheat code")))));

    function record(string memory path, string memory name, address addr) internal {
        string memory obj = string.concat("DeploymentRegistry:", path);
        string memory json;

        if (VM.exists(path)) {
            string memory existing = VM.readFile(path);
            string[] memory keys = VM.parseJsonKeys(existing, "$");
            bytes32 nameHash = keccak256(bytes(name));
            for (uint256 i = 0; i < keys.length; i++) {
                if (keccak256(bytes(keys[i])) == nameHash) continue;
                address existingAddr = VM.parseJsonAddress(existing, string.concat(".", keys[i]));
                VM.serializeAddress(obj, keys[i], existingAddr);
            }
        } else {
            string memory parent = _parentDir(path);
            if (bytes(parent).length > 0 && !VM.exists(parent)) {
                VM.createDir(parent, true);
            }
        }

        json = VM.serializeAddress(obj, name, addr);
        VM.writeJson(json, path);
    }

    function _parentDir(string memory path) private pure returns (string memory) {
        bytes memory b = bytes(path);
        for (uint256 i = b.length; i > 0; i--) {
            if (b[i - 1] == "/") {
                bytes memory parent = new bytes(i - 1);
                for (uint256 j = 0; j < i - 1; j++) parent[j] = b[j];
                return string(parent);
            }
        }
        return "";
    }
}
