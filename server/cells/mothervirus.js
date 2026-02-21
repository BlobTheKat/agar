import { Cell } from "../cell.js"
import { arenaSize } from "../util.js"
import { Food } from "./food.js"
import { Virus } from "./virus.js"

let foodMass = 0, minMass = 0, maxMass = 0, foodSpawn = 0, efficiency = 0, maxFood = 0, take = 0
config(() => {
	maxFood = CONFIG.food.max * arenaSize
	foodMass = CONFIG.mothervirus.foodmass
	minMass = CONFIG.mothervirus.minmass
	maxMass = CONFIG.mothervirus.maxmass
	foodSpawn = CONFIG.mothervirus.foodspawn
	efficiency = CONFIG.mothervirus.efficiency
	take = foodMass / efficiency
})
export class MotherVirus extends Virus{
	constructor(x, y){ super(x, y, minMass, 0xdc66) }
	tick(arena){
		if(this.m > maxMass) this.m = maxMass
		else if(this.m - take < minMass) return false
		for(let i = foodSpawn; i > 0; i--){
			if(this.m - take < minMass) break
			const th = random() * PI * 2
			const x = sin(th), y = cos(th)
			this.m -= take
			if(arena.foodCount >= maxFood) continue
			const c = new Food(this.x + x * this.r, this.y + y * this.r, foodMass)
			c.dx = x * 2
			c.dy = y * 2
			arena.add(c)
		}
		return true
	}
	eat(){}
}
MotherVirus.prototype.eat = Cell.prototype.eat