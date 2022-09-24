import { Cell } from "../cell.js";
import { colors } from "../util.js";
import { EjectedMass } from "./ejectedmass.js";
const {minmass, maxmass, startmass, mergetime, massdecay: md} = CONFIG.player
const massdecay = 1 - md / 40
const {min, ceil, floor, random} = Math
export class PlayerCell extends Cell{
	constructor(x, y, sock){
		super(x, y, startmass, 0x2000 + colors[floor(random() * 60)])
		this.sock = sock
		this.age = 0
	}
	added(arena){
		arena.players++
	}
	removed(arena){
		arena.players--
	}
	eaten(cell, arena){

	}
	tick(){
		this.age++
		this.m *= massdecay
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
		const minage = .5833 * min(cell.m, this.m) + mergetime
		if(cell.sock == this.sock && age > 20 && age < minage)super.solid(cell, d)
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
		if(cell instanceof EjectedMass && cell.age >= 1)return
		super.eat(cell, arena)
	}
	touchedborder(){}
}