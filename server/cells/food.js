import { Cell } from "../cell.js";
import { colors } from "../util.js";
const {minmass, maxmass} = CONFIG.food
export class Food extends Cell{
	constructor(x, y, m = Math.floor(minmass + Math.random() * (maxmass + 1 - minmass)), c = colors[Math.floor(Math.random() * 60)]){
		super(x, y, m, c)
	}
	added(arena){
		arena.foodCount++
	}
	removed(arena){
		arena.foodCount--
	}
	eat(cell){
		//no eat
	}
	solid(){}
}