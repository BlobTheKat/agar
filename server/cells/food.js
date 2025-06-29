import { Cell } from "../cell.js"
import { colors } from "../util.js"

let minmass = 0, maxmass = 0
config(() => ({minmass, maxmass} = CONFIG.food))
export class Food extends Cell{
	constructor(x, y, m = floor(minmass + random() * (maxmass + 1 - minmass)), c = colors[floor(random() * 60)]){ super(x, y, m, c) }
	added(arena){ arena.foodCount++ }
	removed(arena){ arena.foodCount-- }
	eat(cell){ /* Can't eat stuff */ }
	solid(){}
}