import { Cell } from "../cell.js"
import { colors } from "../util.js"

let solid = 0, cooldown = 0
config(() => ({solid, cooldown} = CONFIG.eject))
export class EjectedMass extends Cell{
	age = 0
	added(arena){
		arena.ejectedCount++
	}
	removed(arena){
		arena.ejectedCount--
	}
	eat(){}
	solid(cell, d){
		if(solid && cell instanceof EjectedMass) super.solid(cell, d)
	}
	tick(){
		if(this.age >= cooldown) return
		this.age++
		return true
	}
}