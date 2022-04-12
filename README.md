# oracle-demo
Examples of using Skale Oracle

## Install

1)  Clone this repo
2)  run `yarn install`

## Deployment

The `.env` file should include the following variables:

```bash
ENDPOINT="your mainnet RPC url, it also can be an infura endpoint"
PRIVATE_KEY="your private key for mainnet"
GASPRICE="preferred gas price (optional param)" 
```

-   deploy test version to custom network:

```bash
yarn deploy --network custom
```

-   deploy production version to custom network:

```bash
yarn deploy-production --network custom
```

## Test

```bash
yarn test
```
