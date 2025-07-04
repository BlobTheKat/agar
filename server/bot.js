import { Food } from "./cells/food.js"
import { MotherVirus } from "./cells/mothervirus.js"
import { Virus } from "./cells/virus.js"
let eat2 = 0, teams = false
config(() => (eat2 = CONFIG.eatratio * 2, teams = !!CONFIG.teams))
function attraction(cell, cell2, d2){
	if(teams && cell2.kind == cell.kind) return -0.1
	const ratio = cell.m / cell2.m
	if(ratio > 1){
		if(cell2 instanceof Virus) return -50/(sqrt(d2)-cell2.r+100)
		if(ratio > 2) return 2/ratio
		return ratio - 1
	}else{
		if(cell2 instanceof MotherVirus) return -2
		if(ratio < 0.5) return cell2 instanceof Virus ? 0.1 : -1
		return 1 - 1 / ratio
	}
}
export function bot(sock){
	const {arena} = sock
	let fdx = 0, fdy = 0, fsx = 0, fsy = 0
	for(const cell of sock.cells){
		const x = cell.x, y = cell.y, r = cell.r + 500
		let dx = 0, dy = 0, sx = 0, sy = 0
		arena.select(x - r, x + r, y - r, y + r, cell2 => {
			if(cell2.sock == cell.sock) return
			let ddx = cell2.x - x, ddy = cell2.y - y, d2 = max(1, ddx * ddx + ddy * ddy)
			//if(attraction < 0.001 && attraction > -0.001)continue
			//attraction between -1 and 1
			const d = attraction(cell, cell2, d2) / d2
			ddx *= d
			ddy *= d
			dx += ddx; dy += ddy
			if(cell2.m * eat2 < cell.m && !(cell2 instanceof Food)) sx += ddx, sy += ddy
		})
		fdx += dx * cell.m
		fdy += dy * cell.m
		fsx += sx * cell.m
		fsy += sy * cell.m
	}
	let d = 100 / sqrt(fdx * fdx + fdy * fdy)
	if(d < 10000){
		sock.dx = fdx *= d
		sock.dy = fdy *= d
		d = 100 / sqrt(fsx * fsx + fsy * fsy)
		fsx *= d; fsy *= d
		if(fsx * fdx + fsy * fdy > 3000 && d < 200 / sock.cells.length) sock.split()
	}
	if(sock.score > arena.w * arena.h / 1000 && random() < .0002){
		for(const c of sock.cells)
			sock.arena.remove(c)
		sock.cells.length = 0
		sock.died()
	}
}