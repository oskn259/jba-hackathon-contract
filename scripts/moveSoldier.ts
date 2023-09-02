import fs from 'fs';
import {BigNumber, ethers} from 'ethers';
import { task } from 'hardhat/config';

task('moveSoldier', 'move soldier')
  .addParam("boardId", "Board ID to accept game")
  .addParam("privateKey", "Player's private key")
  .addParam("soldierId", "Soldier ID to move")
  .addParam("x", "Destination x")
  .addParam("y", "Destination y")
  .setAction(async (taskArgs, hre) => {
    const boardId = BigNumber.from(taskArgs.boardId);
    const privateKey = taskArgs.privateKey as string;
    const soldierId = BigNumber.from(taskArgs.soldierId);
    const x = Number(taskArgs.x);
    const y = Number(taskArgs.y);

    const provider = new ethers.providers.JsonRpcProvider(hre.network.config.url, hre.network.config.chainId);
    const signer = new ethers.Wallet(privateKey, provider);

    const jgkShougiAbi = JSON.parse(fs.readFileSync(`${__dirname}/../deployments/${hre.network.name}/JgkShougi.json`, 'utf8'));
    const contractAddress = {
      jgkShougi: jgkShougiAbi.address,
    };
    const jgkShougi = await hre.ethers.getContractAt('JgkShougi', contractAddress.jgkShougi, signer);

    const f = async () => {
      await jgkShougi.connect(signer).moveSoldier(boardId, soldierId, x, y, { gasLimit: 2000000 }).then(tx => tx.wait());
    }

    await f();
  });
