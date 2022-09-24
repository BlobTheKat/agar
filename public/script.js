import messages from "./messages.js"
globalThis.ws = null
globalThis.connect = function connect(ip){
	let w = innerWidth, h = innerHeight
	let sd = Math.max(w / 2000, h / 1125)
	if(sd > 1)w /= sd, h /= sd
	w = Math.floor(w); h = Math.floor(h)
	if(ws)ws.onclose = () => {}, ws.close()
	ws = new WebSocket('ws://'+ip)
	ws.binaryType = 'arraybuffer'
	let opened = false
	ws.addEventListener('message', ({data}) => {
		opened = true
		const view = new DataView(data, 1)
		const [code] = new Uint8Array(data, 0, 1)
		const fn = messages[code]
		if(fn)fn(view)
	})
	ws.onclose = () => opened ? location.reload() : 0
	ws.onopen = onresize
}
onresize = function(){
	if(ws){
		packet.setUint8(0, 32)
		packet.setUint16(1, innerWidth)
		packet.setUint16(3, innerHeight)
		ws.send(new Uint8Array(packet.buffer, 0, 5))
	}
}
localStorage.ip = localStorage.ip || location.host + ':37730'
for(const el of document.querySelectorAll('[key]')){ const key = el.getAttribute('key'), v = localStorage[key] || (localStorage[key] = el.type == 'checkbox' ? +el.checked : el.value); if(el.type == 'checkbox')el.checked = !!+v;else el.value = v; el.addEventListener('input', e =>{localStorage[key] = el.type == 'checkbox' ? +el.checked : el.value}); el.onchange&&el.onchange() }
globalThis.packet = new DataView(new ArrayBuffer(1024))
const txt = new TextEncoder()
globalThis.spectating = 0
globalThis.play = function(){
	if(!ws)return
	packet.setUint8(0, spectating ? 2 : 1)
	let i = 1
	if(spectating)packet.setUint16(1, spectating), i += 2
	else i += txt.encodeInto(localStorage.nick, new Uint8Array(packet.buffer, 1)).written
	ws.send(new Uint8Array(packet.buffer, 0, i))
}
onkeydown = function(e){
	if(e.key == ' ' && ws && !e.repeat){
		packet.setUint8(0, 16)
		ws.send(new Uint8Array(packet.buffer, 0, 1))
	}else if(e.key == 'w' && ws){
		packet.setUint8(0, 17)
		ws.send(new Uint8Array(packet.buffer, 0, 1))
	}else if(e.key == 'z' && ws){
		packet.setUint8(0, 18)
		ws.send(new Uint8Array(packet.buffer, 0, 1))
	}else if(e.key == 'Escape'){
		overlay.classList.remove('hidden')
		packet.setUint8(0, 0)
		packet.setInt32(1, 0)
		ws.send(new Uint8Array(packet.buffer, 0, 5))
	}
}