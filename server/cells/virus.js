import { Cell } from "../cell.js";
import { EjectedMass } from "./ejectedmass.js";
import { PlayerCell } from "./player.js";
let minmass = 0, maxmass = 0, splitmass = 0, grow = 0, max = 0, playerminmass = 0
config(() => ({minmass, maxmass, splitmass, grow, max} = CONFIG.virus,playerminmass=CONFIG.player.minmass))
export class Virus extends Cell{
	constructor(x, y, mass = Math.floor(minmass + Math.random() * (maxmass + 1 - minmass)), col = 0x12f1){
		super(x, y, mass, col)
	}
	added(arena){
		arena.virusCount++
	}
	removed(arena){
		arena.virusCount--
	}
	eaten(cell){
		if(cell instanceof PlayerCell){
			const m = cell.m * 0.2
			let mass = m
			cell.age = 20
			while(true){
				if(cell.m - mass < playerminmass)break
				const c = cell.sock.newcell(cell.x, cell.y, mass)
				if(!c)break
				cell.m -= mass
				const th = Math.random() * Math.PI * 2
				c.dx = Math.sin(th) * 20
				c.dy = Math.cos(th) * 20
				mass = Math.max(playerminmass, Math.min(cell.m - playerminmass, mass / 1.5))
			}
		}
	}
	eat(cell, arena, always = false){
		if(always)return super.eat(cell, arena)
		if(cell instanceof EjectedMass){
			let m = super.eat(cell, arena)
			if(!grow){
				this.m -= m
				const d = 10 / Math.sqrt(cell.dx * cell.dx + cell.dy * cell.dy)
				this.dx = (this.dx + cell.dx * d) * 0.8
				this.dy = (this.dy + cell.dy * d) * 0.8
				return
			}
			if(this.m > splitmass){
				this.m = minmass
				if(arena.virusCount >= max)return
				const double = new Virus(this.x, this.y)
				arena.add(double)
				const x = this.x - cell.x, y = this.y - cell.y
				const d = Math.min(1000, 20 / Math.sqrt(x * x + y * y))
				double.dx = x * d
				double.dy = y * d
			}
		}
	}
	solid(){}
}