// ==CORE-START==  (không cần Three.js; node chạy được để kiểm tra)
// Hệ hiển thị = hệ xe (ego) lúc LiDAR quét, gọi là E_l: x trước, y trái, z lên, gốc giữa trục bánh sau ở mặt đường.
const CAM_ORDER=['CAM_FRONT','CAM_FRONT_RIGHT','CAM_BACK_RIGHT','CAM_BACK','CAM_BACK_LEFT','CAM_FRONT_LEFT'];
const CAM_TEN={CAM_FRONT:'trước',CAM_FRONT_RIGHT:'trước phải',CAM_BACK_RIGHT:'sau phải',CAM_BACK:'sau',CAM_BACK_LEFT:'sau trái',CAM_FRONT_LEFT:'trước trái'};
// Renault Zoe ZE40 (2017): số từ bộ tài liệu báo chí Renault UK 07/2017 qua bản tóm tắt tìm kiếm, ADAC đối chiếu (chưa mở được PDF gốc)
const EGO={dai:4.084,rong:1.730,rong_guong:1.945,cao:1.562,coso:2.588,nho_truoc:0.839,nho_sau:0.657,vet:1.511,r_banh:0.31,lop:'195/55 R16'};
const LOAI={'vehicle.car':'xe con','vehicle.truck':'xe tải','vehicle.bus.rigid':'xe buýt','vehicle.bus.bendy':'xe buýt nối','vehicle.trailer':'rơ moóc','vehicle.construction':'xe công trình',
  'vehicle.motorcycle':'xe máy','vehicle.bicycle':'xe đạp','human.pedestrian.adult':'người lớn','human.pedestrian.child':'trẻ em','human.pedestrian.construction_worker':'công nhân',
  'human.pedestrian.police_officer':'cảnh sát','movable_object.barrier':'rào chắn','movable_object.trafficcone':'cọc tiêu','movable_object.pushable_pullable':'xe đẩy',
  'movable_object.debris':'mảnh vụn','static_object.bicycle_rack':'giá xe đạp','animal':'động vật'};
const PHIS=[0.1,0.2,0.3,0.4,0.5,0.6,0.7],TH_SEG=0.8,TAU=0.15,R_VUNG=25;

const f=(x,n=2)=>{if(!isFinite(x))return'—';let s=x.toFixed(n);if(/^-0[.,]?0*$/.test(s))s=s.slice(1);return s.replace('.',',')};
const ft=(x,n=2)=>f(x,n).replace(',','{,}');
const deg=r=>r*180/Math.PI;
function dec(b64,T){let u;if(typeof atob==='function'){const s=atob(b64);u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)}else u=new Uint8Array(Buffer.from(b64,'base64'));return new T(u.buffer,0,u.byteLength/T.BYTES_PER_ELEMENT)}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- xoay và biến đổi cứng {R, t}
function qR(q){const[w,x,y,z]=q;return[[1-2*(y*y+z*z),2*(x*y-w*z),2*(x*z+w*y)],[2*(x*y+w*z),1-2*(x*x+z*z),2*(y*z-w*x)],[2*(x*z-w*y),2*(y*z+w*x),1-2*(x*x+y*y)]]}
const yawQ=q=>{const[w,x,y,z]=q;return Math.atan2(2*(w*z+x*y),1-2*(y*y+z*z))};
const mv=(R,p)=>[R[0][0]*p[0]+R[0][1]*p[1]+R[0][2]*p[2],R[1][0]*p[0]+R[1][1]*p[1]+R[1][2]*p[2],R[2][0]*p[0]+R[2][1]*p[1]+R[2][2]*p[2]];
const mm=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
const tp=R=>[0,1,2].map(i=>[R[0][i],R[1][i],R[2][i]]);
const rig=(R,t)=>({R,t:[t[0],t[1],t[2]]});
const app=(T,p)=>{const q=mv(T.R,p);return[q[0]+T.t[0],q[1]+T.t[1],q[2]+T.t[2]]};
const comp=(A,B)=>rig(mm(A.R,B.R),app(A,B.t));                 // A∘B: làm B trước rồi A
const inv=A=>{const Rt=tp(A.R),q=mv(Rt,A.t);return rig(Rt,[-q[0],-q[1],-q[2]])};
const fromRec=r=>rig(qR(r.rotation),r.translation);
const col=(R,j)=>[R[0][j],R[1][j],R[2][j]];
const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0];
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

