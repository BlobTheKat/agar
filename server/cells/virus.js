import { Cell } from "../cell.js";
import { EjectedMass } from "./ejectedmass.js";
import { PlayerCell } from "./player.js";
const {minmass, maxmass, splitmass, grow} = CONFIG.virus
const playerminmass = CONFIG.player.minmass
export class Virus extends Cell{
	constructor(x, y){
		super(x, y, Math.floor(minmass + Math.random() * (maxmass + 1 - minmass)), 0x12f1)
	}
	added(arena){
		arena.virusCount++
	}
	removed(arena){
		arena.virusCount--
	}
	eaten(cell, arena){
		if(cell instanceof PlayerCell){
			const m = cell.m * 0.2
			let mass = m
			cell.age = 0
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
	eat(cell, arena){
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