import { Cell } from "../cell.js"
import { colors } from "../util.js"
import { EjectedMass } from "./ejectedmass.js"

let minMass = 0, maxMass = 0, startMass = 0, mergeTime = 0, massDecay = 0, ejectCooldown = 0, usingTeams = false
config(() => {
	minMass = CONFIG.player.minmass
	maxMass = CONFIG.player.maxmass
	startMass = CONFIG.player.startmass
	mergeTime = CONFIG.player.mergetime
	massDecay = 1 - CONFIG.player.massdecay
	ejectCooldown = CONFIG.eject.cooldown
	usingTeams = !!CONFIG.teams
})

export class PlayerCell extends Cell{
	constructor(x, y, sock, team = 0){
		super(x, y, startMass, 0x5000 | (team || colors[floor(random() * 60)]))
		this.sock = sock
		this.age = 0
	}
	added(arena){
		arena.players++
	}
	removed(arena){
		arena.players--
	}
	eaten(cell, arena){}
	tick(){
		this.age++
		this.m *= this.sock.penalty || massDecay
		if(this.m < minMass)this.m = minMass
		if(this.m > maxMass){
			this.m /= 2
			this.sock.newCell(this.x, this.y, this.m)
			this.age = 0
		}
		return true
	}
	solid(cell, d){
		const age = min(cell.age, this.age)
		if(age <= 20) return
		if(cell.sock == this.sock){
			const minage = .5833 * min(cell.m, this.m) + mergeTime
			if(age < minage)super.solid(cell, d)
		}else if(usingTeams && cell.kind == this.kind) return super.solid(cell, d)
	}
	eat(cell, arena){
		if(cell.sock == this.sock){
			const minage = .5833 * min(cell.m, this.m) + mergeTime
			if(min(cell.age, this.age) < minage) return
			if(cell.eaten(this, arena)) return
			this.m += cell.m
			cell.m = 0
			this.age += cell.age - mergeTime
			return
		}
		if(cell instanceof EjectedMass && cell.age < ejectCooldown) return
		super.eat(cell, arena)
	}
	touchedBorder(){}
}