function setup(K){
  const n=K.so_diem,PL=dec(K.diem_xyz,Float32Array),ring=dec(K.diem_vong,Uint8Array);
  const L2E=fromRec(K.lidar),E2Gl=fromRec(K.lidar.ego),G2El=inv(E2Gl),PE=new Float32Array(3*n);
  for(let i=0;i<n;i++){const q=app(L2E,[PL[3*i],PL[3*i+1],PL[3*i+2]]);PE[3*i]=q[0];PE[3*i+1]=q[1];PE[3*i+2]=q[2]}
  const cams={};
  for(const ch of CAM_ORDER){
    const c=K.cams[ch],C2E=fromRec(c),E2C=inv(C2E),E2Gc=fromRec(c.ego),El2Ec=comp(inv(E2Gc),E2Gl),El2C=comp(E2C,El2Ec);
    const fx=c.K[0][0],fy=c.K[1][1],cx=c.K[0][2],cy=c.K[1][2],zc=col(C2E.R,2);
    cams[ch]={ch,ten:CAM_TEN[ch],Km:c.K,fx,fy,cx,cy,W:c.w,H:c.h,C2E,E2C,E2Gc,El2Ec,El2C,C2El:inv(El2C),dt:(c.t-K.lidar.t)/1000,
      hfov:deg(Math.atan(cx/fx)+Math.atan((c.w-cx)/fx)),vfov:deg(Math.atan(cy/fy)+Math.atan((c.h-cy)/fy)),
      az:deg(Math.atan2(zc[1],zc[0])),pitch:deg(Math.asin(-zc[2])),raw:c};
  }
  const eg=K.lidar.ego.translation;   // khoảng cách đo như toan_so_lieu.py: x, y trong hệ toàn cục
  const anns=K.nhan.map((a,i)=>{const B2El=comp(G2El,fromRec(a)),[w,l,h]=a.size;
    return Object.assign({},a,{i,w,l,h,B2El,El2B:inv(B2El),c:B2El.t,yaw:Math.atan2(B2El.R[1][0],B2El.R[0][0]),dist:Math.hypot(a.translation[0]-eg[0],a.translation[1]-eg[1])})});
  const RL=L2E.R;
  return{K,n,PL,ring,PE,L2E,E2Gl,G2El,cams,anns,egoYaw:yawQ(K.lidar.ego.rotation),
    lidarTilt:deg(Math.asin(-RL[2][1])),lidarRoll:deg(Math.asin(RL[2][0])),lidarYaw:deg(Math.atan2(RL[1][1],RL[0][1]))};
}
const P3=(D,i)=>[D.PE[3*i],D.PE[3*i+1],D.PE[3*i+2]];
function proj(cam,pEl){const p=app(cam.El2C,pEl);return{X:p[0],Y:p[1],Z:p[2],u:cam.fx*p[0]/p[2]+cam.cx,v:cam.fy*p[1]/p[2]+cam.cy}}
function projAll(D,cam){
  const n=D.n,U=new Float32Array(n),V=new Float32Array(n),Z=new Float32Array(n),R=cam.El2C.R,t=cam.El2C.t;
  for(let i=0;i<n;i++){const x=D.PE[3*i],y=D.PE[3*i+1],z=D.PE[3*i+2];
    const X=R[0][0]*x+R[0][1]*y+R[0][2]*z+t[0],Y=R[1][0]*x+R[1][1]*y+R[1][2]*z+t[1],ZZ=R[2][0]*x+R[2][1]*y+R[2][2]*z+t[2];
    Z[i]=ZZ;U[i]=cam.fx*X/ZZ+cam.cx;V[i]=cam.fy*Y/ZZ+cam.cy}
  return{U,V,Z};
}
// 8 góc hộp, cùng thứ tự với scripts/toan_so_lieu.py (góc 0–3 là mặt đầu xe, x = +l/2)
const CX=[1,1,1,1,-1,-1,-1,-1],CY=[1,-1,-1,1,1,-1,-1,1],CZ=[1,1,-1,-1,1,1,-1,-1];
const EDGES=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const cornersEl=a=>CX.map((_,k)=>app(a.B2El,[CX[k]*a.l/2,CY[k]*a.w/2,CZ[k]*a.h/2]));
function box2d(cam,a){
  const C=cornersEl(a),pr=C.map(p=>proj(cam,p)),ok=pr.every(p=>p.Z>1);
  const us=pr.map(p=>p.u),vs=pr.map(p=>p.v),bb=[Math.min(...us),Math.min(...vs),Math.max(...us),Math.max(...vs)];
  const thay=ok&&bb[2]>0&&bb[0]<cam.W&&bb[3]>0&&bb[1]<cam.H;
  const tron=ok&&bb[0]>=0&&bb[1]>=0&&bb[2]<=cam.W&&bb[3]<=cam.H;
  return{C,pr,ok,bb,thay,tron};
}
function frustumMask(D,pc,bb){const m=new Uint8Array(D.n);for(let i=0;i<D.n;i++)if(pc.Z[i]>1&&pc.U[i]>=bb[0]&&pc.U[i]<=bb[2]&&pc.V[i]>=bb[1]&&pc.V[i]<=bb[3])m[i]=1;return m}
function inBoxMask(D,a){const m=new Uint8Array(D.n),R=a.El2B.R,t=a.El2B.t;
  for(let i=0;i<D.n;i++){const p=app(a.El2B,P3(D,i));if(Math.abs(p[0])<=a.l/2&&Math.abs(p[1])<=a.w/2&&Math.abs(p[2])<=a.h/2)m[i]=1}return m}

