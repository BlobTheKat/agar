import { Cell } from "../cell.js"
import { arenaSize } from "../util.js"
import { Food } from "./food.js"
import { PlayerCell } from "./player.js"

let foodmass = 0, minmass = 0, maxmass = 0, foodspawn = 0, efficiency = 0, maxfood = 0, take = 0
config(() => {
	maxfood = CONFIG.food.max * arenaSize
	;({foodmass, minmass, maxmass, foodspawn, efficiency} = CONFIG.mothervirus)
	take = foodmass / efficiency
	minmass *= 2
})
export class AttractorCell extends Cell{
	constructor(x, y){ super(x, y, minmass, 0xe000) }
	added(arena){ arena.attractorCount++ }
	removed(arena){ arena.attractorCount-- }
	tick(arena){
		const sqrtr = sqrt(this.r)
		if(this.m > maxmass*4) this.m = maxmass*4
		else if(this.m - take >= minmass) for(let i = foodspawn; i > 0; i--){
			if(this.m - take < minmass) break
			const th = random() * PI * 2
			const x = sin(th), y = cos(th)
			this.m -= take
			if(arena.foodCount >= maxfood) continue
			const c = new Food(this.x + x * this.r, this.y + y * this.r, foodmass)
			c.dx = (x-y) * sqrtr
			c.dy = (y+x) * sqrtr
			arena.add(c)
		}
		const r4 = this.r*4, ir4 = 1/(r4*r4), minsuckmass = this.m/CONFIG.eatratio
		const force = this.r
		arena.select(this.x - r4, this.x + r4, this.y - r4, this.y + r4, cell => {
			if(cell instanceof AttractorCell) return
			const dx = cell.x - this.x, dy = cell.y - this.y, d2 = dx*dx+dy*dy
			if(cell instanceof PlayerCell && cell.m >= minsuckmass && d2 < (this.r*.6667+cell.r)*(this.r*.6667+cell.r)){
				const nm = cell.m - foodspawn * foodmass * 4
				if(nm < CONFIG.player.minmass) return
				cell.m = nm
				this.m += foodspawn * foodmass * 2
			}
			const acc = min(0, (ir4-1/d2)*5)*force
			cell.dx += (dx+dy)*acc; cell.dy += (dy-dx)*acc
		})
		return true
	}
	eaten(cell, arena){
		return !(cell instanceof AttractorCell)
	}
	solid(){}
}