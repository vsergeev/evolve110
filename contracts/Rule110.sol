pragma solidity ^0.4.0;

contract Rule110 {
    event GameStateUpdated(uint256 cells);

    uint256 public state;

    function Rule110(uint256 initialCells) {
        state = initialCells;

        GameStateUpdated(initialCells);
    }

    uint256 constant pat1 = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe;
    uint256 constant pat2 = 0x9249249249249249249249249249249249249249249249249249249249249248;
    uint256 constant mask = 0x4924924924924924924924924924924924924924924924924924924924924924;

    function evolve() {
        uint256 temp;
        uint256 mat1;
        uint256 mat2;
        uint256 mat3;

        /* Rule 110
            111         -> 0
            100         -> 0
            000         -> 0
            all others  -> 1
         */

        /* Find matches to pattern 111 */
        temp = state ^ pat1;
        mat1 = (temp | (temp >> 1) | (temp << 1)) & mask;
        temp = ((state >> 1) | (state << 255)) ^ pat1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & mask) << 1;
        temp = ((state << 1) | (state >> 255)) ^ pat1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 1;
        temp = ((state << 2) | (state >> 254)) ^ pat1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 2;

        /* Find matches to pattern 100 */
        temp = state ^ pat2;
        mat2 = (temp | (temp >> 1) | (temp << 1)) & mask;
        temp = ((state >> 1) | (state << 255)) ^ pat2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & mask) << 1;
        temp = ((state << 1) | (state >> 255)) ^ pat2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 1;
        temp = ((state << 2) | (state >> 254)) ^ pat2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 2;

        /* Find matches to pattern 000 */
        temp = state;
        mat3 = (temp | (temp >> 1) | (temp << 1)) & mask;
        temp = ((state >> 1) | (state << 255));
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & mask) << 1;
        temp = ((state << 1) | (state >> 255));
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 1;
        temp = ((state << 2) | (state >> 254));
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 2;

        /* Any match to patterns 111, 100, 000, will have a 0 bit in mat1,
         * mat2, or mat3, respectively in that cell position. Otherwise, that
         * new cell corresponds to one of the 4 other patterns and should be
         * alive. */

        state = mat1 & mat2 & mat3;

        GameStateUpdated(state);
    }
}

contract Rule110Factory {
    event GameCreated(address game, bytes32 description);

    function newRule110(uint256 initialCells, bytes32 description) {
        GameCreated(new Rule110(initialCells), description);
    }
}
