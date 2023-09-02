import fs from 'fs';
import { BigNumber } from 'ethers';
import { task } from 'hardhat/config';

task('getBoard', 'get board info')
  .addParam("boardId", "Board ID to accept game")
  .setAction(async (taskArgs, hre) => {
    const boardId = BigNumber.from(taskArgs.boardId);

    const jgkShougiAbi = JSON.parse(fs.readFileSync(`${__dirname}/../deployments/${hre.network.name}/JgkShougi.json`, 'utf8'));
    const contractAddress = {
      jgkShougi: jgkShougiAbi.address,
    };
    const jgkShougi = await hre.ethers.getContractAt('JgkShougi', contractAddress.jgkShougi);

    const f = async () => {
      const board = await jgkShougi.getBoard(boardId, { gasLimit: 2000000 });

      const obj = {
        host: board.host,
        challenger: board.challenger,
        stakeAmount: board.stakeAmount,
        status: board.status,
        turn: board.turn,
        hostSoldiers: board.hostArmy.soldiers.map(v => ({ id: v.id.toString(), x: v.x, y: v.y, category: v.category, status: v.status })),
        challengerSoldiers: board.challengerArmy.soldiers.map(v => ({ id: v.id.toString(), x: v.x, y: v.y, category: v.category, status: v.status })),
      };
      console.log(JSON.stringify(obj));
    }

    await f();
  });
