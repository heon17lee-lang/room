'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function uid(){return 'f-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
const W=6810,D=8385,MODEL='dongtan-a105-36a',KEY='roomlab-dongtan-a105-36a-v1';
const presets=[['침대 Q','▱',1500,2000,520,'#c9b69d','bed'],['소파 2인','▰',1600,850,780,'#8faaa0','sofa'],['책상','▤',1200,600,740,'#c8a47d','desk'],['수납장','▥',800,400,1800,'#bdc7b6','shelf'],['테이블','▭',1000,600,730,'#d5b992','table'],['의자','▧',500,520,800,'#a1b6bf','chair']];
let state={model:MODEL,items:[],ceiling:2400,cabdepth:600},selected=null,history=[],view='3d',yaw=-0.58,elev=0.86,zoom=1,faces=[],hits=[],floorHits=[],cw=0,ch=0,dpr=1,drag=null,toastTimer;
try{let v=JSON.parse(localStorage.getItem(KEY));if(valid(v))state=v}catch(e){}
function valid(v){return v&&v.model===MODEL&&Array.isArray(v.items)&&v.items.length<=150&&Number.isFinite(v.ceiling)&&v.ceiling>=1800&&v.ceiling<=4000&&Number.isFinite(v.cabdepth)&&v.cabdepth>=300&&v.cabdepth<=900&&v.items.every(i=>typeof i.id==='string'&&typeof i.name==='string'&&/^#[0-9a-f]{6}$/i.test(i.color)&&['w','d','h','x','y','rot'].every(k=>Number.isFinite(i[k]))&&i.w>=50&&i.w<=6000&&i.d>=50&&i.d<=6000&&i.h>=50&&i.h<=4000&&Math.abs(i.x)<=20000&&Math.abs(i.y)<=20000&&[0,90,180,270].includes(i.rot))}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',3000)}
function checkpoint(){history.push(JSON.stringify(state));if(history.length>40)history.shift()}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));$('#saved').textContent='이 기기에 자동 저장됨'}catch(e){$('#saved').textContent='자동 저장 불가 · 배치 파일로 저장하세요'}$('#hlabel').textContent=state.ceiling.toLocaleString();draw()}
function lerpAnchors(v,a){for(let j=1;j<a.length;j++){if(v<=a[j][0])return a[j-1][1]+(v-a[j-1][0])/(a[j][0]-a[j-1][0])*(a[j][1]-a[j-1][1])}return a[a.length-1][1]}
// Pixel-to-mm anchors: explicit dimension spans take precedence over image scaling.
function p(px,py){return [lerpAnchors(px,[[365,0],[385,200],[600,2300],[615,2450],[725,3490],[740,3640],[865,4890],[1050,6640],[1070,W]]),lerpAnchors(py,[[377,0],[415,380],[540,1600],[559,1780],[652,2680],[660,2780],[677,2930],[690,3060],[1070,6760],[1109,7040],[1204,8040],[1220,8170],[1245,D]])]}
const outline=[[365,377],[905,377],[905,510],[1070,510],[1070,1245],[365,1245]].map(a=>p(...a));
function rectImg(x1,y1,x2,y2){let a=p(x1,y1),b=p(x2,y2);return {x:a[0],y:a[1],w:b[0]-a[0],d:b[1]-a[1]}}
let fixed=[],walls=[];
const doors=[{name:'현관문',a:[725,390],b:[625,390],side:-1},{name:'작은 방',a:[607,650],b:[607,562],side:-1},{name:'욕실',a:[736,559],b:[736,633],side:-1},{name:'침실',a:[732,750],b:[732,850],side:-1},{name:'다용도실',a:[930,1110],b:[930,1180],side:-1}];
function setup(){fixed=[];walls=[];
 const add=(name,r,h,color,type='cab')=>fixed.push({...r,h,color,name,type});
 add('욕실',rectImg(740,559,965,660),0,'#a5aaa4','bathfloor');
 add('욕실',rectImg(740,660,875,735),0,'#a5aaa4','bathfloor');
 add('설비 공간',rectImg(975,540,1050,660),state.ceiling,'#aeb6aa','utility');
 add('신발장',rectImg(823,420,865,525),state.ceiling-100,'#d8d9cf');
 add('주방 기둥',rectImg(385,665,445,750),state.ceiling,'#d4d6c9','utility');
 add('싱크대',rectImg(455,677,615,740),880,'#dedfd5','sink');
 let cook=rectImg(385,760,450,942);cook.w=state.cabdepth;
 add('조리대',cook,880,'#dedfd5','cook');
 add('침실 붙박이장',rectImg(895,690,1050,750),state.ceiling-100,'#d5dacd','wardrobe');
 // Balcony floors remain usable for movable furniture; equipment closet is reserved.
 add('다용도실 설비 영역',rectImg(965,1180,1045,1220),700,'#bec4b9','utility');
 const wall=(x1,y1,x2,y2)=>{const a=p(x1,y1),b=p(x2,y2);walls.push({x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),w:Math.abs(a[0]-b[0]),d:Math.abs(a[1]-b[1])})};
 wall(365,377,430,415);wall(555,377,620,415);wall(730,377,905,415);
 wall(365,415,385,1245);wall(880,415,905,530);wall(905,510,1070,540);wall(1050,540,1070,1245);
 wall(365,1204,433,1245);wall(678,1204,778,1245);wall(923,1220,948,1245);wall(1040,1220,1070,1245);
 // Small room: entrance is on its right wall; bottom is a full partition.
 wall(600,415,615,562);wall(385,652,615,677);
 // Bathroom with stepped footprint and an entrance gap on the left.
 wall(725,540,975,559);wall(965,559,975,660);wall(725,633,740,752);wall(725,735,895,752);wall(875,660,895,735);wall(895,660,1050,690);
 // Bedroom partition and balcony thresholds.
 wall(725,850,740,1070);wall(725,1070,780,1109);wall(925,1070,1050,1109);
 wall(725,1109,765,1204);wall(925,1180,943,1220);
}
function bounds(i){let turn=i.rot%180!==0;return {x:i.x-(turn?i.d:i.w)/2,y:i.y-(turn?i.w:i.d)/2,w:turn?i.d:i.w,d:turn?i.w:i.d}}
function overlap(a,b){return a.x<b.x+b.w-1&&a.x+a.w>b.x+1&&a.y<b.y+b.d-1&&a.y+a.d>b.y+1}
function inside(x,y){let c=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){let a=outline[i],b=outline[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function warnings(i){const b=bounds(i),warn=[];if(![[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.d],[b.x+b.w,b.y+b.d]].every(q=>inside(...q)))warn.push('가구가 방 외곽을 벗어납니다');if(walls.some(w=>overlap(b,w)))warn.push('벽과 겹칩니다');const f=fixed.filter(f=>overlap(b,f));if(f.length)warn.push('고정 공간과 겹침: '+[...new Set(f.map(f=>f.name))].join(', '));const others=state.items.filter(j=>j.id!==i.id&&overlap(b,bounds(j)));if(others.length)warn.push('다른 가구와 겹침: '+others.map(j=>j.name).join(', '));if(i.h>state.ceiling)warn.push('천장 높이를 초과합니다');return warn}
function gaps(i){const b=bounds(i);let l=0,r=W,t=0,bot=D;for(const f of [...walls,...fixed]){if(f.y<b.y+b.d&&f.y+f.d>b.y){if(f.x+f.w<=b.x)l=Math.max(l,f.x+f.w);if(f.x>=b.x+b.w)r=Math.min(r,f.x)}if(f.x<b.x+b.w&&f.x+f.w>b.x){if(f.y+f.d<=b.y)t=Math.max(t,f.y+f.d);if(f.y>=b.y+b.d)bot=Math.min(bot,f.y)}}return [b.x-l,r-b.x-b.w,b.y-t,bot-b.y-b.d].map(Math.round)}
function update(){setup();$('#ceiling').value=state.ceiling;$('#cabdepth').value=state.cabdepth;$('#count').textContent=state.items.length+'개';$('#list').innerHTML=state.items.length?state.items.map(i=>`<button class="item ${selected===i.id?'active':''}" data-id="${esc(i.id)}"><span class="dot" style="background:${i.color}"></span>${esc(i.name)}<span>${warnings(i).length?'⚠':'↗'}</span></button>`).join(''):'<div class="note">가구를 추가하면 여기에 표시됩니다.</div>';$$('[data-id]').forEach(b=>b.onclick=()=>select(b.dataset.id));editor();persist()}
function select(id){selected=id;update()}
function editor(){const i=state.items.find(i=>i.id===selected);if(!i){$('#editor').innerHTML='<div class="empty">가구를 추가하거나<br>화면 속 가구를 선택하세요.<br><span style="font-size:24px">↖</span></div>';return}const warn=warnings(i),g=gaps(i);$('#editor').innerHTML=`<label class="field">가구 이름<input id="name" maxlength="40" value="${esc(i.name)}"></label><div class="row3">${[['w','가로'],['d','깊이'],['h','높이']].map(([k,n])=>`<label class="field">${n} mm<input id="${k}" type="number" min="50" max="${k==='h'?4000:6000}" value="${i[k]}" step="10"></label>`).join('')}</div><div class="row"><label class="field">중심 X mm<input id="x" type="number" value="${i.x}" step="50" min="-20000" max="20000"></label><label class="field">중심 Y mm<input id="y" type="number" value="${i.y}" step="50" min="-20000" max="20000"></label></div><div class="row"><label class="field">시계 방향 회전<select id="rot">${[0,90,180,270].map(a=>`<option ${i.rot===a?'selected':''}>${a}</option>`).join('')}</select></label><label class="field">가구 색상<input id="color" type="color" value="${i.color}" style="height:37px"></label></div><button id="apply" class="primary full">치수 / 위치 적용</button><div class="row" style="margin-top:8px"><button id="duplicate">복제</button><button id="delete">삭제</button></div><h3>배치 확인</h3><div class="status ${warn.length?'warn':''}">${warn.length?warn.map(esc).join('<br>'):'기하학적 겹침 없음 · 문 개방 범위는 별도 확인'}</div><h3>고정 시설까지 여유 거리</h3><div class="note">선택 가구와 같은 가로·세로 구간의 벽/고정 공간까지 거리. 다른 이동 가구는 제외.</div>${['왼쪽','오른쪽','위쪽 (현관 방향)','아래쪽 (창 방향)'].map((n,j)=>`<div class="metric"><span>${n}</span><b>${warn.length?'—':g[j].toLocaleString()+' mm'}</b></div>`).join('')}`;
 $('#apply').onclick=()=>{const next={...i,name:$('#name').value.trim()||'가구',color:$('#color').value};for(const k of ['w','d','h','x','y','rot'])next[k]=Number($('#'+k).value);if(!valid({...state,items:[next]})){toast('치수·위치 입력 범위를 확인해 주세요');return}checkpoint();Object.assign(i,next);update()};$('#delete').onclick=()=>{checkpoint();state.items=state.items.filter(j=>j.id!==i.id);selected=null;update()};$('#duplicate').onclick=()=>{checkpoint();const copy={...i,id:uid(),name:i.name+' 복사',x:i.x+250,y:i.y+250};state.items.push(copy);selected=copy.id;update()}}
function add(preset){checkpoint();let [name,icon,w,d,h,color,type]=preset;const i={id:uid(),name,w,d,h,color,type,x:5100,y:4900,rot:0};for(let y=3900;y<6500;y+=250){let found=false;for(let x=4500;x<5900;x+=250){i.x=x;i.y=y;if(!warnings(i).length){found=true;break}}if(found)break}state.items.push(i);selected=i.id;update();toast('가구 추가됨 · 평면 보기에서 이동하세요')}
$('#catalog').innerHTML=presets.map((p,k)=>`<button data-add="${k}"><i>${p[1]}</i>${p[0]}<small>${p[2]} × ${p[3]}</small></button>`).join('');$$('[data-add]').forEach(b=>b.onclick=()=>add(presets[+b.dataset.add]));$('#custom').onclick=()=>add(['사용자 가구','',1000,600,800,'#b6b0c8','box']);
function dimension(a,b,text,vertical=false){strokeWorld([[...a,0],[...b,0]],'#85917b',1,[3,3]);label((a[0]+b[0])/2+(vertical?180:0),(a[1]+b[1])/2+(vertical?0:-130),0,text+' mm',10,'#64775e',true)}
const canvas=$('#scene'),ctx=canvas.getContext('2d');let unit=1;
function resize(){const r=canvas.getBoundingClientRect();cw=r.width;ch=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);draw()}
function project(x,y,z=0){let X=x-W/2,Y=y-D/2;unit=Math.min(cw/(W+3300),ch/(D+2500))*zoom;if(view==='2d')return [cw/2+X*unit,ch/2+20+Y*unit,z];let rx=X*Math.cos(yaw)-Y*Math.sin(yaw),ry=X*Math.sin(yaw)+Y*Math.cos(yaw);return [cw/2+rx*unit,ch/2+40+(ry*Math.sin(elev)-z*Math.cos(elev))*unit,ry*Math.cos(elev)+z*Math.sin(elev)]}
function unproject(x,y){return [(x-cw/2)/unit+W/2,(y-ch/2-20)/unit+D/2]}
function tint(hex,n){let c=hex.replace('#','');return '#'+[0,2,4].map(k=>Math.max(0,Math.min(255,parseInt(c.slice(k,k+2),16)+n)).toString(16).padStart(2,'0')).join('')}
function poly(pts,fill,stroke='#31433b25',id=null){let q=pts.map(p=>project(...p));faces.push({pts:q,world:pts,fill,stroke,id,depth:q.reduce((s,p)=>s+p[2],0)/q.length})}
function box(x,y,w,d,h,col,z=0,id=null,rotation=0,cx=x+w/2,cy=y+d/2){function v(a,b,c){let dx=a-cx,dy=b-cy,r=rotation*Math.PI/180;return [cx+dx*Math.cos(r)-dy*Math.sin(r),cy+dx*Math.sin(r)+dy*Math.cos(r),c]}let a=v(x,y,z),b=v(x+w,y,z),c=v(x+w,y+d,z),e=v(x,y+d,z),A=v(x,y,z+h),B=v(x+w,y,z+h),C=v(x+w,y+d,z+h),E=v(x,y+d,z+h);if(view==='2d'){poly([A,B,C,E],col,'#4a5d4f60',id);return}poly([a,b,B,A],tint(col,-16),undefined,id);poly([b,c,C,B],tint(col,-30),undefined,id);poly([c,e,E,C],tint(col,-12),undefined,id);poly([e,a,A,E],tint(col,-25),undefined,id);poly([A,B,C,E],tint(col,12),undefined,id)}
function furniture(i){let color=warnings(i).length?'#d5a26c':i.color;let x=i.x-i.w/2,y=i.y-i.d/2,r=i.rot;const b=(dx,dy,w,d,h,c,z=0)=>box(x+dx,y+dy,Math.max(10,w),Math.max(10,d),Math.max(5,h),c,z,i.id,r,i.x,i.y);if(view==='2d'){b(0,0,i.w,i.d,i.h,color);if(i.type==='bed')b(i.w*.07,Math.min(60,i.d*.05),i.w*.86,Math.min(320,i.d*.22),8,'#eee9dd',i.h+1);return}
 if(i.type==='bed'){b(0,0,i.w,i.d,i.h*.23,tint(color,-25),i.h*.1);b(20,30,i.w-40,i.d-60,i.h*.42,color,i.h*.33);b(0,0,i.w,Math.min(65,i.d*.05),i.h,tint(color,-20));let pw=Math.max(30,(i.w-200)/2),pd=Math.min(350,i.d*.2);b(70,100,pw,pd,i.h*.12,'#eeeade',i.h*.75);b(i.w/2+30,100,pw,pd,i.h*.12,'#eeeade',i.h*.75)}
 else if(['desk','table'].includes(i.type)){b(0,0,i.w,i.d,Math.min(45,i.h*.1),color,i.h-Math.min(45,i.h*.1));for(let dx of [i.w*.05,i.w*.9])for(let dy of [i.d*.05,i.d*.85])b(dx,dy,Math.min(40,i.w*.05),Math.min(40,i.d*.05),i.h*.94,'#61746a')}
 else if(i.type==='sofa'){b(0,0,i.w,i.d,i.h*.45,color,i.h*.1);b(0,0,i.w,i.d*.16,i.h*.45,tint(color,-10),i.h*.55);b(0,0,i.w*.09,i.d,i.h*.7,tint(color,-8));b(i.w*.91,0,i.w*.09,i.d,i.h*.7,tint(color,-8));for(let j=0;j<2;j++)b(i.w*.1+j*i.w*.4,i.d*.18,i.w*.39,i.d*.78,i.h*.12,tint(color,12),i.h*.5)}
 else if(i.type==='chair'){b(0,0,i.w,i.d,i.h*.08,color,i.h*.5);b(0,0,i.w,i.d*.12,i.h*.5,color,i.h*.5);for(let dx of [i.w*.06,i.w*.88])for(let dy of [i.d*.06,i.d*.88])b(dx,dy,i.w*.06,i.d*.06,i.h*.5,'#61746a')}
 else{b(0,0,i.w,i.d,i.h,color);if(i.type==='shelf')for(let z=300;z<i.h;z+=400)b(25,i.d-15,i.w-50,18,8,tint(color,-35),z)}}
function strokeWorld(points,col,width=1,dash=[]){ctx.beginPath();points.forEach((p,i)=>{let q=project(...p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.strokeStyle=col;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
function label(x,y,z,text,size=11,col='#51675b',bg=false){let q=project(x,y,z);ctx.font=`${size}px -apple-system,BlinkMacSystemFont,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';if(bg){let w=ctx.measureText(text).width;ctx.fillStyle='#ffffffdf';ctx.fillRect(q[0]-w/2-6,q[1]-size/2-4,w+12,size+8)}ctx.fillStyle=col;ctx.fillText(text,q[0],q[1])}
function draw(){if(!cw)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cw,ch);faces=[];hits=[];
 poly(outline.map(([x,y])=>[x,y,0]),'#e0d1b9');
 // Timber boards clipped to the actual footprint.
 ctx.save();const fp=outline.map(a=>project(...a));ctx.beginPath();fp.forEach((a,i)=>i?ctx.lineTo(a[0],a[1]):ctx.moveTo(a[0],a[1]));ctx.closePath();ctx.clip();ctx.fillStyle='#e2d4be';ctx.fill();for(let x=0;x<W;x+=190)strokeWorld([[x,0,1],[x,D,1]],'#c6b79c65',.6);for(let y=0;y<D;y+=1100)strokeWorld([[0,y,1],[W,y,1]],'#c8b99f35',.6);ctx.restore();
 faces=[]; // Floor already painted, so it cannot obscure near-side walls.
 const entry=rectImg(615,390,865,540);box(entry.x,entry.y,entry.w,entry.d,5,'#d5d7cd');
 for(const r of [rectImg(765,1109,925,1220),rectImg(943,1109,1050,1220)])box(r.x,r.y,r.w,r.d,5,'#aeb8b3');
 for(const f of fixed){box(f.x,f.y,f.w,f.d,f.h,f.color);
  if(['sink','cook'].includes(f.type)){
   box(f.x-8,f.y-8,f.w+16,f.d+16,35,'#e6e8df',f.h);
   if(f.type==='sink'){
    box(f.x+100,f.y+110,550,400,14,'#84948f',f.h+35);
    box(f.x+340,f.y+30,35,35,240,'#929f98',f.h+35);
   }else{box(f.x+70,f.y+140,Math.max(100,f.w-140),400,12,'#424c47',f.h+35)}
   if(view==='3d')box(f.x,f.y,Math.min(f.w,350),f.d,600,'#dedfd4',state.ceiling-600);
  }
  if(f.type==='wardrobe'&&view==='3d')for(let x=f.x+500;x<f.x+f.w;x+=500)box(x,f.y-3,8,10,f.h-40,'#b5bdaf',20);
 }
 // Approximate bathroom fixtures; dimensions are not provided by the plan.
 {const f=rectImg(755,663,805,721);box(f.x,f.y,f.w,f.d,430,'#e9ece4');const s=rectImg(812,676,870,725);box(s.x,s.y,s.w,s.d,820,'#e5e9e0');const sh=rectImg(870,565,960,650);box(sh.x,sh.y,sh.w,sh.d,25,'#bcc8c2')}
 const wallheight=$('#walls').checked?state.ceiling:420;
 for(const w of walls)box(w.x,w.y,w.w,w.d,wallheight,'#d4ddd1');
 const wins=[[430,392,555,415,900,1100],[433,1204,678,1220,200,2000],[780,1070,925,1092,200,2000],[778,1220,923,1240,500,1600],[948,1220,1040,1240,900,1000]];
 for(const [x1,y1,x2,y2,sill,height] of wins){let r=rectImg(x1,y1,x2,y2);box(r.x,r.y,r.w,r.d,view==='2d'?10:($('#walls').checked?height:240),'#b2cdd0',view==='2d'?10:($('#walls').checked?sill:200));if(view==='3d'){let h=$('#walls').checked?height:240,z=$('#walls').checked?sill:200;for(let x of [r.x,r.x+r.w/2,r.x+r.w-25])box(x,r.y,25,r.d,h,'#e7ece4',z);box(r.x,r.y,r.w,r.d,30,'#e7ece4',z)}}
 state.items.forEach(furniture);
 if(view==='3d')faces.sort((a,b)=>a.depth-b.depth);
 for(const f of faces){ctx.beginPath();f.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.fill;ctx.fill();ctx.strokeStyle=f.stroke||'#31433b25';ctx.lineWidth=.7;ctx.stroke();if(f.id)hits.push(f)}
 let i=state.items.find(i=>i.id===selected);if(i){let b=bounds(i),z=view==='2d'?0:i.h+12;strokeWorld([[b.x,b.y,z],[b.x+b.w,b.y,z],[b.x+b.w,b.y+b.d,z],[b.x,b.y+b.d,z],[b.x,b.y,z]],warnings(i).length?'#b96f24':'#236e55',2,[5,3]);label(i.x,i.y,z+70,i.name,12,'#203b37',true);if(view==='2d'&&$('#dims').checked){label(i.x,b.y-160,0,`${i.w.toLocaleString()} × ${i.d.toLocaleString()} mm`,11,'#296657',true)}}
 // Door swings shown as approximate plan geometry (not swept-volume collision checks).
 if(view==='2d'&&$('#doors').checked){for(const d of doors){let a=p(...d.a),b=p(...d.b),dx=b[0]-a[0],dy=b[1]-a[1];let pts=[];for(let j=0;j<=20;j++){let t=d.side*Math.PI/2*j/20;pts.push([a[0]+dx*Math.cos(t)-dy*Math.sin(t),a[1]+dx*Math.sin(t)+dy*Math.cos(t),0])}strokeWorld([a,b],'#9a8d73',1);strokeWorld(pts,'#9a8d73',1,[3,3]);strokeWorld([a,pts[20]],'#9a8d73',1)}}
 if($('#dims').checked){if(view==='2d'){
 label(1220,1200,0,'작은 방',12);label(1900,4700,0,'거실 · 주방',12);label(5100,4700,0,'침실',12);label(4150,2300,0,'욕실',10);label(3450,900,0,'현관',10);label(4390,7650,0,'발코니',10);label(6010,7650,0,'다용도실',10);
 dimension([200,7700],[3490,7700],'3,290');dimension([3640,6400],[6640,6400],'3,000');dimension([200,650],[2300,650],'2,100');dimension([550,2930],[550,8040],'5,110',true);dimension([6250,3060],[6250,6760],'3,700',true);
 state.items.filter(j=>j.id!==selected).forEach(j=>label(j.x,j.y,0,j.name,10,'#203b37',true));
 }strokeWorld([[0,D+450,0],[W,D+450,0]],'#83968b',1);for(let x of [0,W])strokeWorld([[x,D+350,0],[x,D+550,0]],'#83968b');label(W/2,D+680,0,'6,810 mm · 도면 외곽 폭',11);strokeWorld([[W+450,0,0],[W+450,D,0]],'#83968b',1);label(W+600,D/2,0,'8,385',10);}
 // Datum marker for coordinates, aligned with the plan view.
 if(view==='2d'){label(0,-240,0,'도면 방향 그대로 · X → / Y ↓',10)}
}
function pointIn(pt,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>pt[1])!==(b[1]>pt[1])&&pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function itemAt(x,y){for(let j=hits.length-1;j>=0;j--)if(pointIn([x,y],hits[j].pts))return hits[j].id;return null}
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,id=itemAt(x,y);if(id)select(id);let p=unproject(x,y),i=state.items.find(i=>i.id===id);drag={px:x,py:y,startX:x,startY:y,id,ox:i?i.x-p[0]:0,oy:i?i.y-p[1]:0,moved:false,checkpoint:false};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(Math.hypot(x-drag.startX,y-drag.startY)>3)drag.moved=true;if(view==='3d'){yaw+=(x-drag.px)*.008;elev=Math.max(.25,Math.min(1.5,elev+(y-drag.py)*.006));draw()}else if(drag.id){const i=state.items.find(i=>i.id===drag.id);if(i&&drag.moved){if(!drag.checkpoint){checkpoint();drag.checkpoint=true}const p=unproject(x,y),s=$('#snap').checked?50:1;i.x=Math.max(-20000,Math.min(20000,Math.round((p[0]+drag.ox)/s)*s));i.y=Math.max(-20000,Math.min(20000,Math.round((p[1]+drag.oy)/s)*s));draw()}}drag.px=x;drag.py=y});
function end(){if(drag){if(!drag.id&&!drag.moved)selected=null;if(drag.checkpoint||!drag.moved)update();drag=null}}canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.5,zoom*Math.exp(-e.deltaY*.001)));draw()},{passive:false});
$$('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));$('#viewtitle').textContent=view==='2d'?'치수를 보며 정확하게 배치하세요':'나만의 공간을 먼저 둘러보세요';$('#viewhint').innerHTML=view==='2d'?'가구 드래그: 이동 · 휠: 확대<br>오른쪽에서 치수와 위치를 직접 입력할 수 있습니다.':'드래그: 회전 · 휠: 확대 · 가구 클릭: 선택<br>가구 이동은 ‘평면 배치’에서 가능합니다.';draw()});
$('#angle').onclick=()=>{yaw=-.58;elev=.86;zoom=1;draw()};$('#zoomIn').onclick=()=>{zoom=Math.min(2.5,zoom*1.18);draw()};$('#zoomOut').onclick=()=>{zoom=Math.max(.55,zoom/1.18);draw()};['walls','dims','doors'].forEach(k=>$('#'+k).onchange=draw);
$('#roomapply').onclick=()=>{const c=Number($('#ceiling').value),d=Number($('#cabdepth').value);if(!valid({...state,ceiling:c,cabdepth:d})){toast('천장 1800~4000 / 깊이 300~900mm 범위로 입력하세요');return}checkpoint();state.ceiling=c;state.cabdepth=d;update()};$('#undo').onclick=()=>{if(!history.length){toast('되돌릴 변경이 없습니다');return}state=JSON.parse(history.pop());if(!state.items.some(i=>i.id===selected))selected=null;update()};
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
$('#save').onclick=()=>download(new Blob([JSON.stringify({format:'roomlab-dongtan-36a-v1',...state},null,2)],{type:'application/json'}),'dongtan-36a-layout-'+new Date().toISOString().slice(0,10)+'.json');$('#load').onclick=()=>$('#file').click();$('#file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error();const v=JSON.parse(await file.text());if(!valid(v))throw Error();checkpoint();state={model:MODEL,items:v.items,ceiling:v.ceiling,cabdepth:v.cabdepth};selected=null;update();toast('배치를 불러왔습니다')}catch(e){toast('동탄 36A 모델에서 저장한 배치 JSON을 선택하세요')}$('#file').value=''};$('#reset').onclick=()=>{if(!confirm('가구를 모두 지울까요? 되돌리기로 복구할 수 있습니다.'))return;checkpoint();state.items=[];selected=null;update()};$('#reference').onclick=()=>$('#refdialog').showModal();$('#help').onclick=()=>$('#helpdialog').showModal();$('#shot').onclick=()=>{const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const c=out.getContext('2d');c.fillStyle='#eef2ea';c.fillRect(0,0,out.width,out.height);c.drawImage(canvas,0,0);c.fillStyle='#365344';c.font=`${12*dpr}px sans-serif`;c.fillText('ROOM LAB · 도면 기반 초안 / 실측 전',20*dpr,28*dpr);out.toBlob(b=>{if(b)download(b,'room-layout.png')})};
new ResizeObserver(resize).observe(canvas);update();

$('#example').onclick=()=>{if(state.items.length&&!confirm('현재 가구를 예시 배치로 바꿀까요? 되돌리기로 복구할 수 있습니다.'))return;checkpoint();state.items=[
 {id:uid(),name:'침대 Q',w:1500,d:2000,h:650,x:5150,y:5000,rot:0,color:'#c9b69d',type:'bed'},
 {id:uid(),name:'작은 방 책상',w:1200,d:600,h:740,x:1250,y:1100,rot:0,color:'#c8a47d',type:'desk'},
 {id:uid(),name:'2인 소파',w:1600,d:850,h:780,x:2000,y:4900,rot:0,color:'#8faaa0',type:'sofa'},
 {id:uid(),name:'거실 테이블',w:900,d:500,h:400,x:2000,y:6000,rot:0,color:'#d5b992',type:'table'}];selected=null;update();toast('크기 비교용 예시 배치를 적용했습니다')};
$('#obj').onclick=()=>{const oldView=view,oldWalls=$('#walls').checked;view='3d';$('#walls').checked=true;draw();let lines=['# ROOM LAB Dongtan A105 36A - metric model, Y up; dimensions partly estimated.'],idx=1;lines.push('o floor');for(let p of outline)lines.push(`v ${(p[0]/1000).toFixed(4)} 0 ${(-p[1]/1000).toFixed(4)}`);lines.push('f '+outline.map((_,i)=>i+1).reverse().join(' '));idx=outline.length+1;
 for(let f of faces){lines.push('g '+(f.id?'furniture_'+f.id:'structure'));for(let p of f.world)lines.push(`v ${(p[0]/1000).toFixed(4)} ${(p[2]/1000).toFixed(4)} ${(-p[1]/1000).toFixed(4)}`);lines.push('f '+f.world.map((_,j)=>idx+j).reverse().join(' '));idx+=f.world.length}
 view=oldView;$('#walls').checked=oldWalls;draw();download(new Blob([lines.join('\n')],{type:'text/plain'}),'dongtan-36a-model.obj');toast('OBJ 저장 · 단위 m / 색상 없는 기본 메시')};
