pragma solidity ^0.4.0;

contract Rule110 {
    event GameStateUpdated(uint256[3] cells);

    struct State {
        /* Ideally this would be a fixed size array, but that seems to cost
         * more gas with the current compiler. */
        uint256 cells0;
        uint256 cells1;
        uint256 cells2;
    }
    State public state;

    function Rule110(uint256[3] cells) {
        state.cells0 = cells[0];
        state.cells1 = cells[1];
        state.cells2 = cells[2];

        GameStateUpdated(cells);
    }

    uint256 constant pat1 = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe;
    uint256 constant pat2 = 0x9249249249249249249249249249249249249249249249249249249249249248;
    uint256 constant pat3 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    uint256 constant mask = 0x4924924924924924924924924924924924924924924924924924924924924924;

    function _evolveSegment(uint256 left, uint256 center, uint256 right) internal constant returns (uint256) {
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
        temp = center ^ pat1;
        mat1 = (temp | (temp >> 1) | (temp << 1)) & mask;
        temp = ((center >> 1) | (left << 255)) ^ pat1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & mask) << 1;
        temp = ((center << 1) | (right >> 255)) ^ pat1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 1;
        temp = ((center << 2) | (right >> 254)) ^ pat1;
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 2;

        /* Find matches to pattern 100 */
        temp = center ^ pat2;
        mat2 = (temp | (temp >> 1) | (temp << 1)) & mask;
        temp = ((center >> 1) | (left << 255)) ^ pat2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & mask) << 1;
        temp = ((center << 1) | (right >> 255)) ^ pat2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 1;
        temp = ((center << 2) | (right >> 254)) ^ pat2;
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 2;

        /* Find matches to pattern 000 */
        temp = center ^ pat3;
        mat3 = (temp | (temp >> 1) | (temp << 1)) & mask;
        temp = ((center >> 1) | (left << 255)) ^ pat3;
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & mask) << 1;
        temp = ((center << 1) | (right >> 255)) ^ pat3;
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 1;
        temp = ((center << 2) | (right >> 254)) ^ pat3;
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & mask) >> 2;

        /* Any match to patterns 111, 100, 000, will have a 0 bit in mat1,
         * mat2, or mat3, respectively in that cell position. Otherwise, that
         * new cell corresponds to one of the 4 other patterns and should be
         * alive.*/

        return mat1 & mat2 & mat3;
    }

    function evolve() {
        uint256 next_cells0 = _evolveSegment(state.cells2, state.cells0, state.cells1);
        uint256 next_cells1 = _evolveSegment(state.cells0, state.cells1, state.cells2);
        uint256 next_cells2 = _evolveSegment(state.cells1, state.cells2, state.cells0);

        state.cells0 = next_cells0;
        state.cells1 = next_cells1;
        state.cells2 = next_cells2;

        GameStateUpdated([next_cells0, next_cells1, next_cells2]);
    }
}

contract Rule110Factory {
    event GameCreated(address game, bytes32 description);

    /* web3 currently doesn't handle arrays properly, so we explode it for now. */
    function newRule110(uint256 cells0, uint256 cells1, uint256 cells2, bytes32 description) {
        GameCreated(new Rule110([cells0, cells1, cells2]), description);
    }
}
