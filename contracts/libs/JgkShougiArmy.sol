// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./JgkShougiSoldier.sol";

contract JgkShougiArmy {

    uint8 constant BOARD_SIZE_X = 3;
    uint8 constant BOARD_SIZE_Y = 4;

    struct Army {
        uint256 armyId;
        JgkShougiSoldier.Soldier[] soldiers;
        bool direction;  // true: go forward means count `y` up, false: reverse
    }

    uint256 soldierIdCounter = 0;

    function generateSoldierId() internal returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, soldierIdCounter++)));
    }

    /// Place a soldier into the list
    /// @param army The army to place the soldier into, expected to have empty soldier list
    function initArmyList(
        Army storage army
    ) internal {
        if (army.direction) {
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.LION,   2, 1);
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.HIYOKO, 2, 2);
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.ZOU,    1, 1);
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.KIRIN,  3, 1);
        } else {
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.LION,   2, 4);
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.HIYOKO, 2, 3);
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.ZOU,    3, 4);
            placeSoldierInto(army, JgkShougiSoldier.SoldierCategory.KIRIN,  1, 4);
        }
    }

    /// Check if the LION is alive in the given soldier list
    /// @param army Army
    /// @return True if the LION is alive
    function isLionAliveIn(
        Army storage army
    ) internal returns (bool) {
        for (uint256 i = 0; i < army.soldiers.length; i++) {
            if (army.soldiers[i].category == JgkShougiSoldier.SoldierCategory.LION) {
                return true;
            }
        }
        return false;
    }

    /// Returns if LION succeed to try (Doubutsu-Shogi rule)
    /// @param army Army
    /// @return True if LION succeed to try
    function isTrySucceed(
        Army storage army
    ) internal returns (bool) {
        for (uint256 i = 0; i < army.soldiers.length; i++) {
            if (army.soldiers[i].category == JgkShougiSoldier.SoldierCategory.LION) {
                if (army.direction) {
                    return army.soldiers[i].y >= 4;
                } else {
                    return army.soldiers[i].y <= 1;
                }
            }
        }
        return false;
    }

    /// Find soldier by Soldier ID
    /// @param army Army
    /// @param soldierId Soldier ID
    /// @return i Array index of soldier
    /// @return found True if soldier is found
    function findSoldierIndex(
        Army memory army,
        uint256 soldierId
    ) internal view returns (uint256 i, bool found) {
        for (i = 0; i < army.soldiers.length; i++) {
            if (army.soldiers[i].id == soldierId) {
                return (i, true);
            }
        }
        return (0, false);
    }

    /// Find soldier by board coordinate
    /// @param army Army
    /// @param x X coordinate
    /// @param y Y coordinate
    /// @return i Array index of soldier
    /// @return found True if soldier is found
    function findSoldierIndexByCoord(
        Army memory army,
        uint8 x,
        uint8 y
    ) internal view returns (uint256 i, bool found) {
        for (i = 0; i < army.soldiers.length; i++) {
            if (army.soldiers[i].x == x && army.soldiers[i].y == y) {
                return (i, true);
            }
        }
        return (0, false);
    }

    /// Remove soldier at specified index from the list
    /// @param army Army
    /// @param index Index of soldier to be removed
    function removeSoldierFrom(
        Army storage army,
        uint256 index
    ) internal {
        army.soldiers[index] = army.soldiers[army.soldiers.length - 1];
        army.soldiers.pop();
    }

    /// Put a soldier into given coordinate
    /// @param army Army
    /// @param cat Soldier category
    /// @param x X coordinate
    /// @param y Y coordinate
    function placeSoldierInto(
        Army storage army,
        JgkShougiSoldier.SoldierCategory cat,
        uint8 x,
        uint8 y
    ) internal {
        JgkShougiSoldier.Soldier memory s = JgkShougiSoldier.Soldier(generateSoldierId(), x, y, cat, JgkShougiSoldier.SoldierStatus.ONBOARD);
        army.soldiers.push(s);
    }

    /// Capture opponent's soldier if it exists at the specified coordinate
    /// If captured, the soldier is removed from opponent's list and added into the list
    /// If not, nothing happens
    /// @param x X coordinate
    /// @param y Y coordinate
    /// @param army Army
    /// @param opponentArmy Opponent's army
    function captureOpponentSoldierAt(uint8 x, uint8 y, Army storage army, Army storage opponentArmy) internal {
        (uint256 i, bool found) = findSoldierIndexByCoord(opponentArmy, x, y);
        if (!found) {
            return;
        }

        JgkShougiSoldier.Soldier memory s = opponentArmy.soldiers[i];
        s.status = JgkShougiSoldier.SoldierStatus.STANDBY;
        removeSoldierFrom(opponentArmy, i);
        army.soldiers.push(s);
    }

    /// Transform soldier if it is at the end of the board
    /// In Doubutsu-Shogi, only HIYOKO can transform
    /// @param x X coordinate of the soldier
    /// @param y Y coordinate of the soldier
    /// @param soldier Soldier to transform
    function transformSoldier(uint8 x, uint8 y, Army storage army, JgkShougiSoldier.Soldier storage soldier) internal {
        if (y != (army.direction ? 4 : 1)) {
            return;
        }

        if (soldier.category == JgkShougiSoldier.SoldierCategory.HIYOKO) {
            soldier.category = JgkShougiSoldier.SoldierCategory.NIWATORI;
        }
    }

    /// Check if the destination is valid for the soldier in the given army
    /// @param army Army
    /// @param x Destination X coordinate
    /// @param y Destination Y coordinate
    /// @param soldierId Soldier ID to move
    /// @return True if the destination is valid
    function isValidDestination(Army memory army, uint8 x, uint8 y, uint256 soldierId) internal view returns (bool) {
        JgkShougiSoldier.Soldier memory s;
        {
            (uint256 i, bool found) = findSoldierIndex(army, soldierId);
            if (!found) {
                return false;
            }
            s = army.soldiers[i];
        }

        if (x < 1 || x > BOARD_SIZE_X || y < 1 || y > BOARD_SIZE_Y) {
            return false;
        }

        // Check in perspective of the Soldier ability
        {
            bool valid = JgkShougiSoldier.isValidDestination(s, x, y, army.direction ? int8(1) : int8(-1));
            if (!valid) {
                return false;
            }
        }

        // Check in perspective whether the possible move in that army
        {
            (uint256 i, bool found) = findSoldierIndexByCoord(army, x, y);
            if (found) {
                return false;
            }
        }

        return true;
    }
}
