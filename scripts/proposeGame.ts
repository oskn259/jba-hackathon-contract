import fs from 'fs';
import { ethers } from 'ethers';
import { task } from 'hardhat/config';

task('proposeGame', 'propose game')
  .addParam("privateKey", "Proposer's private key")
  .addParam("boardId", "board ID to give to created game")
  .setAction(async (taskArgs, hre) => {
    const privateKey = taskArgs.privateKey as string;
    const boardId = taskArgs.boardId as string;

    const provider = new ethers.providers.JsonRpcProvider(hre.network.config.url, hre.network.config.chainId);
    const signer = new ethers.Wallet(privateKey, provider);

    const jgkShougiAbi = JSON.parse(fs.readFileSync(`${__dirname}/../deployments/${hre.network.name}/JgkShougi.json`, 'utf8'));
    const contractAddress = {
      jgkShougi: jgkShougiAbi.address,
    };
    const jgkShougi = await hre.ethers.getContractAt('JgkShougi', contractAddress.jgkShougi, signer);

    const f = async () => {
      await jgkShougi.connect(signer).proposeGame(boardId, { gasLimit: 2000000, value: 10000 }).then(tx => tx.wait());
    }

    await f();
  });
