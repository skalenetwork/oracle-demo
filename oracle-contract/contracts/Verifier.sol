// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./Reader.sol";

contract Verifier is Reader {

    using ECDSA for bytes32;

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function verifySignature(uint256 nodeIndex, bytes32 hashedMessage, Signature memory signature)
        public
        view
        returns (bool)
    {
        string memory pathToAddress = string.concat("skaleConfig.sChain.nodes[", Strings.toString(nodeIndex), "].owner");
        address nodeAddress = _getConfigVariableAddress(pathToAddress);
        return nodeAddress == hashedMessage.recover(signature.v, signature.r, signature.s);
    }

    function getCountOfTrustNumber() public view returns (uint) {
        uint n = getNumberOfNodesInSchain();
        return (n + 2) / 3; // n - (n * 2 + 1) / 3 + 1 = (n * 3 - n * 2 - 1 + 3) / 3 = (n + 2) / 3
    }

    function getNumberOfNodesInSchain() public view returns (uint256) {
        return _getConfigVariableUint256("skaleConfig.nodeInfo.wallets.ima.n");
    }

}