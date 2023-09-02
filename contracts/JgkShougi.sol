// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./libs/Math.sol";
import "./libs/JgkShougiSoldier.sol";
import "./libs/JgkShougiArmy.sol";

contract JgkShougi is JgkShougiArmy {

    struct Board {
        address host;
        address challenger;
        uint256 stakeAmount;
        Army hostArmy;
        Army challengerArmy;
        BoardStatus status;
        Turn turn;
    }

    enum BoardStatus {
        PROPOSING,
        STARTED,
        END
    }

    enum Turn {
        HOST,
        CHALLENGER
    }

    event ProposeGame(uint256 indexed boardId, address indexed host);
    event AcceptGame(uint256 indexed boardId, address indexed challenger);
    event MoveSoldier(uint256 indexed boardId, uint256 indexed soldierId, JgkShougiSoldier.SoldierCategory soldierCategory, uint256 x, uint256 y);

    uint256 idCounter = 0;

    function generateId() internal returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, idCounter++)));
    }

    /************************************************************************
    * Storage
    ************************************************************************/

    address contractOwner;
    uint256 withdrawableAmount;
    mapping(uint256 => Board) boards;

    /************************************************************************
    * Private functions: logics
    ************************************************************************/

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, 'Only contract owner can call this function');
        _;
    }

    /// Check that the board status is STARTED
    modifier startedBoard(uint256 boardId) {
        require(boards[boardId].status != BoardStatus.PROPOSING, 'Diplomatic efforts should be made so as not to lose a large number of citizens');
        require(boards[boardId].status != BoardStatus.END, 'Who is the winner of this war...?');
        _;
    }

    /// Check who has the turn, then switch the turn
    /// @param boardId The board ID
    modifier turnSwitcher(uint256 boardId) {
        if (boards[boardId].host == msg.sender) {
            require(boards[boardId].turn == Turn.HOST, 'Your illegal attempt all must fail');
            boards[boardId].turn = Turn.CHALLENGER;
        } else if (boards[boardId].challenger == msg.sender) {
            require(boards[boardId].turn == Turn.CHALLENGER, 'Your illegal attempt all must fail');
            boards[boardId].turn = Turn.HOST;
        } else {
            revert('Shut up outsider');
        }

        _;
    }

    /************************************************************************
    * Public functions
    ************************************************************************/

    constructor() public {
        contractOwner = msg.sender;
    }

    function withdraw() public onlyContractOwner {
        payable(msg.sender).transfer(withdrawableAmount);
    }

    function proposeGame(uint256 boardId) external payable {
        require(msg.value >= 10000, "Amount should be greater than 10000");
        require(boards[boardId].host == address(0), 'Another game is already there');

        boards[boardId].host = msg.sender;
        boards[boardId].stakeAmount = msg.value;
        boards[boardId].status = BoardStatus.PROPOSING;
        boards[boardId].turn = Turn.CHALLENGER;

        boards[boardId].hostArmy.armyId = generateId();
        boards[boardId].hostArmy.direction = true;
        initArmyList(boards[boardId].hostArmy);

        emit ProposeGame(boardId, msg.sender);
    }

    function getGameStatus(uint256 boardId) external view returns (BoardStatus) {
        return boards[boardId].status;
    }

    function acceptGame(uint256 boardId) external payable {
        require(boards[boardId].status == BoardStatus.PROPOSING, 'No war to accept, the world is in peace.');
        require(msg.value == boards[boardId].stakeAmount, 'You must pay the same amount as the opponent');

        boards[boardId].challenger = msg.sender;
        boards[boardId].stakeAmount += msg.value;
        boards[boardId].status = BoardStatus.STARTED;

        boards[boardId].challengerArmy.armyId = generateId();
        boards[boardId].challengerArmy.direction = false;
        initArmyList(boards[boardId].challengerArmy);

        emit AcceptGame(boardId, msg.sender);
    }

    function getBoard(uint256 boardId) external view returns (Board memory) {
        return boards[boardId];
    }

    /// Move a soldier you hold on the board
    /// @param boardId The board id
    /// @param soldierId The ID of soldier to move
    /// @param x The x coordinate to move to
    /// @param y The y coordinate to move to
    function moveSoldier(uint256 boardId, uint256 soldierId, uint8 x, uint8 y) external startedBoard(boardId) turnSwitcher(boardId) {
        Army storage army = boards[boardId].host == msg.sender ? boards[boardId].hostArmy : boards[boardId].challengerArmy;
        Army storage opponentArmy = boards[boardId].host == msg.sender ? boards[boardId].challengerArmy : boards[boardId].hostArmy;

        require(isLionAliveIn(army), 'Loosing LION, your territory is occupied. History is written by the victors.');

        // Get the soldier to move
        JgkShougiSoldier.Soldier storage soldier;
        {
            (uint256 i, bool found) = findSoldierIndex(army, soldierId);
            require(found, 'Soldier not found');
            soldier = army.soldiers[i];
        }

        {
            require(
                isValidDestination(army, x, y, soldierId),
                'Invalid destination'
            );
        }

        // Move the soldier
        soldier.x = x;
        soldier.y = y;
        captureOpponentSoldierAt(x, y, army, opponentArmy);
        transformSoldier(x, y, army, soldier);

        emit MoveSoldier(boardId, soldierId, soldier.category, x, y);
    }

    /// Claim rewards after winning a game
    function claimLoots(uint256 boardId) external startedBoard(boardId) {
        Army storage army = boards[boardId].host == msg.sender ? boards[boardId].hostArmy : boards[boardId].challengerArmy;
        Army storage opponentArmy = boards[boardId].host == msg.sender ? boards[boardId].challengerArmy : boards[boardId].hostArmy;

        require(isLionAliveIn(army), 'Dead men tell no tales.');
        require(!isLionAliveIn(opponentArmy), 'Enemies are still alive. Finish them to obtain our peace.');

        // All stake amount goes to the winner
        payable(msg.sender).transfer(boards[boardId].stakeAmount);

        boards[boardId].status = BoardStatus.END;
    }
}
