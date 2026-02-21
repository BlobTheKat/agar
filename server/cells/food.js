import { Cell } from "../cell.js"
import { colors } from "../util.js"

let minMass = 0, massRange = 0
config(() => {
	minMass = CONFIG.food.minmass
	massRange = CONFIG.food.maxmass+1 - minMass
})
export class Food extends Cell{
	constructor(x, y, mass = floor(minMass + random() * massRange), col = colors[floor(random() * 60)]){
		super(x, y, mass, col)
	}
	added(arena){ arena.foodCount++ }
	removed(arena){ arena.foodCount-- }
	eat(cell){ /* Can't eat stuff */ }
	solid(){}
}