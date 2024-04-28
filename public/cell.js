import { showcol, showmass, shownames, showskins, staticskins, staticshapes, noshapes, c, x0, y0, max, px, z } from "./arena.js"
import { circle, jelly } from "./jelly.js"
const skins = new Set('2ch.hk,facebook,pokerface,4chan,facepunch,poland,8,feminism,portugal,8ch,fidel,prodota,9gag,finland,prussia,cia,firework,putin,acorn,fly,qing dynasty,aer,fox,quebec,alien x,france,queen,apple,french kingdom,raptor,apple_,german empire,receita federal,argentina,germany,reddit,army,greece,astronaut,hellcat,rockstar,australia,hillary,romania,austria,hollande,russia,ayy lmao,hong kong,sanik,bait,hungary,satanist,bangladesh,hunter,scotland,basketball,imperial japan,sealand,basketball_,india,shark,bat,indiana,sir,bear,indonesia,snake,belgium,iran,somalia,berlusconi,iraq,south korea,birthday troll,ireland,spain,blatter,irs,spider,blob,italy,spitfire,boris,jamaica,stalin,bosnia,japan,stars,botswana,kc,steam,brazil,kim jong-un,stussy,bulgaria,kraken,sumo,bush,latvia,sweden,byzantium,lion,switzerland,cambodia,lithuania,t rex,cameron,lizard,taiwan,cat,luxembourg,texas,maldives,thailand,chaplin,mammoth,tiger,chavez,mars,trump,chile,matriarchy,tsarist russia,china,mercury,tsipras,chrome,merkel,tumblr,clinton,mexico,turkey,confederate,moon,cougar,nasa,ukraine,coyote,netherlands,uncle_sam,creeper,nigeria,united kingdom,croatia,north korea,uranus,crocodile,norway,usa,denmark,nuclear,ussr,dilma,obama,venezuela,doge,origin,venus,dragon,owo,vinesauce,ea,pakistan,wasp,earth day,palin,wicked_cat,earth,panther,wojak,estonia,patriarchy,wolf,european union,peru,yaranaika,evil,piccolo,zebra'.split(','))
const patterns = {__proto__: null, '\u200b': null}
function skin(name){
	if(!name || !showskins)return
	let s = patterns[name]
	if(s === undefined && skins.has(name)){
		//load
		loadskin(name)
		return undefined
	}else return s
}
function loadskin(skin){
	const i = new Image()
	i.src = './skins/' + skin + '.png'
	i.onload = () => patterns[skin] = c.createPattern(i, null)
}
const PI2 = Math.PI * 2
export const colors = [], darkcolors = [], hex = '00123456789abcdef'
for(let r = 0; r < 16; r++)
	for(let g = 0; g < 16; g++)
		for(let b = 0; b < 16; b++)
		colors.push('#' + hex[r + 1] + hex[g + 1] + hex[b + 1]),
		darkcolors.push('#' + hex[r] + hex[g] + hex[b])
export class Cell{
	x = 0
	y = 0
	r = 100
	tx = 0; ty = 0; tr = 100
	kind = 0
	name = ''
	id = 0
	points = null
	tick(dt){
		this.x += (this.tx - this.x) * dt * 20; this.y += (this.ty - this.y) * dt * 20
		this.r *= (this.tr / this.r) ** (dt * 6)
		if(!this.r)this.r = this.tr || 100
	}
	draw(x, y, r){
		const kind = this.kind >> 12
		if(this.points){
			let d = this.points.length - (staticshapes ? (r / 3) << 1 : Math.min(this.r / 3, r) << 1)
			if(d>0)while(d--)this.points.pop()
			else while(d++)this.points.push(this.points[0] || 0)
		}
		c.beginPath()
		if(r < !staticshapes * 10 * px || noshapes){ c.arc(x, y, r, 0, PI2) }
		else switch(kind){
			case 0: circle(x, y, r); break
			case 1: jelly(x, y, r, this, true); break
			case 2: jelly(x, y, r, this, false); break
			case 3: jelly(x, y, r, this, false); break
		}
		const pattern = skin(this.name.toLowerCase())
		if(pattern !== null){
			c.fillStyle = showcol ? colors[this.kind & 0xfff] : '#bbb'
			c.fill()
			if(pattern){
				c.save()
				if(staticskins)c.transform(max / 512, 0, 0, max / 512, x0, y0)
				else c.transform(r / 256, 0, 0, r / 256, x - r, y - r)
				c.fillStyle = pattern
				c.fill()
				c.restore()
			}
		}
		if(kind > 0){
			c.strokeStyle = showcol ? darkcolors[this.kind & 0xfff] : '#aaa'
			c.stroke()
		}
		let mo = 0
		if(shownames && pattern === undefined){
			const font = Math.max(50 * px * z, r >> 1)
			c.font = font + 'px agar'
			c.fillStyle = colors[4095]
			c.strokeStyle = colors[0]
			const l = c.lineWidth
			c.lineWidth = Math.ceil(font / 20)
			c.fillText(this.name,x,y), c.strokeText(this.name,x,y)
			c.lineWidth = l
			mo = 1.4
		}
		if(this.r > 40 && showmass && kind == 2){
			const t = '' + Math.floor(this.r * this.r / 100)
			const font = Math.max(25 * px * z, r >> 2)
			c.font = font + 'px agar'
			c.fillStyle = colors[4095]
			c.strokeStyle = colors[0]
			const l = c.lineWidth
			c.lineWidth = Math.ceil(font / 20)
			c.fillText(t,x,y + font * mo), c.strokeText(t,x,y + font * mo)
			c.lineWidth = l
		}
	}
}
