import { Cell } from "./cell.js"
let id = 0
const txt = new TextDecoder()
const players = new Map
const minimapNodes = new Map
let w = 14142, h = 14142
const cells = new Map
export const layers = {}
export let ping = 0
export default {
	0(view){
		let l = (view.getUint8(0) << 16) + view.getUint16(1), i = 12
		t.x = view.getUint32(2) << 8 >> 8
		t.y = view.getUint32(5) << 8 >> 8
		t.z = Math.exp((view.getUint32(8) & 0xffffff) / 1e6 - 10)
		if(t.i)t.i--,{x,y,z} = t
		if(!!+localStorage.lc)movepacket()
		while(l--){
			const cid = view.getUint32(i) + view.getUint8(i + 4) * 4294967296
			const x = view.getUint32(i + 4) & 0xffffff
			const y = view.getUint32(i + 7) & 0xffffff
			const r = view.getUint32(i + 10) & 0xffffff
			const kind = view.getUint16(i + 14)
			const nid = view.getUint16(i + 16)
			const name = players.get(nid) || ''
			let cell = cells.get(cid)
			if(!cell){
				cell = new Cell()
				cell.x = x
				cell.y = y
				cell.r = r
				cell.id = cid
				cells.set(cid, cell)
			}else{
				const s = layers[cell.tr]
				if(s){s.delete(cell);if(!s.size)delete layers[cell.tr]}
			}
			cell.tx = x
			cell.ty = y
			cell.tr = r
			cell.kind = kind
			cell.name = name
			;(layers[r] || (layers[r] = new Set)).add(cell)
			if(nid == id && id){
				let cell = minimapNodes.get(cid)
				if(!cell)cell = document.createElement('minicell'),minimap.appendChild(cell),minimapNodes.set(cid,cell)
				const s = cell.style, l = Math.max(w, h), r2 = r / l * 200
				s.left = x / l * 200 - r2 + 'px'
				s.top = y / l * 200 - r2 + 'px'
				s.width = s.height = Math.max(2, r2 * 2) + 'px'
				s.background = '#' + (kind & 0xfff).toString(16).padStart(3, '0')
			}
			i += 18
		}
	},
	1(){ overlay.classList.add('hidden') },
	2(){ overlay.classList.remove('hidden') },
	3(view){
		let i = 0
		while(i < view.byteLength){
			let id = view.getUint32(i) + view.getUint8(i + 4) * 4294967296
			const cell = cells.get(id)
			if(cell){
				const s = layers[cell.tr]
				if(s){s.delete(cell);if(!s.size)delete layers[cell.tr]}
			}
			cells.delete(id)
			const minicell = minimapNodes.get(id)
			if(minicell)minicell.remove(),minimapNodes.delete(id)
			i += 5
		}
	},
	16(view){
		const [sel, pel, tpsel] = myscore.children
		players.clear()
		const lb = [], scores = []
		let mei = 0, top = 65536
		id = view.getUint32(0) + view.getUint8(4) * 4294967296
		ping = view.getUint16(5) || ping
		pel.textContent = 'Ping: ' + ping + 'ms'
		tpsel.textContent = 'TPS: ' + view.getUint8(7) / 5
		let i = 8
		while(i < view.byteLength){
			const l = view.getUint8(i++)
			const name = txt.decode(new Uint8Array(view.buffer, view.byteOffset + i, l))
			i += l
			const score = view.getFloat32(i)
			const sid = view.getUint16(i + 4)
			i += 6
			players.set(sid, name)
			let j = scores.findIndex(a => a < score)
			if(j == -1)j = scores.length
			if(sid == id)mei = j, sel.textContent = 'Score: ' + Math.floor(score)
			else if(j <= mei)mei++
			if(!j)top = sid
			scores.splice(j, 0, score)
			lb.splice(j, 0, name)
		}
		i = 0
		if(spectating && spectating != top)spectating = top, play()
		for(const s of leaderboard.children){
			if(i == 10){
				s.textContent = mei > 9 ? mei + 1 + '. ' + (lb[mei] || 'An Unnamed Cell') : ''
			}
			s.textContent = lb[i] !== undefined ? i + 1 + '. ' + (lb[i] || 'An Unnamed Cell') : ''
			s.className = i == mei ? 'red' : ''
			i++
		}
		packet.setUint8(0, 33)
		ws.send(new Uint8Array(packet.buffer, 0, 1))
	},
	17(view){
		w = view.getUint16(1) + (view.getUint8(0) << 16)
		h = view.getUint32(2) & 0xffffff
	},
	255(){
		window.close()
		location = 'about:blank'
	}
}
let mx = 0, my = 0, mz = 0
function movepacket(){
	packet.setUint8(0, 0)
	if(!!+localStorage.lc){
		packet.setInt16(1, (mx + (x - t.x) * z) * z / t.z)
		packet.setInt16(3, (my + (y - t.y) * z) * z / t.z)
	}else{
		packet.setInt16(1, mx)
		packet.setInt16(3, my)
	}
	packet.setInt16(5, 0)
	ws.send(new Uint8Array(packet.buffer, 0, 7))
}
arena.addEventListener('mousemove', function(e){
	if(!e.isTrusted || !ws)return
	mx = e.clientX - innerWidth / 2
	my = e.clientY - innerHeight / 2
	movepacket()
})
arena.addEventListener('wheel', function(e){
	if(!e.isTrusted || !ws)return
	packet.setUint8(0, 0)
	packet.setInt16(1, mx)
	packet.setInt16(3, my)
	packet.setInt16(5, mz = e.deltaY)
	ws.send(new Uint8Array(packet.buffer, 0, 7))
})