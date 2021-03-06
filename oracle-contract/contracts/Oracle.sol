// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.13;

import "./Verifier.sol";

contract Oracle is Verifier {
    mapping(bytes32 => string) public data;

    event DataUpdated(uint256 indexed cid, uint256 indexed time);

    function setOracleResponse(
        uint256 cid,
        string memory uri,
        string[] memory jsps,
        uint256[] memory trims,
        string memory post,
        uint256 time,
        string[] memory rslts,
        Signature[] memory sigs
    )
        public
    {
        require(jsps.length > 0 && jsps.length == rslts.length && (trims.length == 0 || trims.length == rslts.length), "Incorrect number of results");
        // verify signature
        require(sigs.length == getNumberOfNodesInSchain(), "Invalid length of signatures");
        uint256 verifiedAmount = 0;
        string memory oracleData = combineOracleResponse(cid, uri, jsps, trims, post, time, rslts);
        bytes32 hashedMessage = keccak256(abi.encodePacked(oracleData));
        for (uint256 i = 0; i < sigs.length; i++) {
            if (sigs[i].v != 0 || sigs[i].r != bytes32(0) || sigs[i].s != bytes32(0)) {
                verifiedAmount += verifySignature(i, hashedMessage, sigs[i]) ? 1 : 0;
            }
        }
        require(verifiedAmount >= getCountOfTrustNumber(), "Verification is failed");
        // store results
        for (uint256 i = 0; i < jsps.length; i++) {
            data[keccak256(abi.encodePacked(string.concat(uri, jsps[i], (bytes(post).length > 0 ? post : ""))))] = rslts[i];
        }
        emit DataUpdated(cid, time);
    }

    function combineOracleResponse(
        uint256 cid,
        string memory uri,
        string[] memory jsps,
        uint256[] memory trims,
        string memory post,
        uint256 time,
        string[] memory rslts
    )
        public
        pure
        returns (string memory wholeData)
    {
        wholeData = "{";
        wholeData = string.concat(wholeData, "\"cid\":", Strings.toString(cid), ",");
        wholeData = string.concat(wholeData, "\"uri\":\"", uri, "\",");
        wholeData = string.concat(wholeData, "\"jsps\":[");
        for (uint256 i = 0; i < jsps.length - 1; i++) {
            wholeData = string.concat(wholeData, "\"", jsps[i], "\",");
        }
        wholeData = string.concat(wholeData, "\"", jsps[jsps.length - 1], "\"],");
        if (trims.length != 0) {
            wholeData = string.concat(wholeData, "\"trims\":[");
            for (uint256 i = 0; i < trims.length - 1; i++) {
                wholeData = string.concat(wholeData, Strings.toString(trims[i]), ",");
            }
            wholeData = string.concat(wholeData, Strings.toString(trims[trims.length - 1]), "],");
        }
        if (bytes(post).length != 0) {
            wholeData = string.concat(wholeData, "\"post\":\"", post, "\",");
        }
        wholeData = string.concat(wholeData, "\"time\":", Strings.toString(time), ",");
        wholeData = string.concat(wholeData, "\"rslts\":[");
        for (uint256 i = 0; i < rslts.length - 1; i++) {
            if (!_compareString(rslts[i], "null")) {
                wholeData = string.concat(wholeData, "\"", rslts[i], "\",");
            } else {
                wholeData = string.concat(wholeData, "null,");
            }
        }
        if (!_compareString(rslts[rslts.length - 1], "null")) {
            wholeData = string.concat(wholeData, "\"", rslts[rslts.length - 1], "\"],");
        } else {
            wholeData = string.concat(wholeData, "null],");
        }
    }

    function _compareString(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}