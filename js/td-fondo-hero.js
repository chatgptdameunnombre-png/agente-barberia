(function(){
  var c=document.querySelector('.hero-vortice');
  if(!c||!c.getContext)return;
  var ctx=c.getContext('2d');
  var quieto=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ORO=['201,168,76','223,192,106','240,214,140','176,138,52','255,236,190'];
  var W=0,H=0,cx=0,cy=0,dpr=1,T=0,corre=false,visible=true,ultimo=0;
  var mx=0,my=0,tx=0,ty=0,raton=null;
  var modo=(new URLSearchParams(location.search).get('modo'))||c.getAttribute('data-modo')||'seda';
  var est={};

  function fondo(a){ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(5,5,5,'+a+')';ctx.fillRect(0,0,W,H);}
  function brillo(x,y,r,a){
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(255,226,150,'+a+')');
    g.addColorStop(.45,'rgba(201,168,76,'+(a*.5)+')');
    g.addColorStop(1,'rgba(201,168,76,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function mete(gr,c2,b,x1,y1,x2,y2){var k=c2+'|'+b;(gr[k]||(gr[k]=[])).push(x1,y1,x2,y2);}
  function pinta(gr,base,ancho,paso){
    for(var g in gr){
      var s=g.split('|'),b=+s[1],l=gr[g];
      ctx.strokeStyle='rgba('+s[0]+','+((b+1)*base).toFixed(3)+')';
      ctx.lineWidth=ancho+b*paso;
      ctx.beginPath();
      for(var j=0;j<l.length;j+=4){ctx.moveTo(l[j],l[j+1]);ctx.lineTo(l[j+2],l[j+3]);}
      ctx.stroke();
    }
  }
  var punto=(function(){
    var o=document.createElement('canvas');o.width=o.height=64;
    var g=o.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
    r.addColorStop(0,'rgba(255,240,200,1)');r.addColorStop(.18,'rgba(240,214,140,.85)');
    r.addColorStop(.45,'rgba(201,168,76,.25)');r.addColorStop(1,'rgba(201,168,76,0)');
    g.fillStyle=r;g.fillRect(0,0,64,64);return o;
  })();
  function cintas(n,y0,dy){var r=[];for(var i=0;i<n;i++)r.push({y:y0+i*dy,a:.06+Math.random()*.05,f:.0016+Math.random()*.0012,v:.00025+Math.random()*.0002,h:14+Math.random()*16,c:ORO[i%3],o:Math.random()*9});return r;}
  function sedaHilos(cs,o){
    var L=o.rot?Math.hypot(W,H):W,x0=o.rot?(W-L)/2:0;
    if(o.rot){ctx.save();ctx.translate(cx,cy);ctx.rotate(o.rot);ctx.translate(-cx,-cy);}
    ctx.globalCompositeOperation='lighter';ctx.lineWidth=o.ancho||1;
    var paso=W<700?14:20,hilos=o.hilos||(W<700?16:26),fa=o.alfa||1;
    for(var i=0;i<cs.length;i++){
      var s=cs[i];
      for(var h=0;h<hilos;h++){
        var u=h/(hilos-1),al=(.10+.32*Math.sin(u*Math.PI))*(1-i*.12)*fa;
        ctx.strokeStyle='rgba('+s.c+','+al.toFixed(3)+')';ctx.beginPath();
        for(var x=x0-20;x<=x0+L+20;x+=paso){
          var t=T*s.v+s.o,y=H*s.y+my*18
            +Math.sin(x*s.f+t)*H*s.a
            +Math.sin(x*s.f*2.3-t*1.6+u*1.4)*H*s.a*.45
            +(u-.5)*s.h*(2+Math.sin(x*.004+t*2));
          x===x0-20?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
    }
    if(o.rot)ctx.restore();
  }
  function rejilla(hz,base,dir,fa){
    var fil=W<700?18:26,col=W<700?22:36,t=T*.0006,pts=[];
    ctx.globalCompositeOperation='lighter';ctx.lineWidth=1;
    for(var r=0;r<fil;r++){
      var z=1+r*.55+(t*2.2%.55),fila=[];
      for(var q=0;q<=col;q++){
        var u=q/col*2-1,xw=u*W*1.6,y3=Math.sin(u*5+z*.9-t*3)*28+Math.cos(u*3-z*.6)*18;
        fila.push(cx+xw/z+mx*20/z,hz+dir*(base-y3)/z);
      }
      pts.push(fila);
    }
    for(r=0;r<pts.length;r++){
      ctx.strokeStyle='rgba(201,168,76,'+Math.max(0,.75*(1-r/fil)*fa).toFixed(3)+')';ctx.beginPath();
      var fl=pts[r];for(q=0;q<fl.length;q+=2)q?ctx.lineTo(fl[q],fl[q+1]):ctx.moveTo(fl[q],fl[q+1]);ctx.stroke();
    }
    ctx.strokeStyle='rgba(201,168,76,'+(.3*fa).toFixed(3)+')';
    for(q=0;q<=col;q++){
      ctx.beginPath();
      for(r=0;r<pts.length;r++){var p=pts[r];r?ctx.lineTo(p[q*2],p[q*2+1]):ctx.moveTo(p[q*2],p[q*2+1]);}
      ctx.stroke();
    }
  }

  var MODOS={
    red:{
      ini:function(){
        var n=Math.round(Math.min(110,Math.max(40,W*H/14000)));
        est.ns=[];for(var i=0;i<n;i++)est.ns.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:1.4+Math.random()*2,f:Math.random()*6});
        est.d=Math.min(170,Math.max(110,W/9));
      },
      cuadro:function(k){
        fondo(1);
        brillo(cx,cy,Math.min(W,H)*.45,.10);
        ctx.globalCompositeOperation='lighter';
        var ns=est.ns,d=est.d,d2=d*d,gr={},a,i;
        for(i=0;i<ns.length;i++){
          a=ns[i];a.x+=a.vx*k;a.y+=a.vy*k;
          if(a.x<-20)a.x=W+20;if(a.x>W+20)a.x=-20;if(a.y<-20)a.y=H+20;if(a.y>H+20)a.y=-20;
        }
        for(i=0;i<ns.length;i++){
          a=ns[i];
          for(var j=i+1;j<ns.length;j++){
            var b=ns[j],dx=a.x-b.x,dy=a.y-b.y,q=dx*dx+dy*dy;
            if(q<d2)mete(gr,'201,168,76',Math.min(3,((1-Math.sqrt(q)/d)*4)|0),a.x,a.y,b.x,b.y);
          }
          if(raton){var rx=a.x-raton[0],ry=a.y-raton[1],rq=rx*rx+ry*ry;if(rq<d2*2.2)mete(gr,'240,214,140',Math.min(3,((1-Math.sqrt(rq)/(d*1.48))*4)|0),a.x,a.y,raton[0],raton[1]);}
        }
        pinta(gr,.17,.8,.3);
        ctx.fillStyle='rgba(255,236,190,.95)';
        for(i=0;i<ns.length;i++){a=ns[i];var lt=.75+Math.sin(T*.002+a.f)*.25,s=(a.r*17+6)*lt;ctx.drawImage(punto,a.x-s/2,a.y-s/2,s,s);ctx.beginPath();ctx.arc(a.x,a.y,a.r*.9+.6,0,Math.PI*2);ctx.fill();}
      }
    },
    seda:{
      ini:function(){est.cs=cintas(W<700?3:4,.32,.13);},
      cuadro:function(){
        fondo(1);
        brillo(cx,cy,Math.min(W,H)*.55,.09);
        sedaHilos(est.cs,{});
      }
    },
    seda2:{
      ini:function(){est.cs=cintas(W<700?4:5,.22,.14);},
      cuadro:function(){
        fondo(1);
        brillo(cx,cy,Math.min(W,H)*.55,.09);
        sedaHilos(est.cs,{rot:-.32,hilos:W<700?20:34,alfa:.8});
      }
    },
    malla:{
      ini:function(){},
      cuadro:function(){
        fondo(1);
        var hz=H*.4;
        brillo(cx,hz,Math.min(W,H)*.6,.10);
        rejilla(hz,H*.34,1,1);
        var g=ctx.createLinearGradient(0,hz-4,0,hz+H*.07);
        g.addColorStop(0,'rgba(5,5,5,1)');g.addColorStop(1,'rgba(5,5,5,0)');
        ctx.globalCompositeOperation='source-over';ctx.fillStyle=g;ctx.fillRect(0,0,W,hz+H*.07);
      }
    },
    cruce:{
      ini:function(){est.a=cintas(2,.44,.1);est.b=cintas(2,.46,.1);},
      cuadro:function(){
        fondo(1);
        brillo(cx,cy,Math.min(W,H)*.5,.11);
        sedaHilos(est.a,{rot:-.38,hilos:W<700?20:30,alfa:.9});
        sedaHilos(est.b,{rot:.38,hilos:W<700?20:30,alfa:.9});
      }
    },
    cortina:{
      ini:function(){
        var n=W<700?4:6,esp=(W/H)/n;est.cs=cintas(n,0,0);
        for(var i=0;i<n;i++){est.cs[i].y=.5+(i-(n-1)/2)*esp;est.cs[i].a*=.7;}
      },
      cuadro:function(){
        fondo(1);
        brillo(cx,cy,Math.min(W,H)*.55,.08);
        sedaHilos(est.cs,{rot:Math.PI/2-.08,hilos:W<700?14:20,alfa:.75});
      }
    },
    pasillo:{
      ini:function(){},
      cuadro:function(){
        fondo(1);
        brillo(cx,cy,Math.min(W,H)*.45,.14);
        rejilla(cy,H*.42,1,1.5);
        rejilla(cy,H*.42,-1,1);
      }
    },
    relieve:{
      ini:function(){est.o=[];for(var i=0;i<6;i++)est.o.push({x:(Math.random()-.5)*.5,s:.05+Math.random()*.08,f:Math.random()*6});},
      cuadro:function(){
        fondo(1);
        brillo(cx,cy,Math.min(W,H)*.5,.07);
        var n=W<700?30:44,y0=H*.24,y1=H*.86,paso=W<700?6:9,amp=H*.13;
        ctx.lineWidth=1.1;
        for(var i=0;i<n;i++){
          var v=i/(n-1),yb=y0+(y1-y0)*v,pts=[];
          for(var x=-10;x<=W+10;x+=paso){
            var u=(x-cx)/W,b=0;
            for(var j=0;j<est.o.length;j++){var o=est.o[j],d=(u-o.x-Math.sin(T*.0002+o.f)*.04)/o.s;b+=Math.exp(-d*d)*(.5+.5*Math.sin(T*.0009+o.f+v*3));}
            var env=Math.exp(-Math.pow(u/.3,2)),ruido=Math.sin(x*.05+i*1.7+T*.0012)*Math.sin(x*.013-i*.4)*.25;
            pts.push(x,yb-(b*.8+ruido)*amp*env+my*10);
          }
          ctx.globalCompositeOperation='source-over';
          ctx.beginPath();for(var k=0;k<pts.length;k+=2)k?ctx.lineTo(pts[k],pts[k+1]):ctx.moveTo(pts[k],pts[k+1]);
          ctx.lineTo(W+10,H+10);ctx.lineTo(-10,H+10);ctx.closePath();
          ctx.fillStyle='#050505';ctx.fill();
          ctx.beginPath();for(k=0;k<pts.length;k+=2)k?ctx.lineTo(pts[k],pts[k+1]):ctx.moveTo(pts[k],pts[k+1]);
          ctx.strokeStyle='rgba(223,192,106,'+(.18+.5*Math.sin(v*Math.PI)).toFixed(3)+')';ctx.stroke();
        }
      }
    },
    tunel:{
      ini:function(){},
      cuadro:function(){
        fondo(1);
        var ox=cx+mx*30+Math.sin(T*.0004)*W*.02,oy=cy+my*20+Math.cos(T*.0003)*H*.02,S=Math.max(W,H)*.5,n=22,rad=W<700?14:20;
        brillo(ox,oy,Math.min(W,H)*.3,.16);
        ctx.globalCompositeOperation='lighter';ctx.lineWidth=1;
        var fase=(T*.00035)%1,an=T*.00005;
        for(var i=0;i<n;i++){
          var z=(i+1-fase)*.5,r=S/z,a=Math.min(1,z*.9)*Math.max(0,1-z/(n*.5))*.6;
          if(a<=0)continue;
          ctx.strokeStyle='rgba(201,168,76,'+a.toFixed(3)+')';
          ctx.beginPath();ctx.ellipse(ox,oy,r,r*.62,0,0,Math.PI*2);ctx.stroke();
        }
        ctx.strokeStyle='rgba(201,168,76,.16)';ctx.beginPath();
        for(var k=0;k<rad;k++){
          var t=an+k/rad*Math.PI*2,r1=S/(n*.5*.98),r2=S/.25;
          ctx.moveTo(ox+Math.cos(t)*r1,oy+Math.sin(t)*r1*.62);ctx.lineTo(ox+Math.cos(t)*r2,oy+Math.sin(t)*r2*.62);
        }
        ctx.stroke();
      }
    },
    esfera:{
      ini:function(){},
      cuadro:function(){
        fondo(1);
        var R0=Math.min(W,H)*(W<700?.42:.36),ox=cx+mx*20,oy=cy+my*14,rot=T*.00012,inc=.38+my*.05;
        brillo(ox,oy,R0*1.3,.10);
        ctx.globalCompositeOperation='lighter';ctx.lineWidth=1;
        var ci=Math.cos(inc),si=Math.sin(inc),del=[],atr=[];
        function p3(la,lo){
          var x=Math.cos(la)*Math.cos(lo+rot),y=Math.sin(la),z=Math.cos(la)*Math.sin(lo+rot);
          var y2=y*ci-z*si,z2=y*si+z*ci;return [ox+x*R0,oy-y2*R0,z2];
        }
        function linea(f,N){
          var a=f(0);
          for(var s=1;s<=N;s++){var b=f(s/N);(a[2]+b[2]>0?del:atr).push(a[0],a[1],b[0],b[1]);a=b;}
        }
        var i,j;
        for(i=1;i<10;i++)(function(la){linea(function(u){return p3(la,u*Math.PI*2);},56);})(-Math.PI/2+i*Math.PI/10);
        for(j=0;j<18;j++)(function(lo){linea(function(u){return p3(-Math.PI/2+u*Math.PI,lo);},36);})(j/18*Math.PI*2);
        [[atr,.08],[del,.42]].forEach(function(g){
          ctx.strokeStyle='rgba(201,168,76,'+g[1]+')';ctx.beginPath();
          for(var k=0;k<g[0].length;k+=4){ctx.moveTo(g[0][k],g[0][k+1]);ctx.lineTo(g[0][k+2],g[0][k+3]);}
          ctx.stroke();
        });
      }
    }
  };

  function medir(){
    var r=c.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,1.5)*.75;
    W=Math.max(1,r.width);H=Math.max(1,r.height);
    c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cx=W/2;cy=H*.46;
    est={};MODOS[modo].ini();
    ctx.fillStyle='#050505';ctx.fillRect(0,0,W,H);
  }
  function quietoPinta(){T+=4000;MODOS[modo].cuadro(1,16.7);}
  function bucle(t){
    if(!corre)return;
    var dt=ultimo?Math.min(50,t-ultimo):16.7;ultimo=t;T+=dt;
    mx+=(tx-mx)*.04;my+=(ty-my)*.04;
    MODOS[modo].cuadro(dt/16.7,dt);
    requestAnimationFrame(bucle);
  }
  function arranca(){
    var debe=visible&&!document.hidden&&!quieto;
    if(debe&&!corre){corre=true;ultimo=0;requestAnimationFrame(bucle);}
    if(!debe)corre=false;
  }

  if(!MODOS[modo])modo='seda';
  medir();
  if(quieto)quietoPinta();else arranca();

  window.addEventListener('pointermove',function(e){
    var r=c.getBoundingClientRect();
    tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;
    raton=(e.clientY>r.top&&e.clientY<r.bottom)?[e.clientX-r.left,e.clientY-r.top]:null;
  },{passive:true});
  var espera;
  window.addEventListener('resize',function(){clearTimeout(espera);espera=setTimeout(function(){
    var r=c.getBoundingClientRect();
    if(Math.abs(r.width-W)>2||Math.abs(r.height-H)>120){medir();if(quieto)quietoPinta();}
  },150);});
  document.addEventListener('visibilitychange',arranca);
  if('IntersectionObserver' in window)new IntersectionObserver(function(e){visible=e[0].isIntersecting;arranca();}).observe(c);

  window.TDFondo={modo:function(m){if(!MODOS[m])return;modo=m;medir();if(quieto)quietoPinta();},modos:Object.keys(MODOS)};
})();