// ---- RANSAC mặt đất trong vùng quanh vật (mục 8 của TOAN_CHI_TIET)
function ransac(D,idx,seed,tau=TAU,iters=200){
  const rng=mulberry32(seed),P=D.PE,n=idx.length;let best=null,bestN=-1,tri=null;
  for(let it=0;it<iters&&n>3;it++){
    const i=idx[Math.floor(rng()*n)],j=idx[Math.floor(rng()*n)],k=idx[Math.floor(rng()*n)];if(i===j||j===k||i===k)continue;
    const a=[P[3*j]-P[3*i],P[3*j+1]-P[3*i+1],P[3*j+2]-P[3*i+2]],b=[P[3*k]-P[3*i],P[3*k+1]-P[3*i+1],P[3*k+2]-P[3*i+2]];
    let nv=cross3(a,b);const nn=Math.hypot(...nv);if(nn<1e-9)continue;nv=nv.map(v=>v/nn);if(nv[2]<0)nv=nv.map(v=>-v);if(nv[2]<0.9)continue;
    const d=-(nv[0]*P[3*i]+nv[1]*P[3*i+1]+nv[2]*P[3*i+2]);let cnt=0;
    for(const p of idx)if(Math.abs(nv[0]*P[3*p]+nv[1]*P[3*p+1]+nv[2]*P[3*p+2]+d)<tau)cnt++;
    if(cnt>bestN){bestN=cnt;best=[...nv,d];tri=[i,j,k]}
  }
  const mask=new Uint8Array(D.n);if(!best)return{mask,plane:null,w:0,nIn:0,tri:null,nRaw:0};
  let sxx=0,sxy=0,sx=0,syy=0,sy=0,s1=0,sxz=0,syz=0,sz=0;
  for(const p of idx)if(Math.abs(best[0]*P[3*p]+best[1]*P[3*p+1]+best[2]*P[3*p+2]+best[3])<tau){
    const x=P[3*p],y=P[3*p+1],z=P[3*p+2];sxx+=x*x;sxy+=x*y;sx+=x;syy+=y*y;sy+=y;s1++;sxz+=x*z;syz+=y*z;sz+=z}
  const M=[[sxx,sxy,sx],[sxy,syy,sy],[sx,sy,s1]],r=[sxz,syz,sz];
  const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  const DD=det(M);let pl;
  if(Math.abs(DD)>1e-9){const rep=c=>M.map((row,i)=>row.map((v,j)=>j===c?r[i]:v));pl=[det(rep(0))/DD,det(rep(1))/DD,det(rep(2))/DD]}
  else pl=[-best[0]/best[2],-best[1]/best[2],-best[3]/best[2]];
  const nrm=Math.sqrt(1+pl[0]*pl[0]+pl[1]*pl[1]);let nIn=0;
  for(const p of idx)if(Math.abs(P[3*p+2]-(pl[0]*P[3*p]+pl[1]*P[3*p+1]+pl[2]))/nrm<tau){mask[p]=1;nIn++}
  return{mask,plane:pl,w:nIn/n,nIn,tri,nRaw:bestN};
}
const ransacN=(w,p)=>Math.ceil(Math.log(1-p)/Math.log(1-w*w*w));

