import { expect } from "chai";
import { ethers } from "hardhat";
import {BigNumberish, ContractTransactionReceipt, Signer} from "ethers";
import {JgkShougi} from '../typechain-types';

const BOARD_STATUS_PROPOSING = 1;
const BOARD_STATUS_STARTED = 2;
const BOARD_STATUS_END = 3;

const SOLDIER_CATEGORY_LION = 0;
const SOLDIER_CATEGORY_HIYOKO = 1;
const SOLDIER_CATEGORY_KIRIN = 2;

const SOLDIER_STATUS_ONBOARD = 0;
const SOLDIER_STATUS_STANDBY = 1;

export const prepare = async () => {
  const [deployer, ...accounts] = await ethers.getSigners();

  const JgkShougi = await ethers.getContractFactory('JgkShougi');
  const jgkShougi = await JgkShougi.deploy({ gasLimit: 30000000 });
  await jgkShougi.deployed();

  const factories = {
    JgkShougi,
  };

  const contracts = {
    jgkShougi: jgkShougi,
  };

  return {
    deployer,
    accounts,
    factories,
    contracts,
  };
};

const propose = async (contract: JgkShougi, account: Signer) => {
  const boardId = Math.floor(Math.random() * 100000000);
  await contract
    .connect(account).proposeGame(boardId, { value: 10000 })
    .then(tx => tx.wait())
    .then(receipt => {
      if (receipt) return receipt;
      throw new Error('receipt is null');
    });

  return boardId;
}

const accept = async (contract: JgkShougi, boardId: BigNumberish, challenger: Signer) => {
  await contract
    .connect(challenger)
    .acceptGame(boardId, { value: 10000 })
    .then(tx => tx.wait())
    .then(receipt => {
      if (receipt) return receipt;
      throw new Error('receipt is null');
    });
}

