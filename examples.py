import time
from Crypto.Hash import SHA3_256
import json
import requests

MIN_POW_RESULT = 10000
MAX_POW_NUMBER = 100000
url=''
headers = {'Content-type': 'application/json'}


def send_oracle_request():
    ts = str(int(time.time())) + '000'
    i = 0
    print('========== Calculating PoW number ==========')

    while i < MAX_POW_NUMBER:
        pow = str(i)
        s = '{"cid":1,"uri":"http://worldtimeapi.org/api/timezone/Europe/Kiev","jsps":["/unixtime","/day_of_year"],"trims":[1,1],"time":'+ts+',"pow":'+pow+'}'
        k = SHA3_256.new()
        k.update(str.encode(s))
        b = "0x" + k.hexdigest()
        f = int(b, base=16)
        res = (2 ** 256 - 1) / f
        if res > 10000:
            print(f'PoW number: {i}')
            break
        i += 1

    print('')
    print('')
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
    print('')
    print('')
    print('========== Getting result from Oracle ==========')
    j = 0
    response2 = {}
    while (j < 5) :
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
    response = send_oracle_request()
    check_result(response['result'])