import messages, { cells, layers } from "./messages.js"
globalThis.ws = null
let t = -1
let autoplay = false
globalThis.connect = function connect(ip){
	cells.clear()
	for(const k in layers)delete layers[k]
	clearTimeout(t)
	if(ws)ws.onclose = () => {}, ws.close()
	let w = new WebSocket(ip.match(/^wss?:/) ? ip : 'wss://' + ip)
	w.binaryType = 'arraybuffer'
	let opened = false
	w.addEventListener('message', ({data}) => {
		opened = true
		const view = new DataView(data, 1)
		const code = new Uint8Array(data, 0, 1)[0]
		const fn = messages[code]
		if(fn) fn(view)
	})
	w.onclose = () => (ws=null,opened ? location.reload() : t = setTimeout(() => connect(ip), 10000))
	w.onopen = () => {ws = w;if(autoplay)play()}
}
localStorage.ip = top.location.hash.slice(1) || localStorage.ip || (top.location.hostname.endsWith('.canv.tk') ? 'blobk.at:9999' : top.location.hostname + ':37730')
for(const el of document.querySelectorAll('[key]')){ const key = el.getAttribute('key'), v = localStorage[key] || (localStorage[key] = el.type == 'checkbox' ? +el.checked : el.value); if(el.type == 'checkbox')el.checked = !!+v;else el.value = v; el.addEventListener('input', e =>{localStorage[key] = el.type == 'checkbox' ? +el.checked : el.value}); el.onchange&&el.onchange() }
globalThis.packet = new DataView(new ArrayBuffer(1024))
const txt = new TextEncoder()
globalThis.spectating = 0
globalThis.play = function(){
	if(!ws){
		autoplay = true
		connect(localStorage.ip)
		return
	}
	packet.setUint8(0, spectating ? 2 : 1)
	let i = 1
	if(spectating)packet.setUint16(1, spectating), i += 2
	else i += txt.encodeInto(localStorage.nick, new Uint8Array(packet.buffer, 1)).written
	ws.send(new Uint8Array(packet.buffer, 0, i))
}
globalThis.pause = function(){
	overlay.classList.remove('hidden')
	packet.setUint8(0, 0)
	packet.setInt32(1, 0)
	packet.setInt16(5, 0)
	ws.send(new Uint8Array(packet.buffer, 7))
}
globalThis.split = function(){
	packet.setUint8(0, 16)
	ws.send(new Uint8Array(packet.buffer, 0, 1))
}
globalThis.eject = function(){
	packet.setUint8(0, 17)
	ws.send(new Uint8Array(packet.buffer, 0, 1))
}
globalThis.gun = function(){
	packet.setUint8(0, 18)
	ws.send(new Uint8Array(packet.buffer, 0, 1))
}
document.onkeydown = function(e){
	if(document.activeElement != document.body) return
	const key = e.key.toLowerCase()
	if(key == ' ' && ws && !e.repeat) split()
	else if(key == 'w' && ws)eject()
	else if(key == 'z' && ws && !e.repeat)gun()
	else if(key == 'escape') pause()
	else if(key == 'enter'){
		if(overlay.classList.contains('hidden')) setTimeout(() => chatbox.focus())
		else play()
	}
}

chatbox.onkeypress = function(e){
	if(e.key != 'Enter') return
	packet.setUint8(0, 63)
	if(!this.value) return
	ws.send(new Uint8Array(packet.buffer, 0, 1 + txt.encodeInto(this.value, new Uint8Array(packet.buffer, 1)).written))
	this.value = ''
	setTimeout(() => this.blur())
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
function move(e){
	if(!ws) return
	mx = e.clientX - innerWidth / 2
	my = e.clientY - innerHeight / 2
	movepacket()
}
function zoom(deltaY){
	packet.setUint8(0, 0)
	packet.setInt16(1, mx)
	packet.setInt16(3, my)
	packet.setInt16(5, mz = deltaY)
	ws.send(new Uint8Array(packet.buffer, 0, 7))
}
arena.addEventListener('mousemove', move)
let prevDist = 0
arena.addEventListener('touchmove', e => {
	if(e.touches[1]){
		const [a, b] = e.touches
		const dist = (b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2
		if(prevDist)zoom(Math.log(prevDist / dist) * 500)
		prevDist = dist
		return
	}
	move(e.touches[0])
})
arena.addEventListener('touchstart', e => move(e.changedTouches[0]))
arena.addEventListener('touchend', e => (e.preventDefault(),prevDist = 0))
arena.addEventListener('contextmenu', e => e.preventDefault())
arena.addEventListener('wheel', function(e){
	if(!e.isTrusted || !ws) return
	zoom(e.deltaY)
	e.preventDefault()
}, {passive:false})
