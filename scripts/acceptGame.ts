import fs from 'fs';
import {BigNumber, ethers} from 'ethers';
import { task } from 'hardhat/config';

task('acceptGame', 'accept proposed game')
  .addParam("boardId", "Board ID to accept game")
  .addParam("privateKey", "Challenger's private key")
  .setAction(async (taskArgs, hre) => {
    const boardId = BigNumber.from(taskArgs.boardId);
    const privateKey = taskArgs.privateKey as string;

    const provider = new ethers.providers.JsonRpcProvider(hre.network.config.url, hre.network.config.chainId);
    const signer = new ethers.Wallet(privateKey, provider);

    const jgkShougiAbi = JSON.parse(fs.readFileSync(`${__dirname}/../deployments/${hre.network.name}/JgkShougi.json`, 'utf8'));
    const contractAddress = {
      jgkShougi: jgkShougiAbi.address,
    };
    const jgkShougi = await hre.ethers.getContractAt('JgkShougi', contractAddress.jgkShougi, signer);

    const f = async () => {
      await jgkShougi.connect(signer).acceptGame(boardId, { gasLimit: 2000000, value: 10000 }).then(tx => tx.wait());
      console.log(`Accepted`);
    }

    await f();
  });