// ---- gom cụm: thành phần liên thông với ngưỡng φ, hạt giống trong frustum (Algorithm 1 của FGR)
function growComponents(P,n,seed,phi){
  const inv_=1/phi,grid=new Map(),key=(i,j,k)=>((i+1024)*2048+(j+1024))*2048+(k+1024),cell=v=>Math.floor(v*inv_);
  for(let p=0;p<n;p++){const kk=key(cell(P[3*p]),cell(P[3*p+1]),cell(P[3*p+2]));let a=grid.get(kk);if(!a){a=[];grid.set(kk,a)}a.push(p)}
  const comp_=new Int32Array(n).fill(-1),comps=[],phi2=phi*phi;
  for(let s=0;s<n;s++){
    if(!seed[s]||comp_[s]>=0)continue;
    const id=comps.length,list=[s];comp_[s]=id;
    for(let q=0;q<list.length;q++){
      const p=list[q],x=P[3*p],y=P[3*p+1],z=P[3*p+2],ci=cell(x),cj=cell(y),ck=cell(z);
      for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++)for(let dk=-1;dk<=1;dk++){
        const arr=grid.get(key(ci+di,cj+dj,ck+dk));if(!arr)continue;
        for(const r of arr){if(comp_[r]>=0)continue;const dx=P[3*r]-x,dy=P[3*r+1]-y,dz=P[3*r+2]-z;if(dx*dx+dy*dy+dz*dz<phi2){comp_[r]=id;list.push(r)}}
      }
    }
    comps.push(list);
  }
  return comps;
}

