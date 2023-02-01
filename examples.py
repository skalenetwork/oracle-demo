import time
from Crypto.Hash import keccak
import json
import requests

MIN_POW_RESULT = 10000
MAX_POW_NUMBER = 100000
url='http://127.0.0.1:2234'
headers = {'Content-type': 'application/json'}


def send_oracle_request(request):
    ts = str(int(time.time())) + '000'
    i = 0
    print('========== Calculating PoW number ==========')

    while i < MAX_POW_NUMBER:
        pow = str(i)
        s = '{'+request+',"time":'+ts+',"pow":'+pow+'}'
        k = keccak.new(digest_bits=256)
        k.update(str.encode(s))
        b = "0x" + k.hexdigest()
        f = int(b, base=16)
        res = (2 ** 256 - 1) / f
        if res > 10000:
            print(f'PoW number: {i}')
            break
        i += 1

    print('========== Sending request to Oracle ==========')
    call_data = {
        "id": 83,
        "jsonrpc": "2.0",
        "method": 'oracle_submitRequest',
        "params": [s],
    }

    print('Request >>> ', call_data)
    response = requests.post(url,json=call_data,headers=headers).json()
    print('Response <<< ', response)
    return response


def check_result(hash):
    time.sleep(3)
    print('========== Getting result from Oracle ==========')
    j = 0
    response2 = {}
    while (j < 15) :
        call_data = {
            "id": 83,
            "jsonrpc": "2.0",
            "method": 'oracle_checkResult',
            "params": [hash],
        }
        if j == 0:
            print('Request >>> ', call_data)
        response2 = requests.post(url,json=call_data,headers=headers).json()
        print('Response <<< ', response2)
        if not response2.get('error'):
            break
        j+=1
        time.sleep(1)

    rs = json.loads(response2['result'])
    print()
    print(f'Result: {rs.get("rslts")}')
    print(f'Signatures: {rs.get("sigs")}')


def run():
    example_requests = [
        # request to server
        '"cid":1,"uri":"http://worldtimeapi.org/api/timezone/Europe/Kiev","jsps":["/unixtime","/day_of_year"],"trims":[1,1]',
        '"cid":1,"uri":"https://www.binance.com/api/v3/time","jsps":["/serverTime"],"trims":[4]',

        # eth_gasPrice
        '"cid":1,"uri":"geth://","jsps":["/result"],"post":"{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"method\\\":\\\"eth_gasPrice\\\",\\\"params\\\":[],\\\"id\\\":1}"',

        # eth_getBlockByNumber
        '"cid":1,"uri":"geth://","jsps":["/result/timestamp"],"post":"{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"method\\\":\\\"eth_getBlockByNumber\\\",\\\"params\\\":[\\\"0x1234\\\",false],\\\"id\\\":1}"',
        '"cid":1,"uri":"geth://","jsps":["/result/hash"],"post":"{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"method\\\":\\\"eth_getBlockByNumber\\\",\\\"params\\\":[\\\"0x1234\\\",false],\\\"id\\\":1}"',
        '"cid":1,"uri":"geth://","jsps":["/result/logsBloom"],"post":"{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"method\\\":\\\"eth_getBlockByNumber\\\",\\\"params\\\":[\\\"0x1234\\\",false],\\\"id\\\":1}"',

        # eth_getBlockByHash
        '"cid":1,"uri":"geth://","jsps":["/result/timestamp"],"post":"{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"method\\\":\\\"eth_getBlockByHash\\\",\\\"params\\\":[\\\"0xaddbab0cf8f32d7954f66771b54e0794cd22ee067a4d31fb1baa6cc812c79d77\\\",false],\\\"id\\\":1}"',

        # eth_call
        '"cid":1,"uri":"geth://","jsps":["/result"],"post":"{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"method\\\":\\\"eth_call\\\",\\\"params\\\":[{\\\"to\\\":\\\"0xebe8efa441b9302a0d7eaecc277c09d20d684540\\\",\\\"data\\\":\\\"0x45848dfc\\\"},\\\"latest\\\"],\\\"id\\\":1}"',
    ]
    for request in example_requests:
        start = time.time()
        response = send_oracle_request(request)
        if response.get('result'):
            check_result(response['result'])
            print(f'Time:{(time.time() - start)}')
            print('')
            print('')
        else:
            print('Send oracle request failed')

run()
