import dotenv from 'dotenv';

dotenv.config();

import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('hardhat-contract-sizer');

import './scripts/proposeGame';
import './scripts/acceptGame';
import './scripts/getBoard';
import './scripts/moveSoldier';
import './scripts/claimLoot';

const config: HardhatUserConfig = {
  solidity: "0.8.19",

  networks: {
    local: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
      accounts: [`${process.env.WALLET_PRIVATE_KEY}`],
      gas: 0,
      gasPrice: 0,
    },
    mumbai: {
      url: 'https://mumbai.rpc.thirdweb.com',
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
    polygonzkEvm: {
      url: 'https://rpc.public.zkevm-test.net',
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: [
        {
          privateKey: "0x02b2d2484dc5d2cb1387d7da72a8c297955368f66f81d535def04c4e70166c56", // address: 0x34184fc3875333670AEc9B6227Dd6C36631E5A76
          balance: "10000000000000000000000"
        },
        {
          privateKey: "0x8b9ba2c1793286e14d6fed3856430b1097a30813872081e617fc13049c78df84", // address: 0xEFB0B822Ff77779e2772990645F5BF39B0DbC4D0
          balance: "10000000000000000000000"
        },
        {
          privateKey: "0x1ded4fc275d23580278db2a44042be73ef0de59adfe5c28585f6f16e648f1a9f", // address: 0xEFB0B822Ff77779e2772990645F5BF39B0DbC4D0
          balance: "10000000000000000000000"
        },
      ]
    }
  },
};

export default config;
