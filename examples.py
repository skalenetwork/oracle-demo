#   -*- coding: utf-8 -*-
#
#   This file is part of SKALE Oracle-demo
#
#   Copyright (C) 2019 SKALE Labs
#
#   This program is free software: you can redistribute it and/or modify
#   it under the terms of the GNU Affero General Public License as published by
#   the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#
#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU Affero General Public License for more details.
#
#   You should have received a copy of the GNU Affero General Public License
#   along with this program.  If not, see <https://www.gnu.org/licenses/>.

import time
import json
import requests
import os
from web3 import Web3
from Crypto.Hash import keccak

MIN_POW_RESULT = 10000
MAX_POW_NUMBER = 100000

url = os.environ.get('ENDPOINT', 'http://127.0.0.1:2234')
w3 = Web3(Web3.HTTPProvider(url))

# Chain Id of requested chain, not destination chain.
# If you want to reqiest data to the Skale-chain from ETH, you should use chain_id for Skale-chain
cid = w3.eth.chain_id
headers = {'Content-type': 'application/json'}


def send_oracle_request(request):
    ts = str(int(time.time())) + '000'
    i = 0
    print('========== Calculating PoW number ==========')
    # Calculate POW as a required condition for the Oracle requests on Skale
    while i < MAX_POW_NUMBER:
        pow = str(i)
        # Formating request body with triming empty spaces.
        # Skale Oracle removes empy spaces in requested string and calculate POW.
        # Oracle returns exception if results of POW from sender and POW in Oracle are different
        s = '{'+request.replace(" ", "")+',"time":'+ts+',"pow":'+pow+'}'
        k = keccak.new(digest_bits=256)
        k.update(str.encode(s))
        b = "0x" + k.hexdigest()
        f = int(b, base=16)
        res = (2 ** 256 - 1) / f
        if res > 10000:
            print(f'PoW number: {i}')   
            break
        i += 1
    #  Formatting JSON-RPC call to Oracle
    print('========== Sending request to Oracle ==========')
    call_data = {
        "id": 83,
        "jsonrpc": "2.0",
        "method": 'oracle_submitRequest',
        "params": [s],
    }

    print('Request >>> ', call_data)
    # Response hash valid for 15 seconds after sending
    response = requests.post(url, json=call_data, headers=headers).json()
    print('Response <<< ', response)
    return response


def check_result(hash):
    print('========== Getting result from Oracle ==========')
    j = 0
    response2 = {}
    while (j < 15):
        call_data = {
            "id": 83,
            "jsonrpc": "2.0",
            "method": 'oracle_checkResult',
            "params": [hash],
        }
        if j == 0:
            print('Request >>> ', call_data)
        response2 = requests.post(url, json=call_data, headers=headers).json()
        print('Response <<< ', response2)
        if not response2.get('error'):
            break
        j += 1
        time.sleep(1)

    rs = json.loads(response2['result'])
    print()
    print(f'Result: {rs.get("rslts")}')
    print(f'Signatures: {rs.get("sigs")}')


