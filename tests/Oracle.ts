// SPDX-License-Identifier: AGPL-3.0-only

/**
 * @license
 * SKALE IMA
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @file CommunityLocker.ts
 * @copyright SKALE Labs 2019-Present
 */

import chaiAsPromised from "chai-as-promised";
import chai = require("chai");
import { OracleTester } from "../typechain";
import { stringValue } from "./utils/helper";

chai.should();
chai.use((chaiAsPromised as any));

import { deployOracle } from "./utils/deploy/oracle";

import { ethers, web3 } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { currentTime, skipTime } from "./utils/time";

const schainName = "TestSchain";

describe("Oracle", () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;

    let oracle: OracleTester;

    before(async () => {
        [deployer, user] = await ethers.getSigners();
    });

    beforeEach(async () => {
        oracle = await deployOracle();
    })

    describe("Binance example", async () => {

        // Binance request responce
        // {
        //     "cid":1,
        //     "uri":"https://www.binance.com/api/v3/time",
        //     "jsps":["/serverTime"],
        //     "trims":[4],
        //     "time":1649253252000,
        //     "rslts":["164925325"],
        //     "sigs":[
        //         "1:f8e1585c9c10e8121ba813015a44528089d421774ac35cee0f73b0f2b2ae26:38bcb22007487fb5dbe90434ccdbee88aa82281353e497f9d09b636a6997eecb",
        //         "0:b937ec95b75c0645719bbfbe302e7d35024a5f44162dc9d12a91f04ffc062b5e:5cbdfd134194d0f9df2ac9ac8b5ac2e431cbeb9a12610e78134a11e18341a761",
        //         null,
        //         null
        //     ]
        // }

        const dataToSign = "{\"cid\":1,\"uri\":\"https://www.binance.com/api/v3/time\",\"jsps\":[\"/serverTime\"],\"trims\":[4],\"time\":1649253252000,\"rslts\":[\"164925325\"],";
    
        const cid: number = 1;
        const uri: string = "https://www.binance.com/api/v3/time";
        const jsps: string[] = ["/serverTime"];
        const trims: number[] = [4];
        const post: string = "";
        const time: number = 1649253252000;
        const rslts: string[] = ["164925325"];
        const sigs: {v: number, r: string, s: string}[] = [
            {
                v: 28,
                r: "0x00f8e1585c9c10e8121ba813015a44528089d421774ac35cee0f73b0f2b2ae26",
                s: "0x38bcb22007487fb5dbe90434ccdbee88aa82281353e497f9d09b636a6997eecb"
            },
            {
                v: 27,
                r: "0xb937ec95b75c0645719bbfbe302e7d35024a5f44162dc9d12a91f04ffc062b5e",
                s: "0x5cbdfd134194d0f9df2ac9ac8b5ac2e431cbeb9a12610e78134a11e18341a761"
            },
            {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000"
            },
            {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000"
            },
        ];

        it("should create a JSON string to sign", async () => {
            const dataByContract = await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts);

            assert(dataByContract.should.be.equal(dataToSign));
        });
    
        it("should verify oracle response", async () => {
            
            await oracle.setNumberOfNodes(4);
            const numberOfNodes = await oracle.getNumberOfNodesInSchain();
            assert(numberOfNodes.should.be.equal(4));

            const countOfTrust = await oracle.getCountOfTrustNumber();
            assert(countOfTrust.should.be.equal(2));

            await oracle.setNodeAddress("0x594e7e984d543208ea72eb7368a4a44db2566233");
            await oracle.setNodeAddress("0x870b9d69e9b456b40f152a3b2f1ea979677621a5");
            await oracle.setNodeAddress("0x57b19c2f8545de9ca195e7740a76423bfe5f62b5");
            await oracle.setNodeAddress("0x82558add227d1c93ec54630059df7fc59e9e075d");

            const nodeAddress1 = await oracle.nodeAddresses(0);
            const nodeAddress2 = await oracle.nodeAddresses(1);
            const nodeAddress3 = await oracle.nodeAddresses(2);
            const nodeAddress4 = await oracle.nodeAddresses(3);

            assert(nodeAddress1.should.be.equal("0x594e7e984d543208eA72eb7368A4a44db2566233"));
            assert(nodeAddress2.should.be.equal("0x870b9d69E9b456b40F152A3b2f1EA979677621a5"));
            assert(nodeAddress3.should.be.equal("0x57B19C2F8545De9ca195E7740a76423BFe5F62B5"));
            assert(nodeAddress4.should.be.equal("0x82558Add227d1c93Ec54630059dF7FC59E9E075d"));
    
            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            const res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            assert(res.should.be.equal(rslts[0]));
        });

    });

    describe("Manual example", async () => {

        // Manual request responce
        // {
        //     "cid":1234,
        //     "uri":"https://www.helloworld.com",
        //     "jsps":["/greetings"],
        //     "trims":[0],
        //     "time":1649253252000,
        //     "rslts":["Hello_World"],
        // }

        const dataToSign = "{\"cid\":1234,\"uri\":\"https://www.helloworld.com\",\"jsps\":[\"/greetings\"],\"trims\":[0],\"time\":1649253252000,\"rslts\":[\"Hello_World\"],";
    
        const cid: number = 1234;
        const uri: string = "https://www.helloworld.com";
        const jsps: string[] = ["/greetings"];
        const trims: number[] = [0];
        const post: string = "";
        const time: number = 1649253252000;
        const rslts: string[] = ["Hello_World"];
        const sigs: {v: number, r: string, s: string}[] = [];

        it("should create a JSON string to sign", async () => {
            const dataByContract = await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts);

            assert(dataByContract.should.be.equal(dataToSign));
        });
    
        it("should verify oracle response", async () => {

            const wallet1 = ethers.Wallet.createRandom();
            const wallet2 = ethers.Wallet.createRandom();
            const wallet3 = ethers.Wallet.createRandom();
            const wallet4 = ethers.Wallet.createRandom();
            
            await oracle.setNumberOfNodes(4);
            const numberOfNodes = await oracle.getNumberOfNodesInSchain();
            assert(numberOfNodes.should.be.equal(4));

            const countOfTrust = await oracle.getCountOfTrustNumber();
            assert(countOfTrust.should.be.equal(2));

            await oracle.setNodeAddress(wallet1.address);
            await oracle.setNodeAddress(wallet2.address);
            await oracle.setNodeAddress(wallet3.address);
            await oracle.setNodeAddress(wallet4.address);

            const nodeAddress1 = await oracle.nodeAddresses(0);
            const nodeAddress2 = await oracle.nodeAddresses(1);
            const nodeAddress3 = await oracle.nodeAddresses(2);
            const nodeAddress4 = await oracle.nodeAddresses(3);

            assert(nodeAddress1.should.be.equal(wallet1.address));
            assert(nodeAddress2.should.be.equal(wallet2.address));
            assert(nodeAddress3.should.be.equal(wallet3.address));
            assert(nodeAddress4.should.be.equal(wallet4.address));

            const signingKey1 = new ethers.utils.SigningKey(wallet1.privateKey);
            const signingKey2 = new ethers.utils.SigningKey(wallet2.privateKey);
            const signingKey3 = new ethers.utils.SigningKey(wallet3.privateKey);
            const signingKey4 = new ethers.utils.SigningKey(wallet4.privateKey);

            let data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            let digestHex = ethers.utils.hexlify(data);

            let signature1 = signingKey1.signDigest(digestHex);
            let signature2 = signingKey2.signDigest(digestHex);
            let signature3 = signingKey3.signDigest(digestHex);
            let signature4 = signingKey4.signDigest(digestHex);

            sigs.push({
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            });
            sigs.push({
                v: signature2.v,
                r: signature2.r,
                s: signature2.s,
            });
            sigs.push({
                v: signature3.v,
                r: signature3.r,
                s: signature3.s,
            });
            sigs.push({
                v: signature4.v,
                r: signature4.r,
                s: signature4.s,
            });
    
            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            let res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            assert(res.should.be.equal(rslts[0]));

            rslts[0] = "Hellow_World2";

            data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            digestHex = ethers.utils.hexlify(data);

            signature1 = signingKey1.signDigest(digestHex);
            signature2 = signingKey2.signDigest(digestHex);
            signature3 = signingKey3.signDigest(digestHex);
            signature4 = signingKey4.signDigest(digestHex);

            sigs[0] = {
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            };
            sigs[1] = {
                v: signature2.v,
                r: signature2.r,
                s: signature2.s,
            };
            sigs[2] = {
                v: signature3.v,
                r: signature3.r,
                s: signature3.s,
            };
            sigs[3] = {
                v: signature4.v,
                r: signature4.r,
                s: signature4.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            assert(res.should.be.equal(rslts[0]));
        });

        it("should not verify oracle response", async () => {

            const wallet1 = ethers.Wallet.createRandom();
            const wallet2 = ethers.Wallet.createRandom();
            const wallet3 = ethers.Wallet.createRandom();
            const wallet4 = ethers.Wallet.createRandom();
            
            await oracle.setNumberOfNodes(4);
            const numberOfNodes = await oracle.getNumberOfNodesInSchain();
            assert(numberOfNodes.should.be.equal(4));

            const countOfTrust = await oracle.getCountOfTrustNumber();
            assert(countOfTrust.should.be.equal(2));

            await oracle.setNodeAddress(wallet1.address);
            await oracle.setNodeAddress(wallet2.address);
            await oracle.setNodeAddress(wallet3.address);
            await oracle.setNodeAddress(wallet4.address);

            const nodeAddress1 = await oracle.nodeAddresses(0);
            const nodeAddress2 = await oracle.nodeAddresses(1);
            const nodeAddress3 = await oracle.nodeAddresses(2);
            const nodeAddress4 = await oracle.nodeAddresses(3);

            assert(nodeAddress1.should.be.equal(wallet1.address));
            assert(nodeAddress2.should.be.equal(wallet2.address));
            assert(nodeAddress3.should.be.equal(wallet3.address));
            assert(nodeAddress4.should.be.equal(wallet4.address));

            const signingKey1 = new ethers.utils.SigningKey(wallet1.privateKey);
            const signingKey2 = new ethers.utils.SigningKey(wallet2.privateKey);
            const signingKey3 = new ethers.utils.SigningKey(wallet3.privateKey);
            const signingKey4 = new ethers.utils.SigningKey(wallet4.privateKey);

            let data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            let digestHex = ethers.utils.hexlify(data);

            let signature1 = signingKey1.signDigest(digestHex);
            let signature2 = signingKey2.signDigest(digestHex);
            let signature3 = signingKey3.signDigest(digestHex);
            let signature4 = signingKey4.signDigest(digestHex);

            sigs[0] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
            sigs[1] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
            sigs[2] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
            sigs[3] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
    
            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs).should.be.eventually.rejectedWith("Verification is failed");

            data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            digestHex = ethers.utils.hexlify(data);

            signature1 = signingKey1.signDigest(digestHex);
            signature2 = signingKey2.signDigest(digestHex);
            signature3 = signingKey3.signDigest(digestHex);
            signature4 = signingKey4.signDigest(digestHex);

            sigs[0] = {
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs).should.be.eventually.rejectedWith("Verification is failed");

            sigs[1] = {
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs).should.be.eventually.rejectedWith("Verification is failed");

            sigs[2] = {
                v: signature3.v,
                r: signature3.r,
                s: signature3.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            const res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            assert(res.should.be.equal(rslts[0]));
        });

    });

    describe("Manual example with post", async () => {

        // Manual request responce
        // {
        //     "cid":1234,
        //     "uri":"https://www.helloworld.com",
        //     "jsps":[/greetings],
        //     "trims":[],
        //     "post": "/say_greetings"
        //     "time":1649253252000,
        //     "rslts":["Hello_World"],
        // }

        const dataToSign = "{\"cid\":1234,\"uri\":\"https://www.helloworld.com\",\"jsps\":[\"/greetings\"],\"post\":\"/say_greetings\",\"time\":1649253252000,\"rslts\":[\"Hello_World\"],";
    
        const cid: number = 1234;
        const uri: string = "https://www.helloworld.com";
        const jsps: string[] = ["/greetings"];
        const trims: number[] = [];
        const post: string = "/say_greetings";
        const time: number = 1649253252000;
        const rslts: string[] = ["Hello_World"];
        const sigs: {v: number, r: string, s: string}[] = [];

        it("should create a JSON string to sign", async () => {
            const dataByContract = await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts);

            assert(dataByContract.should.be.equal(dataToSign));
        });
    
        it("should verify oracle response", async () => {

            const wallet1 = ethers.Wallet.createRandom();
            const wallet2 = ethers.Wallet.createRandom();
            const wallet3 = ethers.Wallet.createRandom();
            const wallet4 = ethers.Wallet.createRandom();
            
            await oracle.setNumberOfNodes(4);
            const numberOfNodes = await oracle.getNumberOfNodesInSchain();
            assert(numberOfNodes.should.be.equal(4));

            const countOfTrust = await oracle.getCountOfTrustNumber();
            assert(countOfTrust.should.be.equal(2));

            await oracle.setNodeAddress(wallet1.address);
            await oracle.setNodeAddress(wallet2.address);
            await oracle.setNodeAddress(wallet3.address);
            await oracle.setNodeAddress(wallet4.address);

            const nodeAddress1 = await oracle.nodeAddresses(0);
            const nodeAddress2 = await oracle.nodeAddresses(1);
            const nodeAddress3 = await oracle.nodeAddresses(2);
            const nodeAddress4 = await oracle.nodeAddresses(3);

            assert(nodeAddress1.should.be.equal(wallet1.address));
            assert(nodeAddress2.should.be.equal(wallet2.address));
            assert(nodeAddress3.should.be.equal(wallet3.address));
            assert(nodeAddress4.should.be.equal(wallet4.address));

            const signingKey1 = new ethers.utils.SigningKey(wallet1.privateKey);
            const signingKey2 = new ethers.utils.SigningKey(wallet2.privateKey);
            const signingKey3 = new ethers.utils.SigningKey(wallet3.privateKey);
            const signingKey4 = new ethers.utils.SigningKey(wallet4.privateKey);

            let data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            let digestHex = ethers.utils.hexlify(data);

            let signature1 = signingKey1.signDigest(digestHex);
            let signature2 = signingKey2.signDigest(digestHex);
            let signature3 = signingKey3.signDigest(digestHex);
            let signature4 = signingKey4.signDigest(digestHex);

            sigs.push({
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            });
            sigs.push({
                v: signature2.v,
                r: signature2.r,
                s: signature2.s,
            });
            sigs.push({
                v: signature3.v,
                r: signature3.r,
                s: signature3.s,
            });
            sigs.push({
                v: signature4.v,
                r: signature4.r,
                s: signature4.s,
            });
    
            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            let res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            assert(res.should.be.equal(rslts[0]));

            rslts[0] = "Hellow_World2";

            data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            digestHex = ethers.utils.hexlify(data);

            signature1 = signingKey1.signDigest(digestHex);
            signature2 = signingKey2.signDigest(digestHex);
            signature3 = signingKey3.signDigest(digestHex);
            signature4 = signingKey4.signDigest(digestHex);

            sigs[0] = {
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            };
            sigs[1] = {
                v: signature2.v,
                r: signature2.r,
                s: signature2.s,
            };
            sigs[2] = {
                v: signature3.v,
                r: signature3.r,
                s: signature3.s,
            };
            sigs[3] = {
                v: signature4.v,
                r: signature4.r,
                s: signature4.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            assert(res.should.be.equal(rslts[0]));
        });

        it("should not verify oracle response", async () => {

            const wallet1 = ethers.Wallet.createRandom();
            const wallet2 = ethers.Wallet.createRandom();
            const wallet3 = ethers.Wallet.createRandom();
            const wallet4 = ethers.Wallet.createRandom();
            
            await oracle.setNumberOfNodes(4);
            const numberOfNodes = await oracle.getNumberOfNodesInSchain();
            assert(numberOfNodes.should.be.equal(4));

            const countOfTrust = await oracle.getCountOfTrustNumber();
            assert(countOfTrust.should.be.equal(2));

            await oracle.setNodeAddress(wallet1.address);
            await oracle.setNodeAddress(wallet2.address);
            await oracle.setNodeAddress(wallet3.address);
            await oracle.setNodeAddress(wallet4.address);

            const nodeAddress1 = await oracle.nodeAddresses(0);
            const nodeAddress2 = await oracle.nodeAddresses(1);
            const nodeAddress3 = await oracle.nodeAddresses(2);
            const nodeAddress4 = await oracle.nodeAddresses(3);

            assert(nodeAddress1.should.be.equal(wallet1.address));
            assert(nodeAddress2.should.be.equal(wallet2.address));
            assert(nodeAddress3.should.be.equal(wallet3.address));
            assert(nodeAddress4.should.be.equal(wallet4.address));

            const signingKey1 = new ethers.utils.SigningKey(wallet1.privateKey);
            const signingKey2 = new ethers.utils.SigningKey(wallet2.privateKey);
            const signingKey3 = new ethers.utils.SigningKey(wallet3.privateKey);
            const signingKey4 = new ethers.utils.SigningKey(wallet4.privateKey);

            let data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            let digestHex = ethers.utils.hexlify(data);

            let signature1 = signingKey1.signDigest(digestHex);
            let signature2 = signingKey2.signDigest(digestHex);
            let signature3 = signingKey3.signDigest(digestHex);
            let signature4 = signingKey4.signDigest(digestHex);

            sigs[0] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
            sigs[1] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
            sigs[2] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
            sigs[3] = {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            };
    
            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs).should.be.eventually.rejectedWith("Verification is failed");

            data = ethers.utils.id(await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts));
            digestHex = ethers.utils.hexlify(data);

            signature1 = signingKey1.signDigest(digestHex);
            signature2 = signingKey2.signDigest(digestHex);
            signature3 = signingKey3.signDigest(digestHex);
            signature4 = signingKey4.signDigest(digestHex);

            sigs[0] = {
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs).should.be.eventually.rejectedWith("Verification is failed");

            sigs[1] = {
                v: signature1.v,
                r: signature1.r,
                s: signature1.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs).should.be.eventually.rejectedWith("Verification is failed");

            sigs[2] = {
                v: signature3.v,
                r: signature3.r,
                s: signature3.s,
            };

            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            const res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            assert(res.should.be.equal(rslts[0]));
        });

    });

    describe("Time example", async () => {

        // Time request responce
        // {
        //     "cid":1,
        //     "uri":"http://worldtimeapi.org/api/timezone/Europe/Kiev",
        //     "jsps":["/unixtime","/day_of_year"],
        //     "trims":[4,0],
        //     "post": "",
        //     "time":1649420124000,
        //     "rslts":["164942012", "98"],
        // }

        const dataToSign = "{\"cid\":1,\"uri\":\"http://worldtimeapi.org/api/timezone/Europe/Kiev\",\"jsps\":[\"/unixtime\",\"/day_of_year\"],\"trims\":[4,0],\"time\":1649431737000,\"rslts\":[\"164943\",\"98\"],";
    
        const cid: number = 1;
        const uri: string = "http://worldtimeapi.org/api/timezone/Europe/Kiev";
        const jsps: string[] = ["/unixtime","/day_of_year"];
        const trims: number[] = [4,0];
        const post: string = "";
        const time: number = 1649431737000;
        const rslts: string[] = ["164943", "98"];
        const sigs: {v: number, r: string, s: string}[] = [
            {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            },
            {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            },
            {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            },
            {
                v: 0,
                r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                s: "0x0000000000000000000000000000000000000000000000000000000000000000",
            }
        ];
        const nodeAddressInSchain1: string = "0x594e7e984d543208eA72eb7368A4a44db2566233";
        const nodeAddressInSchain2: string = "0x870b9d69E9b456b40F152A3b2f1EA979677621a5";
        const nodeAddressInSchain3: string = "0x57B19C2F8545De9ca195E7740a76423BFe5F62B5";
        const nodeAddressInSchain4: string = "0x82558Add227d1c93Ec54630059dF7FC59E9E075d";

        it("should create a JSON string to sign", async () => {
            const dataByContract = await oracle.combineOracleResponse(cid, uri, jsps, trims, post, time, rslts);

            assert(dataByContract.should.be.equal(dataToSign));
        });
    
        it("should verify oracle response", async () => {
            
            await oracle.setNumberOfNodes(4);
            const numberOfNodes = await oracle.getNumberOfNodesInSchain();
            assert(numberOfNodes.should.be.equal(4));

            const countOfTrust = await oracle.getCountOfTrustNumber();
            assert(countOfTrust.should.be.equal(2));

            await oracle.setNodeAddress(nodeAddressInSchain1);
            await oracle.setNodeAddress(nodeAddressInSchain2);
            await oracle.setNodeAddress(nodeAddressInSchain3);
            await oracle.setNodeAddress(nodeAddressInSchain4);

            const nodeAddress1 = await oracle.nodeAddresses(0);
            const nodeAddress2 = await oracle.nodeAddresses(1);
            const nodeAddress3 = await oracle.nodeAddresses(2);
            const nodeAddress4 = await oracle.nodeAddresses(3);

            assert(nodeAddress1.should.be.equal(nodeAddressInSchain1));
            assert(nodeAddress2.should.be.equal(nodeAddressInSchain2));
            assert(nodeAddress3.should.be.equal(nodeAddressInSchain3));
            assert(nodeAddress4.should.be.equal(nodeAddressInSchain4));
    
            await oracle.setOracleResponse(cid, uri, jsps, trims, post, time, rslts, sigs);

            // const res = await oracle.data(ethers.utils.id(uri + jsps[0] + post));
            // assert(res.should.be.equal(rslts[0]));
        });
    });

});
