import dotenv from 'dotenv';

dotenv.config();

import { DeployFunction } from 'hardhat-deploy/types';
import { deployments, network } from 'hardhat';
const { ethers } = require('hardhat');

const getAccounts = async () => ({
  deployer: await new ethers.Wallet(process.env.WALLET_PRIVATE_KEY),
});

const func: DeployFunction = async () => {
  const accounts = await getAccounts();

  console.log('*************************************');
  console.log(`* Deploy To ${network.name} network`);
  console.log('*************************************\n');

  const jgkShougi = await deployments.deploy('JgkShougi', {
    from: accounts.deployer.address,
  });
  console.log(`JgkShougi: ${jgkShougi.address}`);

  console.log('\nAll Contracts Deployed Successfully');
};

export default func;
