import { Cell } from "../cell.js";
import { colors } from "../util.js";
import { EjectedMass } from "./ejectedmass.js";
let minmass = 0, maxmass = 0, startmass = 0, mergetime = 0, massdecay = 0, ejectcooldown = 0, teams = false
config(() => ({minmass, maxmass, startmass, mergetime} = CONFIG.player,massdecay = 1 - CONFIG.player.massdecay / 40, ejectcooldown = CONFIG.eject.cooldown, teams = !!CONFIG.teams))
const {min, floor, random} = Math
export class PlayerCell extends Cell{
	constructor(x, y, sock, team = 0){
		super(x, y, startmass, 0x2000 | (team || colors[floor(random() * 60)]))
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
		this.m *= this.sock.penalty || massdecay
		if(this.m < minmass)this.m = minmass
		if(this.m > maxmass){
			this.m /= 2
			this.sock.newcell(this.x, this.y, this.m)
			this.age = 0
		}
		return true
	}
	solid(cell, d){
		const age = min(cell.age, this.age)
		if(age <= 20)return
		if(cell.sock == this.sock){
			const minage = .5833 * min(cell.m, this.m) + mergetime
			if(age < minage)super.solid(cell, d)
		}else if(teams && cell.kind == this.kind)return super.solid(cell, d)
	}
	eat(cell, arena){
		if(cell.sock == this.sock){
			const minage = .5833 * min(cell.m, this.m) + mergetime
			if(min(cell.age, this.age) < minage)return
			this.m += cell.m
			cell.m = 0
			cell.eaten(this, arena)
			this.age += cell.age - mergetime
			return
		}
		if(cell instanceof EjectedMass && cell.age < ejectcooldown)return
		super.eat(cell, arena)
	}
	touchedborder(){}
}