def run():
    example_requests = [
        # response with array of objects
        f'"cid":f"{cid}","uri":"https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=1&aggregate=3&e=CCCAGG","jsps":["/Data/Data/0/high","/Data/Data/0/low","/Data/Data/1/high","/Data/Data/1/low","/Data/Data/2/high","/Data/Data/2/low"],"encoding":"json"',
        # api get Worldtime api
        f'"cid":{cid},"uri":"http://worldtimeapi.org/api/timezone/Europe/Kiev","jsps":["/unixtime","/day_of_year"],"trims":[1,1],"encoding":"json"',
        # api post
        f'"cid":{cid},"uri":"http://httpbin.org/anything","jsps":["/url","/headers/Content-Length"],"encoding":"json"',
        # cryptocompare api call
        f'"cid":{cid},"uri":"https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=USD&limit=2","jsps":["/Data/Data/0/open","/Data/Data/1/volumeto"],"trims":[1,1],"encoding":"json"',
        # eth_call to another Skale-chain "harsh-alsuhail"
        f'"cid":{cid},"uri":"https://mainnet.skalenodes.com/v1/harsh-alsuhail","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x588801ca36558310d91234afc2511502282b1621","data":"0x1dd7cecf000000000000000000000000e5f4d428556c472ad26ef5f02700c08dc4f1a5940000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000e68617273682d616c73756861696c000000000000000000000000000000000000","gas":"0xfffff"}},"latest"]'
        # Goerli eth_call  owner_of NFT
        f'"cid":{cid},"uri":"eth://","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0xEb2f5cC16a97CA323BF73AE2d9AA19c5c9366857","data":"0x6352211e0000000000000000000000000000000000000000000000000000000000000000","gas":"0xfffff"}},"latest"]',
        # ETH Mainnet SKL ERC20 Balance check
        f'"cid":{cid},"uri":"eth://","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x07865c6e87b9f70255377e024ace6630c1eaa37f","data":"0x70a082310000000000000000000000002170ed0880ac9a755fd29b2688956bd959f933f8","gas":"0xfffff"}},"latest"]',
        # Arbitrum eth_call ownerOf NFT
        f'"cid":{cid},"uri":"https://rpc.ankr.com/arbitrum","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0xfae39ec09730ca0f14262a636d2d7c5539353752","data":"0x6352211e000000000000000000000000000000000000000000000000000000000000007b","gas":"0xfffff"}},"latest"]',
        # BSC eth_call ERC20 Balance
        f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x3a23f695cf01ed40fa7f53d89e60bdff0bddd879","to":"0x2170Ed0880ac9A755fd29B2688956BD959F933F8","data":"0x70a082310000000000000000000000003a23f695cf01ed40fa7f53d89e60bdff0bddd879","gas":"0xffffff"}},"latest"]',
        # Oracle: BSC ownerOf NFT check
        f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x3d24c45565834377b59fceaa6864d6c25144ad6c","data":"0x6352211e0000000000000000000000000000000000000000000000000000000000204884","gas":"0xfffff"}},"latest"]',
        # BSC check NFT metadata
        f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x3d24c45565834377b59fceaa6864d6c25144ad6c","data":"0xc87b56dd0000000000000000000000000000000000000000000000000000000000204884","gas":"0xfffff"}},"latest"]',
        # BSC Multicall check 5 items: Failed as a long request body >> 1024 bytes
        f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb","data":"0x252dba420000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000406fdde0300000000000000000000000000000000000000000000000000000000000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000495d89b4100000000000000000000000000000000000000000000000000000000000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d5600000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004313ce56700000000000000000000000000000000000000000000000000000000000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000418160ddd00000000000000000000000000000000000000000000000000000000000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002470a082310000000000000000000000003d24c45565834377b59fceaa6864d6c25144ad6c00000000000000000000000000000000000000000000000000000000","gas":"0xfffff"}},"latest"]',
        # BSC Multicall check 3 items: Failed as a long request body >> 1024 bytes
        f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb","data":"0x252dba4200000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000160000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d5600000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004313ce56700000000000000000000000000000000000000000000000000000000000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000418160ddd00000000000000000000000000000000000000000000000000000000000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002470a082310000000000000000000000003d24c45565834377b59fceaa6864d6c25144ad6c00000000000000000000000000000000000000000000000000000000","gas":"0xfffff"}},"latest"]',
        # BSC Multicall check 2 items: Failed as a long request body >> 1024 bytes
        f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb","data":"0x252dba4200000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000418160ddd00000000000000000000000000000000000000000000000000000000000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002470a082310000000000000000000000003d24c45565834377b59fceaa6864d6c25144ad6c00000000000000000000000000000000000000000000000000000000","gas":"0xfffff"}},"latest"]',
        # BSC Multicall check 1 item
        f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],"encoding":"json","ethApi":"eth_call","params":[{{"from":"0x0000000000000000000000000000000000000000","to":"0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb","data":"0x252dba42000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000418160ddd00000000000000000000000000000000000000000000000000000000","gas":"0xfffff"}},"latest"]',

        # not supported methods for 2.1.1 release
        # # oracle getGasPrice
        # f'"cid":{cid},"uri":"eth://","jsps":["/result"],""encoding":"json","ethApi":"eth_gasPrice","params":[]',
        # # getBlockNumber
        # f'"cid":{cid},"uri":"eth://","jsps":["/result"],encoding":"json","ethApi":"eth_blockNumber","params":[]',
        # # get blockByNumber
        # f'"cid":{cid},"uri":"eth://","jsps":["/result/timestamp"],encoding":"json","ethApi":"eth_getBlockByNumber","params":["0x0",false]"',
        # # get blockByHash
        # f'"cid":{cid},"uri":"eth://","jsps":["/result/timestamp"],encoding":"json","ethApi":"eth_getBlockByHash","params":["0xaddbab0cf8f32d7954f66771b54e0794cd22ee067a4d31fb1baa6cc812c79d77",false]',
        # # getBalance call
        # f'"cid":{cid},"uri":"eth://","jsps":["/result"],encoding":"json","ethApi":"eth_getBalance","params":["0x26190C856477F372d7f51ab7bc8eB00765A5F288","latest"]',
        # # Arbitrum gasPrice call
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/arbitrum","jsps":["/result"],encoding":"json","ethApi":"eth_gasPrice","params":[]',
        # # Arbitrum blockNumber
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/arbitrum","jsps":["/result"],encoding":"json","ethApi":"eth_blockNumber","params":[]',
        # # Arbitrum blockByNumber
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/arbitrum","jsps":["/result"],encoding":"json","ethApi":"eth_gasBlockByNymber","params":["1",false]',
        # # Arbitrum blockByHash
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/arbitrum","jsps":["/result"],encoding":"json","ethApi":"eth_getBlockByHash","params":["0xc91d21cf56df699f7bdc73b6d0a5296e04d26e5298bd208bb23f8f49a07e3cab",false]',
        # # BSC gasPrice call
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],encoding":"json","ethApi":"eth_gasPrice","params":[]',
        # # BSC blockNumber
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],encoding":"json","ethApi":"eth_blockNumber","params":[]',
        # # BSC blockByNumber
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],encoding":"json","ethApi":"eth_gasBlockByNymber","params":["latest",false]',
        # # BSC blockByHash
        # f'"cid":{cid},"uri":"https://rpc.ankr.com/bsc","jsps":["/result"],encoding":"json","ethApi":"eth_getBlockByHash","params":["0x2fe3db7ec87e719adb1ba5efc7ce5f529779f6416653c0f7faa14726c22912c4",false]',
    ]
    for request in example_requests:
        start = time.time()
        response = send_oracle_request(request)
        if response.get('result'):
            try:
                check_result(response['result'])
                print(f'Time:{(time.time() - start)}')
                print('')
                print('')
            except KeyError as e:
                print('Exception is', e)
        else:
            print('Send oracle request failed')


run()
