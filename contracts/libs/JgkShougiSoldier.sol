// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./Math.sol";

library JgkShougiSoldier {

    enum SoldierCategory {
        LION,
        HIYOKO,
        KIRIN,
        ZOU,
        NIWATORI
    }

    enum SoldierStatus {
        ONBOARD,
        STANDBY
    }

    struct Soldier {
        uint256 id;
        uint8 x;
        uint8 y;
        SoldierCategory category;
        SoldierStatus status;
    }

    /// Definition of how soldiers can move on the board
    /// Same as the rules of Doubutsu-Shogi
    /// @param s Soldier to be moved
    /// @param x X coordinate
    /// @param y Y coordinate
    /// @param direction Which side the soldier is facing (1: host, -1: challenger)
    /// @return True if the Soldier can move to that coordinate (note: no consideration about ally soldier)
    function isValidDestination(Soldier memory s, uint8 x, uint8 y, int8 direction) internal pure returns (bool) {
        // Standby soldier can be put to anywhere
        if (s.status == SoldierStatus.STANDBY) {
            return true;
        }

        uint8 dx = Math.distance(x, s.x);
        uint8 dy = Math.distance(y, s.y);

        // Soldier cannot move to the same place
        if (dx == 0 && dy == 0) {
            return false;
        }

        // All kind of soldier can move 1 step
        if (dx > 1 || dy > 1) {
            return false;
        }

        if (s.category == SoldierCategory.LION) {
            // 1 step to any direction
        } else if (s.category == SoldierCategory.KIRIN) {
            if (dx > 0 && dy != 0) {
                return false;
            }
            if (dy > 0 && dx != 0) {
                return false;
            }
        } else if (s.category == SoldierCategory.ZOU) {
            if (dx != dy) {
                return false;
            }
        } else if (s.category == SoldierCategory.HIYOKO) {
            if (dx != 0 || dy != 1) {
                return false;
            }
            if ((direction > 0 && s.y > y) || (direction < 0 && s.y < y)) {
                return false;
            }
        } else if (s.category == SoldierCategory.NIWATORI) {
            if (dx > 0 && dy > 0) {
                if ((direction > 0 && s.y > y) || (direction < 0 && s.y < y)) {
                    return false;
                }
            }
        } else {
            return false;
        }

        return true;
    }
}
