import { Cell } from "../cell.js"
import { arenaSize } from "../util.js"
import { Food } from "./food.js"
import { Virus } from "./virus.js"

let foodmass = 0, minmass = 0, maxmass = 0, foodspawn = 0, efficiency = 0, maxfood = 0, take = 0
config(() => {maxfood = CONFIG.food.max * arenaSize, {foodmass, minmass, maxmass, foodspawn, efficiency} = CONFIG.mothervirus; take = foodmass / efficiency})
export class MotherVirus extends Virus{
	constructor(x, y){ super(x, y, minmass, 0x1c66) }
	tick(arena){
		if(this.m > maxmass) this.m = maxmass
		else if(this.m - take < minmass) return false
		for(let i = foodspawn; i > 0; i--){
			if(this.m - take < minmass) break
			const th = random() * PI * 2
			const x = sin(th), y = cos(th)
			this.m -= take
			if(arena.foodCount >= maxfood) continue
			const c = new Food(this.x + x * this.r, this.y + y * this.r, foodmass)
			c.dx = x * 2
			c.dy = y * 2
			arena.add(c)
		}
		return true
	}
	eat(a, b){
		super.eat(a, b, true)
	}
}
MotherVirus.prototype.eat = Cell.prototype.eat