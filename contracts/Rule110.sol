pragma solidity ^0.4.0;

contract Rule110 {
    event GameStateUpdated(uint256 cells);

    uint256 public state;
    uint16 public size;

    function Rule110(uint16 _size, uint256 initialCells) {
        require(_size >= 3 && _size <= 256);

        size = _size;
        state = initialCells;

        GameStateUpdated(initialCells);
    }

    uint256 constant PAT1 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 constant PAT2 = 0x4924924924924924924924924924924924924924924924924924924924924924;
    uint256 constant MASK = 0x2492492492492492492492492492492492492492492492492492492492492492;

    function evolve() {
        uint256 temp;
        uint256 cell_mask;
        uint256 patt_mask;
        uint256 mat1;
        uint256 mat2;
        uint256 mat3;

        /* Mask for active game cells */
        cell_mask = (uint256(1) << size)-1;

        /* Mask for pattern matches */
        patt_mask = MASK & (cell_mask >> 1);

        /* Rule 110
            111 -> 0, 100 -> 0, 000 -> 0, else -> 1
         */

        /* Find cells that do not match pattern 111 */
        temp = state ^ PAT1;
        mat1 = (temp | (temp >> 1) | (temp << 1)) & patt_mask;
        temp = ((state >> 1) | (state << (size-1))) ^ PAT1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 1;
        temp = ((state << 1) | (state >> (size-1))) ^ PAT1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & patt_mask) >> 1;
        temp = ((state >> 2) | (state << (size-2))) ^ PAT1;
        mat1 |= (((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 2) & cell_mask;
        temp = ((state >> 3) | (state << (size-3))) ^ PAT1;
        mat1 |= (((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 3) & cell_mask;

        /* Find cells that do not match pattern 100 */
        temp = state ^ PAT2;
        mat2 = (temp | (temp >> 1) | (temp << 1)) & patt_mask;
        temp = ((state >> 1) | (state << (size-1))) ^ PAT2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 1;
        temp = ((state << 1) | (state >> (size-1))) ^ PAT2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & patt_mask) >> 1;
        temp = ((state >> 2) | (state << (size-2))) ^ PAT2;
        mat2 |= (((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 2) & cell_mask;
        temp = ((state >> 3) | (state << (size-3))) ^ PAT2;
        mat2 |= (((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 3) & cell_mask;

        /* Find cells that do not match pattern 000 */
        temp = state;
        mat3 = (temp | (temp >> 1) | (temp << 1)) & patt_mask;
        temp = ((state >> 1) | (state << (size-1)));
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 1;
        temp = ((state << 1) | (state >> (size-1)));
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & patt_mask) >> 1;
        temp = ((state >> 2) | (state << (size-2)));
        mat3 |= (((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 2) & cell_mask;
        temp = ((state >> 3) | (state << (size-3)));
        mat3 |= (((temp | (temp >> 1) | (temp << 1)) & patt_mask) << 3) & cell_mask;

        /* Any match to patterns 111, 100, or 000, will have a 0 bit in mat1,
         * mat2, or mat3, respectively, in that cell position. Otherwise, that
         * new cell corresponds to one of the 4 other patterns and should be
         * alive. */

        state = mat1 & mat2 & mat3;

        GameStateUpdated(state);
    }
}

contract Rule110Factory {
    event GameCreated(address game, uint16 size, bytes32 description);

    string constant public VERSION = "1.0.0";

    function newRule110(uint16 size, uint256 initialCells, bytes32 description) {
        GameCreated(new Rule110(size, initialCells), size, description);
    }
}
