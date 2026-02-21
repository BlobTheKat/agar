import { Cell } from "../cell.js"
import { EjectedMass } from "./ejectedmass.js"
import { PlayerCell } from "./player.js"

let minMass = 0, massRange = 0, splitMass = 0, grow = 0, virusMax = 0, playerMinMass = 0
config(() => {
	minMass = CONFIG.virus.minmass
	massRange = CONFIG.virus.maxmass+1 - minMass
	virusMax = CONFIG.virus.max
	grow = CONFIG.virus.grow
	splitMass = CONFIG.virus.splitmass
	playerMinMass = CONFIG.player.minmass
})

export class Virus extends Cell{
	constructor(x, y, mass = floor(minMass + random() * massRange), col = 0xd2f1){
		super(x, y, mass, col)
	}
	added(arena){ arena.virusCount++ }
	removed(arena){ arena.virusCount-- }
	eaten(cell){
		if(cell instanceof PlayerCell){
			const m = cell.m * 0.2
			let mass = m
			cell.age = 20
			while(true){
				if(cell.m - mass < playerMinMass) break
				const c = cell.sock.newCell(cell.x, cell.y, mass)
				if(!c) break
				cell.m -= mass
				const th = random() * PI * 2
				c.dx = sin(th) * 20
				c.dy = cos(th) * 20
				mass = max(playerMinMass, min(cell.m - playerMinMass, mass / 1.5))
			}
		}
	}
	eat(cell, arena, always = false){
		if(always) return super.eat(cell, arena)
		if(cell instanceof EjectedMass){
			let m = super.eat(cell, arena)
			if(!grow){
				this.m -= m
				const d = 10 / sqrt(cell.dx * cell.dx + cell.dy * cell.dy)
				this.dx = (this.dx + cell.dx * d) * 0.8
				this.dy = (this.dy + cell.dy * d) * 0.8
				return
			}
			if(this.m > splitMass){
				this.m = minMass
				if(arena.virusCount >= max) return
				const clone = new Virus(this.x, this.y)
				arena.add(clone)
				const x = this.x - cell.x, y = this.y - cell.y
				const d = min(1000, 20 / sqrt(x * x + y * y))
				clone.dx = x * d
				clone.dy = y * d
			}
		}
	}
	solid(){}
}