// ---- tìm hướng nhìn từ trên xuống: f của FGR (Eq. 2) và phương sai của Zhang
function rectAt(Q,th){
  const c=Math.cos(th),s=Math.sin(th),n=Q.length,xs=new Float64Array(n),ys=new Float64Array(n);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(let i=0;i<n;i++){const x=Q[i][0]*c+Q[i][1]*s,y=-Q[i][0]*s+Q[i][1]*c;xs[i]=x;ys[i]=y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  return{th,c,s,xs,ys,x0,x1,y0,y1,Lx:x1-x0,Ly:y1-y0,n};
}
// đỉnh k: 0=(x0,y0) 1=(x1,y0) 2=(x1,y1) 3=(x0,y1). Tam giác vuông tại đỉnh k = nửa hình chữ nhật chứa đỉnh đó.
function fOf(r){
  const cnt=[0,0,0,0];
  for(let i=0;i<r.n;i++){const a=r.Lx>1e-9?(r.xs[i]-r.x0)/r.Lx:0,b=r.Ly>1e-9?(r.ys[i]-r.y0)/r.Ly:0;
    if(a+b<=1)cnt[0]++;if(1-a+b<=1)cnt[1]++;if(2-a-b<=1)cnt[2]++;if(a+1-b<=1)cnt[3]++}
  const key=cnt.indexOf(Math.max(...cnt)),atX0=key===0||key===3,atY0=key===0||key===1;let q0=0;
  const isQ0=new Uint8Array(r.n);
  for(let i=0;i<r.n;i++){const dx=atX0?r.xs[i]-r.x0:r.x1-r.xs[i],dy=atY0?r.ys[i]-r.y0:r.y1-r.ys[i];
    if(dy>0.1*r.Lx&&dx>0.1*r.Ly){q0++;isQ0[i]=1}}
  return{f:q0/r.n,q0,key,atX0,atY0,cnt,isQ0};
}
function varOf(r){
  const e1=[],e2=[];for(let i=0;i<r.n;i++){const dx=Math.min(r.xs[i]-r.x0,r.x1-r.xs[i]),dy=Math.min(r.ys[i]-r.y0,r.y1-r.ys[i]);if(dx<dy)e1.push(dx);else e2.push(dy)}
  const vr=a=>{if(a.length<2)return 0;const m=a.reduce((s,v)=>s+v,0)/a.length;return a.reduce((s,v)=>s+(v-m)*(v-m),0)/a.length};
  return-vr(e1)-vr(e2);
}
function fitBEV(Q){
  const rows=[];for(let k=0;k<180;k++){const th=k*0.5*Math.PI/180,r=rectAt(Q,th),fo=fOf(r);rows.push({th,f:fo.f,area:r.Lx*r.Ly,v:varOf(r)})}
  let iF=0,iV=0;rows.forEach((r,i)=>{if(r.f<rows[iF].f-1e-12||(Math.abs(r.f-rows[iF].f)<1e-12&&r.area<rows[iF].area))iF=i;if(r.v>rows[iV].v)iV=i});
  const r=rectAt(Q,rows[iF].th),fo=fOf(r);
  const loc2w=(x,y)=>[x*r.c-y*r.s,x*r.s+y*r.c];
  const Vl=[fo.atX0?r.x0:r.x1,fo.atY0?r.y0:r.y1],V=loc2w(...Vl);
  const e1=loc2w(fo.atX0?1:-1,0),e2=loc2w(0,fo.atY0?1:-1);
  return{rows,iF,iV,r,fo,V,arms:[{e:e1,L:r.Lx},{e:e2,L:r.Ly}],rectV:rectAt(Q,rows[iV].th)};
}
// tia biên của frustum tại cột ảnh ub, cắt với mặt phẳng ngang z = z0, nhìn từ trên xuống (hệ E_l)
function boundaryLine(cam,ub,z0){
  const R=cam.C2El.R,O=cam.C2El.t,a=mv(R,[(ub-cam.cx)/cam.fx,0,1]),b=mv(R,[0,1,0]);
  const nrm=cross3(a,b);let dir=[nrm[1],-nrm[0]];const L=Math.hypot(...dir);dir=dir.map(v=>v/L);if(dir[0]*a[0]+dir[1]*a[1]<0)dir=dir.map(v=>-v);
  const beta=(z0-O[2])/b[2];return{P0:[O[0]+beta*b[0],O[1]+beta*b[1]],u:dir,ub};
}
// từ đỉnh chính V đi dọc cạnh e tới khi chạm tia biên u:  t = (V' × u)/(u × e), V' = V − P0
function extend(fit,lines){
  return fit.arms.map(arm=>{
    const cands=lines.map(Ln=>{const Vp=[fit.V[0]-Ln.P0[0],fit.V[1]-Ln.P0[1]],den=cross2(Ln.u,arm.e);
      return Math.abs(den)<1e-9?null:{t:cross2(Vp,Ln.u)/den,Vp,ln:Ln,den}}).filter(c=>c&&c.t>=arm.L-0.05&&c.t<arm.L+6);
    cands.sort((p,q)=>p.t-q.t);const c=cands[0]||null;
    return{e:arm.e,Lobs:arm.L,t:c?c.t:arm.L,hit:c};
  });
}
function boxFromArms(V,arms,zb,zt){
  const[a1,a2]=arms,cx=V[0]+(a1.e[0]*a1.t+a2.e[0]*a2.t)/2,cy=V[1]+(a1.e[1]*a1.t+a2.e[1]*a2.t)/2;
  const lo=a1.t>=a2.t?a1:a2,sh=lo===a1?a2:a1;
  return{cx,cy,cz:(zb+zt)/2,l:lo.t,w:sh.t,h:zt-zb,yaw:Math.atan2(lo.e[1],lo.e[0])};
}
// ---- chấm điểm
function rectPoly(b){const c=Math.cos(b.yaw),s=Math.sin(b.yaw),hl=b.l/2,hw=b.w/2;return[[hl,hw],[-hl,hw],[-hl,-hw],[hl,-hw]].map(([x,y])=>[b.cx+c*x-s*y,b.cy+s*x+c*y])}
function polyArea(p){let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-a[1]*b[0]}return Math.abs(s)/2}
function clipPoly(subj,clip){
  let out=subj;
  for(let i=0;i<clip.length&&out.length;i++){
    const A=clip[i],B=clip[(i+1)%clip.length],inp=out;out=[];
    // phía của điểm so với cạnh AB (dương = bên trong); giao điểm nội suy theo phía, không chia cho số gần 0
    const sd=P=>(B[0]-A[0])*(P[1]-A[1])-(B[1]-A[1])*(P[0]-A[0]),ins=P=>sd(P)>=-1e-9;
    const X=(P,Q)=>{const sp=sd(P),t=sp/(sp-sd(Q));return[P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])]};
    for(let j=0;j<inp.length;j++){const P=inp[j],Q=inp[(j+1)%inp.length];if(ins(Q)){if(!ins(P))out.push(X(P,Q));out.push(Q)}else if(ins(P))out.push(X(P,Q))}
  }
  return out;
}
function iou(A,B){
  const inter=polyArea(clipPoly(rectPoly(A),rectPoly(B))),zo=Math.max(0,Math.min(A.cz+A.h/2,B.cz+B.h/2)-Math.max(A.cz-A.h/2,B.cz-B.h/2));
  const vi=inter*zo,va=A.l*A.w*A.h,vb=B.l*B.w*B.h;
  return{iou3d:vi/(va+vb-vi),bev:inter/(A.l*A.w+B.l*B.w-inter)};
}
function e180(a,b){let d=(a-b)%(2*Math.PI);if(d>Math.PI)d-=2*Math.PI;if(d<=-Math.PI)d+=2*Math.PI;return{d,e:Math.min(Math.abs(d),Math.PI-Math.abs(d))}}

