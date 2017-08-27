import PIL.Image


class Rule110_Loop:
    def __init__(self, initial_cells):
        self.state = [x for x in initial_cells]

    def evolve(self):
        new_state = [0x0]*len(self.state)

        for j in range(len(self.state)):
            for i in range(256):
                if i == 0:
                    # Left most -- [xx]x ... xxx[x
                    idx = (j-1) % len(self.state)
                    left = bool(self.state[idx] & (1<<0))
                    center = bool(self.state[j] & (1<<255))
                    right = bool(self.state[j] & (1<<254))
                elif i == 255:
                    # Right most -- x]xx ... xx[xx
                    idx = (j+1) % len(self.state)
                    left = bool(self.state[j] & (1<<1))
                    center = bool(self.state[j] & (1<<0))
                    right = bool(self.state[idx] & (1<<255))
                else:
                    left = bool(self.state[j] & (1<<(255-(i-1))))
                    center = bool(self.state[j] & (1<<(255-i)))
                    right = bool(self.state[j] & (1<<(255-(i+1))))

                value = (left << 2) | (center << 1) | right
                new_state[j] |= ((110 >> value) & 0x1) << (255-i)

        self.state = new_state


class Rule110_Bit:
    pat1 = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe
    pat2 = 0x9249249249249249249249249249249249249249249249249249249249249248
    pat3 = 0x0000000000000000000000000000000000000000000000000000000000000000
    mask = 0x4924924924924924924924924924924924924924924924924924924924924924

    def __init__(self, initial_cells):
        self.state = [x for x in initial_cells]

    def evolve(self):
        new_state = [0x0]*len(self.state)

        def _evolve_segment(left, center, right):
            temp = center ^ Rule110_Bit.pat1
            mat1 = (temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask
            temp = ((center >> 1) | (left << 255)) ^ Rule110_Bit.pat1
            mat1 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) << 1
            temp = ((center << 1) | (right >> 255)) ^ Rule110_Bit.pat1
            mat1 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 1
            temp = ((center << 2) | (right >> 254)) ^ Rule110_Bit.pat1
            mat1 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 2

            temp = center ^ Rule110_Bit.pat2
            mat2 = (temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask
            temp = ((center >> 1) | (left << 255)) ^ Rule110_Bit.pat2
            mat2 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) << 1
            temp = ((center << 1) | (right >> 255)) ^ Rule110_Bit.pat2
            mat2 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 1
            temp = ((center << 2) | (right >> 254)) ^ Rule110_Bit.pat2
            mat2 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 2

            temp = center ^ Rule110_Bit.pat3
            mat3 = (temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask
            temp = ((center >> 1) | (left << 255)) ^ Rule110_Bit.pat3
            mat3 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) << 1
            temp = ((center << 1) | (right >> 255)) ^ Rule110_Bit.pat3
            mat3 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 1
            temp = ((center << 2) | (right >> 254)) ^ Rule110_Bit.pat3
            mat3 |= ((temp | (temp >> 1) | (temp << 1)) & Rule110_Bit.mask) >> 2

            return mat1 & mat2 & mat3

        for i in range(len(self.state)):
            new_state[i] = _evolve_segment(self.state[(i-1) % len(self.state)],
                                           self.state[i],
                                           self.state[(i+1) % len(self.state)])

        self.state = new_state


if __name__ == "__main__":
    INITIAL_CELLS = [0x0, 0x0, 0x1]
    NUM_EVOLUTIONS = 768

    img = PIL.Image.new('1', (len(INITIAL_CELLS)*256, NUM_EVOLUTIONS), color=1)
    pixels = img.load()

    game1 = Rule110_Loop(INITIAL_CELLS)
    game2 = Rule110_Bit(INITIAL_CELLS)

    for row in range(NUM_EVOLUTIONS):
        game1.evolve()
        game2.evolve()
        assert(game1.state == game2.state)

        for j in range(len(game2.state)):
            for i in range(256):
                pixels[j*256 + i, row] = not (game2.state[j] & (1 << (255-i)))

    img.save("out.png")
