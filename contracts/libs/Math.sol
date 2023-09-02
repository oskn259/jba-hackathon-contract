library Math {
    function abs(int256 x) internal pure returns (uint256) {
        return uint256(x > 0 ? x : -x);
    }

    function distance(uint8 v1, uint8 v2) internal pure returns (uint8) {
        return uint8(abs(int8(v1) - int8(v2)));
    }
}