describe("JgkShougi", function () {
  describe("proposeGame", function () {

    it("register game", async function () {
      const { contracts, accounts } = await prepare();
      const boardId = Math.floor(Math.random() * 100000000);

      await contracts.jgkShougi
        .connect(accounts[0]).proposeGame(boardId, { value: 10000 })
        .then(tx => tx.wait())
        .then(receipt => {
          if (receipt) return receipt;
          throw new Error('receipt is null');
        });

      await expect(
        contracts.jgkShougi.connect(accounts[0]).proposeGame(boardId, { value: 10000 })
      ).to.be.revertedWith('Another game is already there');
    });

    it("emit ProposeGame event", async function () {
      const { contracts, accounts } = await prepare();
      const boardId = Math.floor(Math.random() * 100000000);
      await expect(
        contracts.jgkShougi.connect(accounts[0]).proposeGame(boardId, { value: 10000 })
      ).to
        .emit(contracts.jgkShougi, 'ProposeGame')
        .withArgs(boardId, accounts[0].address);
    });
  });

  describe("acceptGame", function () {
    it("set board status to BOARD_STATUS_STARTED", async function () {
      const { contracts, accounts } = await prepare();
      const challenger = accounts[1];
      const boardId = await propose(contracts.jgkShougi, accounts[0]);

      await contracts.jgkShougi
        .connect(challenger)
        .acceptGame(boardId, { value: 10000 })
        .then(tx => tx.wait())
        .then(receipt => {
          if (receipt) return receipt;
          throw new Error('receipt is null');
        });

      expect(await contracts.jgkShougi.getGameStatus(boardId)).to.equal(1 /* STARTED */);
    });

    it("emits AcceptGame event", async function () {
      const { contracts, accounts } = await prepare();
      const challenger = accounts[1];
      const boardId = await propose(contracts.jgkShougi, accounts[0]);

      await expect(
        contracts.jgkShougi.connect(challenger).acceptGame(boardId, { value: 10000 })
      ).to
        .emit(contracts.jgkShougi, 'AcceptGame')
        .withArgs(boardId, challenger.address);
    });
  });

  describe("moveSoldier", function () {
    it("changes position of specified soldier", async function () {
      const { contracts, accounts } = await prepare();
      const challenger = accounts[1];
      const boardId = await propose(contracts.jgkShougi, accounts[0]);
      await accept(contracts.jgkShougi, boardId, challenger);
      const board = await contracts.jgkShougi.getBoard(boardId);
      const soldier = board.challengerArmy.soldiers.find(s => s.category === SOLDIER_CATEGORY_KIRIN);
      if (!soldier) throw new Error('kirin not found');

      // Move soldier and fetch current board
      await contracts.jgkShougi.connect(challenger).moveSoldier(boardId, soldier.id, soldier.x, soldier.y - 1).then(tx => tx.wait());
      const boardNext = await contracts.jgkShougi.getBoard(boardId);
      const soldierNext = boardNext.challengerArmy.soldiers.find(s => s.category === SOLDIER_CATEGORY_KIRIN);

      // Confirm soldier position is changed
      expect(soldierNext?.id).to.equal(soldier.id);
      expect(soldierNext?.x).to.equal(soldier.x);
      expect(soldierNext?.y).to.equal(soldier.y - 1);
      expect(soldierNext?.category).to.equal(soldier.category);
      expect(soldierNext?.status).to.equal(soldier.status);

      // Other soldiers are not changed
      boardNext.challengerArmy.soldiers.forEach((s, i) => {
        if (s.id.eq(soldier.id)) return;
        expect(s).to.eql(board.challengerArmy.soldiers[i]);
      });
      expect(boardNext.hostArmy).to.eql(board.hostArmy);
    });

    it("rejects operation that moves soldier out of bounds", async function () {
      const {contracts, accounts} = await prepare();
      const challenger = accounts[1];
      const boardId = await propose(contracts.jgkShougi, accounts[0]);
      await accept(contracts.jgkShougi, boardId, challenger);
      const board = await contracts.jgkShougi.getBoard(boardId);
      const soldier = board.challengerArmy.soldiers[0];

      await expect(
        contracts.jgkShougi.connect(challenger).moveSoldier(boardId, soldier.id, soldier.x, soldier.y + 1)
      ).to.be.revertedWith('Invalid destination');
    });

    it("emits MoveSoldier event", async function () {
      const { contracts, accounts } = await prepare();
      const challenger = accounts[1];
      const boardId = await propose(contracts.jgkShougi, accounts[0]);
      await accept(contracts.jgkShougi, boardId, challenger);
      const board = await contracts.jgkShougi.getBoard(boardId);
      const soldier = board.challengerArmy.soldiers.find(s => s.category === SOLDIER_CATEGORY_HIYOKO);
      if (!soldier) throw new Error('hiyoko not found');

      await expect(
        contracts.jgkShougi.connect(challenger).moveSoldier(boardId, soldier.id, soldier.x, soldier.y - 1)
      ).to
        .emit(contracts.jgkShougi, 'MoveSoldier')
        .withArgs(boardId, soldier.id, soldier.category, soldier.x, soldier.y - 1);
    });

    it("rejects operation from player who doesn't have turn / switches turn after player moves a soldier", async function () {
      const { contracts, accounts } = await prepare();
      const host = accounts[0];
      const challenger = accounts[1];
      const boardId = await propose(contracts.jgkShougi, accounts[0]);
      await accept(contracts.jgkShougi, boardId, challenger);

      const f = async (isHostTurn: boolean, x: number, y: number) => {
        const board = await contracts.jgkShougi.getBoard(boardId);
        const army = isHostTurn ? board.hostArmy : board.challengerArmy;
        const soldier = army.soldiers.find(s => s.category === SOLDIER_CATEGORY_KIRIN);
        if (!soldier) throw new Error('kirin not found');

        const signer = isHostTurn ? host : challenger;
        return contracts.jgkShougi.connect(signer).moveSoldier(boardId, soldier.id, soldier.x + x, soldier.y + y);
      }

      await expect(f(true, 0, 1)).to.be.revertedWith('Your illegal attempt all must fail');
      await f(false, 0, -1)
      await expect(f(false, 0, -1)).to.be.revertedWith('Your illegal attempt all must fail');
      await f(true, 0, 1)
    });

    it("allows king to move to proper position", async function () {
      const { contracts, accounts } = await prepare();
      const host = accounts[0];
      const challenger = accounts[1];
      const boardId = await propose(contracts.jgkShougi, accounts[0]);
      await accept(contracts.jgkShougi, boardId, challenger);

      const f = async (isHostTurn: boolean, x: number, y: number) => {
        const board = await contracts.jgkShougi.getBoard(boardId);
        const army = isHostTurn ? board.hostArmy : board.challengerArmy;
        const soldier = army.soldiers.find(s => s.category === SOLDIER_CATEGORY_LION);
        if (!soldier) throw new Error('lion not found');

        const signer = isHostTurn ? host : challenger;
        await contracts.jgkShougi.connect(signer).moveSoldier(boardId, soldier.id, soldier.x + x, soldier.y + y);
      }

      await expect(f(false, 0, -2)).to.be.rejectedWith('Invalid destination');
      await expect(f(false, -1, 0)).to.be.rejectedWith('Invalid destination');

      await f(false, -1, -1);
      await f(true, 1, 1);
      await f(false, 1, -1);
      await f(true, 0, 1);

      await expect(f(false, 0, 2)).to.be.rejectedWith('Invalid destination');

      await f(false, 1, 1);

      const boardNext = await contracts.jgkShougi.getBoard(boardId);
      const soldierNext = boardNext.challengerArmy.soldiers.find(s => s.category === SOLDIER_CATEGORY_LION);
      if (!soldierNext) throw new Error('lion not found');
      expect(soldierNext.x).to.equal(3);
      expect(soldierNext.y).to.equal(3);
    });
  });
});
