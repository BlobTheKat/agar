import { Cell } from "../cell.js";
import { Food } from "./food.js";
import { Virus } from "./virus.js";
const {foodmass, minmass, maxmass, foodspawn, efficiency} = CONFIG.mothervirus
const {max: maxfood} = CONFIG.food
const take = foodmass / efficiency
export class MotherVirus extends Cell{
	constructor(x, y){
		super(x, y, minmass, 0x1c66)
	}
	tick(arena){
		if(this.m > maxmass)this.m = maxmass
		else if(this.m - take < minmass)return false
		for(let i = foodspawn; i > 0; i--){
			if(this.m - take < minmass)break
			const th = Math.random() * Math.PI * 2
			const x = Math.sin(th), y = Math.cos(th)
			this.m -= take
			if(arena.foodCount >= maxfood)continue
			const c = new Food(this.x + x * this.r, this.y + y * this.r, foodmass)
			c.dx = x * 2
			c.dy = y * 2
			arena.add(c)
		}
		return true
	}
	eaten(a, b){ Virus.prototype.eaten.call(this, a, b) }
	solid(){}
	added(arena){
		arena.virusCount++
	}
	removed(arena){
		arena.virusCount--
	}
}