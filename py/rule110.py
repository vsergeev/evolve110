import PIL.Image

class Rule110_Loop:
    def __init__(self, initial_cells):
        assert 0 <= initial_cells < 2**256
        self.state = initial_cells

    def evolve(self):
        new_state = 0x0

        for i in range(256):
            if i == 0:
                # Left most -- [xx]x ... xxx[x
                left = bool(self.state & (1<<0))
                center = bool(self.state & (1<<255))
                right = bool(self.state & (1<<254))
            elif i == 255:
                # Right most -- x]xx ... xx[xx
                left = bool(self.state & (1<<1))
                center = bool(self.state & (1<<0))
                right = bool(self.state & (1<<255))
            else:
                # Middle -- xxx ... [xxx] ... xxx
                left = bool(self.state & (1<<(255-(i-1))))
                center = bool(self.state & (1<<(255-i)))
                right = bool(self.state & (1<<(255-(i+1))))

            value = (left << 2) | (center << 1) | right
            new_state |= ((110 >> value) & 0x1) << (255-i)

        self.state = new_state


class Rule110_Bit:
    pat1 = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe
    pat2 = 0x9249249249249249249249249249249249249249249249249249249249249248
    pat3 = 0x0000000000000000000000000000000000000000000000000000000000000000
    mask = 0x4924924924924924924924924924924924924924924924924924924924924924

    def __init__(self, initial_cells):
        assert 0 <= initial_cells < 2**256
        self.state = initial_cells

    def evolve(self):
        temp = self.state ^ Rule110_Bit.pat1
        mat1 = (temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask
        temp = ((self.state >> 1) | (self.state << 255)) ^ Rule110_Bit.pat1
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) << 1
        temp = ((self.state << 1) | (self.state >> 255)) ^ Rule110_Bit.pat1
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 1
        temp = ((self.state << 2) | (self.state >> 254)) ^ Rule110_Bit.pat1
        mat1 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 2

        temp = self.state ^ Rule110_Bit.pat2
        mat2 = (temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask
        temp = ((self.state >> 1) | (self.state << 255)) ^ Rule110_Bit.pat2
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) << 1
        temp = ((self.state << 1) | (self.state >> 255)) ^ Rule110_Bit.pat2
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 1
        temp = ((self.state << 2) | (self.state >> 254)) ^ Rule110_Bit.pat2
        mat2 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 2

        temp = self.state ^ Rule110_Bit.pat3
        mat3 = (temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask
        temp = ((self.state >> 1) | (self.state << 255)) ^ Rule110_Bit.pat3
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) << 1
        temp = ((self.state << 1) | (self.state >> 255)) ^ Rule110_Bit.pat3
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 1
        temp = ((self.state << 2) | (self.state >> 254)) ^ Rule110_Bit.pat3
        mat3 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 2

        self.state = mat1 & mat2 & mat3


if __name__ == "__main__":
    INITIAL_CELLS = 0x1
    NUM_EVOLUTIONS = 300
    img = PIL.Image.new('1', (256, NUM_EVOLUTIONS), color=1)
    pixels = img.load()

    game1 = Rule110_Loop(INITIAL_CELLS)
    game2 = Rule110_Bit(INITIAL_CELLS)

    for row in range(NUM_EVOLUTIONS):
        game1.evolve()
        game2.evolve()
        assert(game1.state == game2.state)

        for i in range(256):
            pixels[i, row] = not (game2.state & (1 << (255-i)))

    img.save("out.png")
