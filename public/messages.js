import { t, x, y, z } from "./arena.js"
import { Cell, colors, darkcolors } from "./cell.js"
let id = 0
const txt = new TextDecoder()
const players = new Map
const minimapNodes = new Map
export let w = 14142, h = 14142
export const cells = new Map
export const layers = {}
export let ping = 0
export let skins = true
let tick = 0
export default {
	0(view){
		let l = (view.getUint8(0) << 16) + view.getUint16(1), i = 12
		t.x = view.getUint32(2) << 8 >> 8
		t.y = view.getUint32(5) << 8 >> 8
		t.z = Math.exp((view.getUint32(8) & 0xffffff) / 1e6 - 10)
		tick++
		if(!(tick % 10)){
			if(!!+localStorage.lc)movepacket()
		}
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
			if(kind < 0x1000)cell.points = null
			else if(!cell.points)cell.points = []
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
	1(){ overlay.classList.add('hidden'); document.activeElement.blur() },
	2(){ overlay.classList.remove('hidden') },
	3(view){
		let i = 0
		while(i < view.byteLength){
			let id = view.getUint32(i) + view.getUint8(i + 4) * 4294967296
			const cell = cells.get(id)
			if(cell){
				const s = layers[cell.tr]
				if(s){ s.delete(cell);if(!s.size) delete layers[cell.tr]}
			}
			cells.delete(id)
			const minicell = minimapNodes.get(id)
			if(minicell)minicell.remove(),minimapNodes.delete(id)
			i += 5
		}
	},
	16(view){
		const [sel, , , pel, tpsel, pcel, spel] = myscore.children
		players.clear()
		let mei = 0, top = 65536
		id = view.getUint16(0)
		ping = view.getUint16(2) || ping
		let spec = view.getUint8(4)
		const teams = spec > 127
		skins = !!(spec & 64)
		spec &= 63
		const lb = [], scores = teams ? [0, 0] : []
		pel.textContent = 'Ping: ' + ping + 'ms'
		tpsel.textContent = 'TPS: ' + (view.getUint8(5) * .1).toFixed(1)
		pcel.textContent = 'Players: ' + view.getUint16(6)
		spel.textContent = spec ? 'Spectating you: ' + (spec > 60 ? '60+' : spec) : ''
		let i = 8
		while(i < view.byteLength){
			const l = view.getUint8(i++)
			const name = txt.decode(new Uint8Array(view.buffer, view.byteOffset + i, l))
			i += l
			const score = view.getFloat32(i)
			const sid = view.getUint16(i + 4)
			const kind = teams ? view.getUint16(i + 6) : 0
			i += teams ? 8 : 6
			players.set(sid, name)
			if(teams){
				if(score > scores[0]){
					scores[0] = score
					top = sid
				}
				if(sid == id)sel.textContent = 'Score: ' + Math.floor(score)
				lb[kind] = (lb[kind] || 0) + score
				scores[1] += score
			}else{
				let j = scores.findIndex(a => a < score)
				if(j == -1)j = scores.length
				if(sid == id)mei = j, sel.textContent = 'Score: ' + Math.floor(score)
				else if(j <= mei)mei++
				if(!j)top = sid
				scores.splice(j, 0, score)
				lb.splice(j, 0, name)
			}
		}
		const rows = innerHeight < 470 ? 5 : 10
		i = 0
		if(teams)leaderboard.classList.add('teams')
		else leaderboard.classList.remove('teams')
		if(spectating && spectating != top) spectating = top, play()
		if(teams){
			const [el] = leaderboard.children, gradients = []
			let deg = 0
			for(let kind in lb){
				deg += lb[kind] / scores[1] * 360
				gradients.push(colors[kind & 0xfff] + ' 0 ' + deg.toFixed(5) + 'deg')
			}
			el.style.backgroundImage = 'conic-gradient(' + gradients.join(',') + ')'
		}else for(const s of leaderboard.children){
			s.style.backgroundImage = ''
			if(i == rows && mei >= rows && mei != lb.length){
				s.textContent = mei + 1 + '. ' + (lb[mei] || 'An unnamed cell')
				s.className = 'red'
				s.onclick = null
				i++
			}else if(i == rows) s.textContent = s.className = '', s.onclick = null
			else{
				if(i > rows)s.textContent = ''
				else s.textContent = lb[i] !== undefined ? i + 1 + '. ' + (lb[i] || 'An unnamed cell') : ''
				s.className = i == mei ? 'red' : ''
				s.onclick = null
				i++
			}
		}
		packet.setUint8(0, 33)
		ws.send(new Uint8Array(packet.buffer, 0, 1))
	},
	17(view){
		w = view.getUint16(1) + (view.getUint8(0) << 16)
		h = view.getUint32(2) & 0xffffff
	},
	63(view){
		const namelen = view.getUint8(0)
		const kind = view.getUint16(1)
		const name = txt.decode(new Uint8Array(view.buffer, view.byteOffset + 3, namelen))
		const msg = txt.decode(new Uint8Array(view.buffer, view.byteOffset + 3 + namelen))
		const el = document.createElement('div')
		el.textContent = msg
		el.setAttribute('mname', name || 'An unnamed cell')
		el.style.setProperty('--col', colors[(kind & 0xfff) || 0x555])
		if(chat.children.length > 20)chat.lastChild.remove()
		chatbox.insertAdjacentElement('afterEnd', el)
		el.offsetHeight
		el.style.opacity = 0
	},
	60(){
		window.close()
		location = 'about:blank'
	}
}