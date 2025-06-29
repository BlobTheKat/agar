let id = 0
export class Cell{
	//kind describes everything about a cell that isnt related to behaviour
	//this mainly includes its color & shape
	//its 16 bits; first 4 bits describe shape; last 12 bits describe color
	constructor(x, y, m = 20, kind = 0){
		this.x = x; this.y = y
		this.m = m
		this.dx = 0
		this.dy = 0
		this.kind = kind
		this.r = ceil(sqrt(this.m) * 10)
		this.id = id++
		this.nameid = 0
	}
	added(){}
	removed(){}
	tick(){}
	eat(cell, arena){
		if(this.m < cell.m * CONFIG.eatratio) return 0
		const m = cell.m
		this.m += m
		cell.m = 0
		cell.eaten(this, arena)
		return m
	}
	eaten(){}
	touched(cell2, d, arena){
		this.solid(cell2, d)
		if(this.m < cell2.m || (this.m == cell2.m && this.id < cell2.id)) return
		if(this.r - d > cell2.r / 3){
			this.eat(cell2, arena)
		}
	}
	solid(cell, d){
		const fac = ((this.r + cell.r) / d - 1) * cell.m / (this.m + cell.m)
		if(fac > 10000) return
		this.x += (this.x - cell.x) * fac
		this.y += (this.y - cell.y) * fac
	}
	touchedborder(a){
		if(a < 2) this.dy *= -1
		else this.dx *= -1
	}
}