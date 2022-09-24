import { Cell } from "../cell.js";
import { colors } from "../util.js";
const {solid, cooldown} = CONFIG.eject
export class EjectedMass extends Cell{
	age = cooldown
	added(arena){
		arena.ejectedCount++
	}
	removed(arena){
		arena.ejectedCount--
	}
	eat(){}
	solid(cell, d){
		if(solid && cell instanceof EjectedMass)super.solid(cell, d)
	}
	tick(){
		if(this.age < 1)return
		this.age--
		return true
	}
}