// ---- toàn bộ đường đi cho MỘT vật trong MỘT camera
function chay(D,cam,a,pc,seed=1){
  const b2=box2d(cam,a),F=frustumMask(D,pc,b2.bb),inB=inBoxMask(D,a);
  let nF=0,nFB=0,nB=0,zmin=1e9,zmax=-1e9;
  for(let i=0;i<D.n;i++){if(inB[i])nB++;if(F[i]){nF++;if(inB[i])nFB++;if(pc.Z[i]<zmin)zmin=pc.Z[i];if(pc.Z[i]>zmax)zmax=pc.Z[i]}}
  // vùng quanh vật, bỏ điểm rơi trên chính xe mình
  const reg=[];for(let i=0;i<D.n;i++){const x=D.PE[3*i],y=D.PE[3*i+1];
    if(Math.hypot(x-a.c[0],y-a.c[1])>R_VUNG)continue;if(x>-0.9&&x<3.6&&Math.abs(y)<1.1)continue;reg.push(i)}
  const inReg=new Uint8Array(D.n);for(const i of reg)inReg[i]=1;
  const g=ransac(D,reg,seed);
  const keep=reg.filter(i=>!g.mask[i]),m=keep.length,Pk=new Float32Array(3*m),Fk=new Uint8Array(m);
  keep.forEach((i,j)=>{Pk[3*j]=D.PE[3*i];Pk[3*j+1]=D.PE[3*i+1];Pk[3*j+2]=D.PE[3*i+2];Fk[j]=F[i]});
  let nGB=0;for(let i=0;i<D.n;i++)if(g.mask[i]&&inB[i])nGB++;
  const sweep=PHIS.map(phi=>{
    const comps=growComponents(Pk,m,Fk,phi).map(c=>c.map(j=>keep[j]));
    const info=comps.map(c=>{let inF=0,box=0;for(const i of c){if(F[i])inF++;if(inB[i])box++}return{size:c.length,inF,box,ratio:inF/c.length}});
    let mk=-1;info.forEach((x,i)=>{if(x.ratio>=TH_SEG&&(mk<0||x.size>info[mk].size))mk=i});
    return{phi,comps,info,mk,size:mk>=0?info[mk].size:0};
  });
  let kb=-1;sweep.forEach((s,i)=>{if(s.size>0&&(kb<0||s.size>sweep[kb].size))kb=i});
  const out={b2,F,inB,nF,nFB,nB,zmin,zmax,reg,inReg,g,nGB,sweep,kb,keepN:m};
  if(kb<0)return out;
  const M=sweep[kb].comps[sweep[kb].mk];out.M=M;
  const Q=M.map(i=>[D.PE[3*i],D.PE[3*i+1]]);let zt=-1e9,zlo=1e9;for(const i of M){zt=Math.max(zt,D.PE[3*i+2]);zlo=Math.min(zlo,D.PE[3*i+2])}
  const fit=fitBEV(Q);out.fit=fit;
  const zb=g.plane?g.plane[0]*fit.V[0]+g.plane[1]*fit.V[1]+g.plane[2]:zlo;
  const zmid=(zb+zt)/2;out.lines=[boundaryLine(cam,b2.bb[0],zmid),boundaryLine(cam,b2.bb[2],zmid)];
  out.ext=extend(fit,out.lines);
  out.boxObs=boxFromArms(fit.V,fit.arms.map(x=>({e:x.e,t:x.L})),zb,zt);
  out.box=boxFromArms(fit.V,out.ext,zb,zt);out.zb=zb;out.zt=zt;
  out.gt={cx:a.c[0],cy:a.c[1],cz:a.c[2],l:a.l,w:a.w,h:a.h,yaw:a.yaw};
  out.iouObs=iou(out.boxObs,out.gt);out.iou=iou(out.box,out.gt);
  out.eF=e180(fit.rows[fit.iF].th,a.yaw);out.eV=e180(fit.rows[fit.iV].th,a.yaw);out.eBox=e180(out.box.yaw,a.yaw);
  return out;
}
// ==CORE-END==

export {
  setup, proj, projAll, box2d, frustumMask, inBoxMask,
  ransac, ransacN, growComponents, fitBEV, boundaryLine, extend, boxFromArms,
  rectPoly, polyArea, clipPoly, iou, e180, chay,
  qR, mv, mm, tp, rig, app, comp, inv, fromRec, col, cross2, cross3,
  mulberry32, f, ft, deg, dec,
  CAM_ORDER, CAM_TEN, EGO, LOAI, PHIS, TH_SEG, TAU, R_VUNG
};
