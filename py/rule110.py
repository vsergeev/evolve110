import PIL.Image


class Rule110_Loop:
    def __init__(self, size, initial_cells):
        assert 0 <= initial_cells < 2**size
        self.state = initial_cells
        self.size = size

    def evolve(self):
        new_state = 0x0

        for i in range(self.size):
            if i == 0:
                # Left most -- [xx]x ... xxx[x
                left = bool(self.state & (1<<0))
                center = bool(self.state & (1<<(self.size-1)))
                right = bool(self.state & (1<<(self.size-2)))
            elif i == self.size-1:
                # Right most -- x]xx ... xx[xx
                left = bool(self.state & (1<<1))
                center = bool(self.state & (1<<0))
                right = bool(self.state & (1<<(self.size-1)))
            else:
                # Middle -- xxx ... [xxx] ... xxx
                left = bool(self.state & (1<<(self.size-i)))
                center = bool(self.state & (1<<(self.size-1-i)))
                right = bool(self.state & (1<<(self.size-2-i)))

            value = (left << 2) | (center << 1) | right
            new_state |= ((110 >> value) & 0x1) << (self.size-1-i)

        self.state = new_state


class Rule110_Bit:
    pat1 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
    pat2 = 0x4924924924924924924924924924924924924924924924924924924924924924
    pat3 = 0x0000000000000000000000000000000000000000000000000000000000000000
    mask = 0x2492492492492492492492492492492492492492492492492492492492492492

    def __init__(self, size, initial_cells):
        assert 3 <= size <= 256
        assert 0 <= initial_cells < 2**size
        self.state = initial_cells
        self.size = size
        self.mask = Rule110_Bit.mask & ((1 << (size-1)) - 1)
        self.mod = size % 3

    def evolve(self):
        temp = self.state ^ Rule110_Bit.pat1
        mat1 = (temp | (temp >> 1) | (temp << 1)) & self.mask
        temp = ((self.state >> 1) | (self.state << (self.size-1))) ^ Rule110_Bit.pat1
        mat1 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 1)
        temp = ((self.state << 1) | (self.state >> (self.size-1))) ^ Rule110_Bit.pat1
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & self.mask) >> 1
        if self.mod > 0:
            temp = ((self.state >> 2) | (self.state << (self.size-2))) ^ Rule110_Bit.pat1
            mat1 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 2)
        if self.mod > 1:
            temp = ((self.state >> 3) | (self.state << (self.size-3))) ^ Rule110_Bit.pat1
            mat1 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 3)

        temp = self.state ^ Rule110_Bit.pat2
        mat2 = (temp | (temp >> 1) | (temp << 1)) & self.mask
        temp = ((self.state >> 1) | (self.state << (self.size-1))) ^ Rule110_Bit.pat2
        mat2 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 1)
        temp = ((self.state << 1) | (self.state >> (self.size-1))) ^ Rule110_Bit.pat2
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & self.mask) >> 1
        if self.mod > 0:
            temp = ((self.state >> 2) | (self.state << (self.size-2))) ^ Rule110_Bit.pat2
            mat2 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 2)
        if self.mod > 1:
            temp = ((self.state >> 3) | (self.state << (self.size-3))) ^ Rule110_Bit.pat2
            mat2 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 3)

        temp = self.state ^ Rule110_Bit.pat3
        mat3 = (temp | (temp >> 1) | (temp << 1)) & self.mask
        temp = ((self.state >> 1) | (self.state << (self.size-1))) ^ Rule110_Bit.pat3
        mat3 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 1)
        temp = ((self.state << 1) | (self.state >> (self.size-1))) ^ Rule110_Bit.pat3
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & self.mask) >> 1
        if self.mod > 0:
            temp = ((self.state >> 2) | (self.state << (self.size-2))) ^ Rule110_Bit.pat3
            mat3 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 2)
        if self.mod > 1:
            temp = ((self.state >> 3) | (self.state << (self.size-3))) ^ Rule110_Bit.pat3
            mat3 |= (((temp | (temp >> 1) | (temp << 1)) & self.mask) << 3)

        self.state = mat1 & mat2 & mat3


if __name__ == "__main__":
    # Compare all games from size = 3 to 256
    # with initial cells 0x1 and 300 evolutions
    for size in range(3, 256+1):
        print("Testing game with {} cells...".format(size))
        game1 = Rule110_Loop(size, 0x1)
        game2 = Rule110_Bit(size, 0x1)
        for _ in range(300):
            game1.evolve()
            game2.evolve()
            assert(game1.state == game2.state)

    # Generate game with 252 cells, initial cells 0x1, 300 evolutions
    INITIAL_CELLS = 0x1
    SIZE = 252
    NUM_EVOLUTIONS = 300
    img = PIL.Image.new('1', (size, NUM_EVOLUTIONS), color=1)
    pixels = img.load()

    game1 = Rule110_Loop(SIZE, INITIAL_CELLS)
    game2 = Rule110_Bit(SIZE, INITIAL_CELLS)

    for row in range(NUM_EVOLUTIONS):
        game1.evolve()
        game2.evolve()
        assert(game1.state == game2.state)

        for i in range(SIZE):
            pixels[i, row] = not (game2.state & (1 << (SIZE-1-i)))

    img.save("out.png")
