(function(){
'use strict';
var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function G(id){ return document.getElementById(id); }
function V(id){ var el=G(id); return el ? (el.value||'') : ''; }
function N(id){ return parseFloat(V(id).replace(/\./g,'').replace(',','.')) || 0; }

/* ── separador de miles al tipear ($100.000 en vez de $100000) ── */
function soloDigitos(s){ return (s||'').replace(/[^\d]/g,''); }
function attachMiles(id){
  var el=G(id); if(!el) return;
  el.addEventListener('input', function(){
    var digits = soloDigitos(el.value);
    el.value = digits ? parseInt(digits,10).toLocaleString('es-AR') : '';
  });
}
['canon','expensas','servicios','ingreso','av-ing'].forEach(attachMiles);
/* ── EmailJS: notificación prolija en paralelo a Netlify Forms ──────
   Netlify Forms sigue siendo el canal confiable (guarda todo, maneja
   adjuntos). EmailJS solo manda un mail con el mismo formato prolijo
   de antes; si falla, no afecta lo que ve el cliente ni el registro
   en Netlify. ── */
var EJS_PUBLIC_KEY = 'OfWhG-5c7AF35hT3K';
var EJS_SVC = 'service_t5niy2k';
var EJS_TPL = 'template_fs65o6o';
var EJS_DEST = 'guidobonifatiseguros@gmail.com';
try{ if (typeof emailjs !== 'undefined') emailjs.init(EJS_PUBLIC_KEY); }catch(e){}

function enviarEmailJS(data){
  if (typeof emailjs === 'undefined') { console.error('EmailJS no cargó (revisar conexión/CDN).'); return; }
  emailjs.send(EJS_SVC, EJS_TPL, {
    to_email:EJS_DEST,
    solicitante:data.nombre+' '+data.apellido,
    dni:data.dni, email_cliente:data.email, telefono:data.tel,
    estado_civil:data.ecivil, situacion_laboral:data.sitlab,
    tipo_inmueble:data.tipo, direccion:data.dir, duracion:data.meses+' meses',
    canon:fM(data.canonV,data.mC),
    expensas:data.expV>0?fM(data.expV,data.mE):'—',
    servicios:data.serV>0?fM(data.serV,data.mS):'—',
    suma_ars:data.sumaARS>0?fA(data.sumaARS):'—',
    costo_cuotas_ars:data.costoARS>0?fA(data.costoARS):'—',
    valor_cuota_ars:data.cuotaARS>0?fA(data.cuotaARS):'—',
    costo_contado_ars:data.contARS>0?fA(data.contARS):'—',
    suma_usd:data.sumaUSD>0?fU(data.sumaUSD):'—',
    costo_cuotas_usd:data.costoUSD>0?fU(data.costoUSD):'—',
    valor_cuota_usd:data.cuotaUSD>0?fU(data.cuotaUSD):'—',
    costo_contado_usd:data.contUSD>0?fU(data.contUSD):'—',
    ingreso:fM(data.ingreso,data.mI),
    eleccion_ars:ELEGIDO.ARS?(ELEGIDO.ARS==='cuotas'?'6 cuotas':'Pago único'):'—',
    eleccion_usd:ELEGIDO.USD?(ELEGIDO.USD==='cuotas'?'6 cuotas':'Pago único'):'—',
    avalista:data.avNom, aval_dni:data.avDni,
    aval_ingreso:data.avIng>0?fM(data.avIng,data.mAval):'—',
    documentos_adjuntos:totalDocs()+' archivo'+(totalDocs()===1?'':'s')+' (ver en el panel de Netlify Forms)',
    observaciones:data.obs, fecha:data.fecha, hora:data.hora
  }).then(function(){
    console.log('EmailJS: notificación enviada.');
  }).catch(function(e){
    console.error('EmailJS falló (la cotización ya quedó guardada en Netlify Forms igual):', e);
  });
}

function fA(n){ return n>0 ? '$'+Math.round(n).toLocaleString('es-AR') : '—'; }
function fU(n){ return n>0 ? 'U$S '+Math.round(n).toLocaleString('es-AR') : '—'; }
function fM(n,m){ return m==='USD' ? fU(n) : fA(n); }

/* ── moneda por campo ─────────────────────────────── */
var MON = { canon:'ARS', exp:'ARS', ser:'ARS', ing:'ARS', aval:'ARS' };

/* ── el cliente elige cuotas o pago único ─────────────────────────── */
var ELEGIDO = { ARS:null, USD:null };
function pintarEleccion(mon){
  var cont = G('cpays-'+mon.toLowerCase());
  var elegido = ELEGIDO[mon];
  cont.classList.toggle('has-choice', !!elegido);
  cont.querySelectorAll('.cpay').forEach(function(b){ b.classList.toggle('selected', b.dataset.tipo===elegido); });
  var etiqueta = G('elegido-'+mon.toLowerCase());
  if (elegido){
    etiqueta.classList.add('show');
    etiqueta.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg> Elegiste: '+(elegido==='cuotas'?'6 cuotas sin interés':'pago único');
  } else {
    etiqueta.classList.remove('show');
  }
}
document.querySelectorAll('.cpay[data-mon]').forEach(function(btn){
  btn.addEventListener('click', function(){
    var mon = btn.dataset.mon, tipo = btn.dataset.tipo;
    ELEGIDO[mon] = (ELEGIDO[mon]===tipo) ? null : tipo;
    pintarEleccion(mon);
  });
});

document.querySelectorAll('.mb[data-campo]').forEach(function(btn){
  btn.addEventListener('click', function(){ setM(btn.dataset.campo, btn.dataset.mon); });
});
function setM(campo, m){
  MON[campo] = m;
  var isUSD = (m==='USD');
  var btnA = G('mb-'+campo+'-ars'), btnU = G('mb-'+campo+'-usd');
  if (btnA){ btnA.classList.toggle('on', !isUSD); btnU.classList.toggle('on', isUSD); }
  recalc(); saveDraft();
}

/* ── porcentajes según duración (misma fórmula que el sitio original) ── */
function getPct(meses){
  if (meses===24) return { cuotas:.054, contado:.049 };
  if (meses===36) return { cuotas:.051, contado:.048 };
  return { cuotas:.060, contado:.051 };
}

function calcData(){
  var canonV=N('canon'), expV=N('expensas'), serV=N('servicios');
  var meses=parseInt(V('duracion'))||0;
  var pct=getPct(meses);
  var mensARS=(MON.canon==='ARS'?canonV:0)+(MON.exp==='ARS'?expV:0)+(MON.ser==='ARS'?serV:0);
  var mensUSD=(MON.canon==='USD'?canonV:0)+(MON.exp==='USD'?expV:0)+(MON.ser==='USD'?serV:0);
  var sumaARS=mensARS*meses, sumaUSD=mensUSD*meses;
  var costoARS=sumaARS*pct.cuotas, cuotaARS=costoARS/6, contARS=sumaARS*pct.contado;
  var costoUSD=sumaUSD*pct.cuotas, cuotaUSD=costoUSD/6, contUSD=sumaUSD*pct.contado;
  return { canonV:canonV, expV:expV, serV:serV, meses:meses,
    sumaARS:sumaARS, sumaUSD:sumaUSD,
    costoARS:costoARS, cuotaARS:cuotaARS, contARS:contARS,
    costoUSD:costoUSD, cuotaUSD:cuotaUSD, contUSD:contUSD,
    hayARS:mensARS>0, hayUSD:mensUSD>0, mixto:mensARS>0 && mensUSD>0 };
}

/* ── animación de números ─────────────────────────── */
function animar(el, to, fmt){
  if (!el) return;
  var from = parseFloat(el.dataset.raw||'0');
  if (REDUCE){ el.textContent = to>0?fmt(to):'—'; el.dataset.raw=to; return; }
  var start=null, dur=450;
  function step(ts){
    if(!start) start=ts;
    var p=Math.min(1,(ts-start)/dur);
    var eased=1-Math.pow(1-p,3);
    var val=from+(to-from)*eased;
    el.textContent = (to>0 || val>1) ? fmt(val) : '—';
    if(p<1) requestAnimationFrame(step); else { el.dataset.raw=to; el.textContent = to>0?fmt(to):'—'; }
  }
  requestAnimationFrame(step);
}

function ahorroHTML(costoCuotas, costoContado){
  if (costoCuotas<=0) return '';
  var pct = Math.round(((costoCuotas-costoContado)/costoCuotas)*100);
  var maxV = Math.max(costoCuotas, costoContado)||1;
  var wCu = Math.max(6, (costoCuotas/maxV)*100);
  var wCo = Math.max(6, (costoContado/maxV)*100);
  return '<div class="ah-bars">'+
    '<div class="ah-row"><span class="ah-lbl">Cuotas</span><div class="ah-track"><div class="ah-fill cu" style="width:'+wCu+'%"></div></div></div>'+
    '<div class="ah-row"><span class="ah-lbl">Contado</span><div class="ah-track"><div class="ah-fill co" style="width:'+wCo+'%"></div></div></div>'+
    '</div>'+
    '<div class="ah-badge"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17l-8.5-8.5-5 5L2 7"/><path d="M16 7h6v6"/></svg>Ahorrás '+pct+'% pagando de contado</div>';
}

function recalc(){
  var d = calcData();
  G('mixed-note').classList.toggle('show', d.mixto);
  G('v-canon').textContent = fM(d.canonV, MON.canon);
  G('v-exp').textContent = d.expV>0 ? fM(d.expV, MON.exp) : '—';
  G('v-ser').textContent = d.serV>0 ? fM(d.serV, MON.ser) : '—';
  G('v-dur').textContent = d.meses>0 ? d.meses+' meses' : '—';

  var hasData = d.canonV>0 && d.meses>0;
  G('cempty').style.display = hasData ? 'none' : 'block';
  G('cdata').style.display  = hasData ? 'block' : 'none';
  document.body.classList.toggle('has-mbar', hasData);
  G('mbar').classList.toggle('show', hasData);

  G('bloque-ars').style.display = d.hayARS ? 'block' : 'none';
  if (d.hayARS){
    G('v-suma-ars').textContent = fA(d.sumaARS);
    animar(G('v-cuota-ars'), d.cuotaARS, fA);
    G('v-tot-ars').textContent = '× 6 = '+fA(d.costoARS);
    animar(G('v-cont-ars'), d.contARS, fA);
    G('ah-ars').innerHTML = ahorroHTML(d.costoARS, d.contARS);
  }
  G('bloque-usd').style.display = d.hayUSD ? 'block' : 'none';
  if (d.hayUSD){
    G('v-suma-usd').textContent = fU(d.sumaUSD);
    animar(G('v-cuota-usd'), d.cuotaUSD, fU);
    G('v-tot-usd').textContent = '× 6 = '+fU(d.costoUSD);
    animar(G('v-cont-usd'), d.contUSD, fU);
    G('ah-usd').innerHTML = ahorroHTML(d.costoUSD, d.contUSD);
  }

  if (hasData){
    var symEl = d.hayARS ? fA(d.cuotaARS) : fU(d.cuotaUSD);
    G('mbar-val').textContent = symEl;
    var detail = '';
    if (d.hayARS) detail += '<div class="col"><div class="k">Suma ARS</div><div class="v">'+fA(d.sumaARS)+'</div><div class="k" style="margin-top:6px">Contado</div><div class="v">'+fA(d.contARS)+'</div></div>';
    if (d.hayUSD) detail += '<div class="col"><div class="k">Suma USD</div><div class="v">'+fU(d.sumaUSD)+'</div><div class="k" style="margin-top:6px">Contado</div><div class="v">'+fU(d.contUSD)+'</div></div>';
    G('mbar-detail-inner').innerHTML = detail;
  }

  chkAval();
}

['canon','expensas','servicios','duracion','ingreso','av-ing'].forEach(function(id){
  var el=G(id); if(!el) return;
  el.addEventListener('input', function(){ recalc(); saveDraft(); });
  el.addEventListener('change', function(){ recalc(); saveDraft(); });
});

/* ── mbar toggle ──────────────────────────────────── */
G('mbar-toggle').addEventListener('click', function(){
  var open = G('mbar-detail').classList.toggle('open');
  this.classList.toggle('open', open);
});

/* ── avalista (ingreso >= 2x alquiler) ───────────────── */
function chkAval(){
  var canon=N('canon'), ingreso=N('ingreso'), req=canon*2;
  var st=G('ing-st'), box=G('aval-box'), docAval=G('grp-aval');
  if (ingreso<=0){
    st.innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none"/></svg><span>Ingresá tu ingreso mensual neto para verificar.</span>';
    st.style.background=''; st.style.borderLeftColor='var(--wine)';
    box.classList.remove('show');
    docAval.classList.remove('show');
    return;
  }
  if (ingreso>=req){
    st.innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" style="color:var(--green)"><path d="M5 13l4 4L19 7"/></svg><span><strong>¡Calificás!</strong> Tu ingreso supera el mínimo requerido.</span>';
    st.style.background='var(--green-pale)'; st.style.borderLeftColor='var(--green)';
    box.classList.remove('show');
    docAval.classList.remove('show');
  } else {
    var sym = MON.ing==='USD' ? 'U$S ' : '$';
    st.innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" style="color:var(--yellow-deep)"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/></svg><span>Te faltan <strong>'+sym+Math.round(req-ingreso).toLocaleString('es-AR')+'/mes</strong>. Podés incluir un avalista.</span>';
    st.style.background='var(--yellow-pale)'; st.style.borderLeftColor='var(--yellow)';
    box.classList.add('show');
    docAval.classList.add('show');
  }
}

/* ── documentación adjunta ────────────────────────── */
var DOCS = { contrato:[], recibos:[], aval:[] };
function iconoQuitar(){
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
}
function renderDocs(clave){
  var list=G('doc-'+clave+'-files');
  list.innerHTML = DOCS[clave].map(function(f,i){
    return '<span class="upload-chip"><span>'+f.name+'</span><button type="button" data-clave="'+clave+'" data-idx="'+i+'" aria-label="Quitar">'+iconoQuitar()+'</button></span>';
  }).join('');
}
var MAX_MB_ARCHIVO = 8;
function agregarArchivos(clave, fileList){
  Array.from(fileList||[]).forEach(function(f){
    if (f.size > MAX_MB_ARCHIVO*1024*1024){
      toast('"'+f.name+'" pesa '+(f.size/1024/1024).toFixed(1)+' MB — máximo '+MAX_MB_ARCHIVO+' MB. Comprimilo o sacá una foto más liviana.', true);
      return;
    }
    DOCS[clave].push(f);
  });
  renderDocs(clave);
}
function totalMBAdjuntos(){
  var total = DOCS.contrato.concat(DOCS.recibos, DOCS.aval).reduce(function(s,f){ return s+f.size; }, 0);
  return total/1024/1024;
}
['contrato','recibos','aval'].forEach(function(clave){
  var input=G('doc-'+clave), zone=G('uz-'+(clave==='aval'?'aval-doc':clave));
  input.addEventListener('change', function(){ agregarArchivos(clave, input.files); input.value=''; });
  if (zone){
    zone.addEventListener('dragover', function(e){ e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', function(){ zone.classList.remove('drag'); });
    zone.addEventListener('drop', function(e){
      e.preventDefault(); zone.classList.remove('drag');
      agregarArchivos(clave, e.dataTransfer.files);
    });
  }
});
document.addEventListener('click', function(e){
  var btn = e.target.closest && e.target.closest('.upload-chip button');
  if (!btn) return;
  var clave=btn.dataset.clave, idx=parseInt(btn.dataset.idx,10);
  DOCS[clave].splice(idx,1);
  renderDocs(clave);
});
function totalDocs(){ return DOCS.contrato.length + DOCS.recibos.length + DOCS.aval.length; }

/* ── validaciones ─────────────────────────────────── */
function validarDNI(v){ return /^[0-9]{7,8}$/.test((v||'').replace(/[.\s]/g,'')); }
function validarTel(v){ return ((v||'').replace(/[^0-9]/g,'').length) >= 8; }
function validarEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||'').trim()); }

function campoEstado(id, errId, ok){
  var el=G(id), err=G(errId);
  el.classList.toggle('invalid', !ok);
  if (err) err.classList.toggle('show', !ok);
  return ok;
}
G('dni').addEventListener('blur', function(){ if(this.value.trim()) campoEstado('dni','err-dni', validarDNI(this.value)); });
G('email').addEventListener('blur', function(){ if(this.value.trim()) campoEstado('email','err-email', validarEmail(this.value)); });
G('tel').addEventListener('blur', function(){ if(this.value.trim()) campoEstado('tel','err-tel', validarTel(this.value)); });

/* ── navegación entre pasos ───────────────────────── */
document.querySelectorAll('[data-go]').forEach(function(btn){
  btn.addEventListener('click', function(){ go(parseInt(btn.dataset.go,10)); });
});

function go(step){
  recalc();
  if (step===2){
    if (N('canon')<=0) return toast('Ingresá el valor del alquiler', true);
    if (!V('duracion')) return toast('Seleccioná la duración del contrato', true);
    if (!V('tipo')) return toast('Seleccioná el tipo de inmueble', true);
    if (!V('dir').trim()) return toast('Ingresá la dirección del inmueble', true);
  }
  if (step===3){
    if (N('ingreso')<=0) return toast('Ingresá tu ingreso mensual', true);
  }
  if (step===4){
    if (!V('nombre').trim()) return toast('Ingresá tu nombre', true);
    if (!V('apellido').trim()) return toast('Ingresá tu apellido', true);
    if (!campoEstado('dni','err-dni', V('dni').trim() && validarDNI(V('dni')))) return toast('Revisá tu DNI', true);
    if (!campoEstado('email','err-email', validarEmail(V('email')))) return toast('Revisá tu email', true);
    if (!campoEstado('tel','err-tel', validarTel(V('tel')))) return toast('Revisá tu teléfono', true);
    if (!V('sitlab')) return toast('Seleccioná tu situación laboral', true);
    buildResumen();
  }
  for (var i=1;i<=4;i++){
    G('pan'+i).classList.remove('on');
    var s=G('st'+i);
    s.classList.remove('on','done');
    if (i<step) s.classList.add('done');
    else if (i===step) s.classList.add('on');
  }
  var next = G('pan'+step);
  next.classList.add('on');
  if (!REDUCE){ next.classList.remove('entering'); void next.offsetWidth; next.classList.add('entering'); }
  saveDraft();
}

/* ── resumen ──────────────────────────────────────── */
function buildResumen(){
  var d=calcData();
  var nom=(V('nombre')+' '+V('apellido')).trim();
  var html='<strong>Solicitante:</strong> '+(nom||'—')+'<br>'
    +'<strong>Inmueble:</strong> '+(V('tipo')||'—')+' · '+(V('dir')||'—')+'<br>'
    +'<strong>Duración:</strong> '+(d.meses||'—')+' meses<br>';
  if (d.hayARS) html+='<strong>Suma ARS:</strong> <span style="color:var(--yellow-deep);font-weight:700">'+fA(d.sumaARS)+'</span> → Cuotas: '+fA(d.costoARS)+' ('+fA(d.cuotaARS)+'/c) | Contado: '+fA(d.contARS)+(ELEGIDO.ARS?' · <strong>Elegido: '+(ELEGIDO.ARS==='cuotas'?'6 cuotas':'pago único')+'</strong>':'')+'<br>';
  if (d.hayUSD) html+='<strong>Suma USD:</strong> <span style="color:var(--yellow-deep);font-weight:700">'+fU(d.sumaUSD)+'</span> → Cuotas: '+fU(d.costoUSD)+' ('+fU(d.cuotaUSD)+'/c) | Contado: '+fU(d.contUSD)+(ELEGIDO.USD?' · <strong>Elegido: '+(ELEGIDO.USD==='cuotas'?'6 cuotas':'pago único')+'</strong>':'')+'<br>';
  var nd=totalDocs();
  html += '<strong>Documentos adjuntos:</strong> '+(nd>0 ? nd+' archivo'+(nd===1?'':'s') : 'ninguno todavía');
  G('rdata').innerHTML=html;

  var waTxt = 'Hola Guido! Te paso mi cotización de caución:%0A'
    +'Inmueble: '+encodeURIComponent(V('tipo')||'—')+' - '+encodeURIComponent(V('dir')||'—')+'%0A'
    +'Duración: '+d.meses+' meses%0A';
  if (d.hayARS) waTxt += 'Suma ARS: '+encodeURIComponent(fA(d.sumaARS))+' (Cuota: '+encodeURIComponent(fA(d.cuotaARS))+' x6 / Contado: '+encodeURIComponent(fA(d.contARS))+')'+(ELEGIDO.ARS?encodeURIComponent(' - Elijo '+(ELEGIDO.ARS==='cuotas'?'6 cuotas':'pago único')):'')+'%0A';
  if (d.hayUSD) waTxt += 'Suma USD: '+encodeURIComponent(fU(d.sumaUSD))+' (Cuota: '+encodeURIComponent(fU(d.cuotaUSD))+' x6 / Contado: '+encodeURIComponent(fU(d.contUSD))+')'+(ELEGIDO.USD?encodeURIComponent(' - Elijo '+(ELEGIDO.USD==='cuotas'?'6 cuotas':'pago único')):'')+'%0A';
  waTxt += 'Nombre: '+encodeURIComponent(nom||'—');
  G('btn-wa-send').href = 'https://wa.me/5491121600427?text='+waTxt;
}

/* ── PDF (mismo diseño navy/dorado original, adaptado a la paleta wine/yellow) ── */
function hacerPDF(d){
  var jsPDFlib = window.jspdf.jsPDF;
  var doc = new jsPDFlib({format:'a4'});
  doc.addFileToVFS('Saira-Regular.ttf', PDF_SAIRA_REGULAR_B64);
  doc.addFont('Saira-Regular.ttf', 'Saira', 'normal');
  doc.addFileToVFS('Saira-Bold.ttf', PDF_SAIRA_BOLD_B64);
  doc.addFont('Saira-Bold.ttf', 'Saira', 'bold');
  var F = 'Saira';
  var NV=[52,80,107], NVD=[36,58,78], GD=[169,135,28], WH=[255,255,255], LG=[246,247,249], GR=[69,75,82];
  var W=210, H=297, M=16, y=0, RAD=2.2;

  function checkPage(need){
    if (y + need > H - 48){
      doc.addPage();
      doc.setFillColor.apply(doc,NVD); doc.rect(0,0,W,15,'F');
      doc.setFillColor.apply(doc,GD); doc.rect(0,14.5,W,1.2,'F');
      doc.setTextColor.apply(doc,WH); doc.setFont(F,'bold'); doc.setFontSize(9.5);
      doc.text('COTIZACIÓN CAUCIÓN DE ALQUILER — Guido Bonifati',M,9.5);
      y = 26;
    }
  }

  doc.setFillColor.apply(doc,NVD); doc.rect(0,0,W,48,'F');
  doc.setFillColor.apply(doc,GD); doc.rect(0,45,W,3,'F');

  var logoW=32, logoH=logoW*391/874, badgeW=logoW+6, badgeH=logoH+6;
  var badgeX=8, badgeY=24-badgeH/2;
  doc.setFillColor.apply(doc,WH); doc.roundedRect(badgeX,badgeY,badgeW,badgeH,RAD,RAD,'F');
  doc.addImage(PDF_LOGO_GB_B64,'PNG', badgeX+3, badgeY+3, logoW, logoH);

  doc.setTextColor.apply(doc,WH); doc.setFontSize(17); doc.setFont(F,'bold');
  doc.text('COTIZACIÓN CAUCIÓN DE ALQUILER',48,19);
  doc.setFontSize(9.5); doc.setFont(F,'normal'); doc.setTextColor(200,210,220);
  doc.text('Guido Bonifati · Asesor de Seguros · guidobonifatiseguros@gmail.com',48,29);
  doc.text('Fecha: '+d.fecha+' · '+d.hora,48,37); y=58;

  function sec(t,c){ c=c||NV; doc.setFillColor.apply(doc,c); doc.roundedRect(M,y,W-M*2,10,RAD,RAD,'F'); doc.setTextColor.apply(doc,WH); doc.setFont(F,'bold'); doc.setFontSize(10); doc.text(t.toUpperCase(),M+5,y+7); y+=15; }
  function row(l,v,alt){ if(alt){doc.setFillColor.apply(doc,LG);doc.rect(M,y-1,W-M*2,9,'F');} doc.setTextColor.apply(doc,GR); doc.setFont(F,'normal'); doc.setFontSize(9.5); doc.text(l,M+4,y+5); doc.setTextColor.apply(doc,NV); doc.setFont(F,'bold'); doc.text(String(v),W-M-4,y+5,{align:'right'}); y+=10; }
  function cajas(cuota, totalCuotas, contado){
    var hw=(W-M*2-8)/2;
    doc.setFillColor.apply(doc,NVD); doc.roundedRect(M,y,hw,30,RAD,RAD,'F');
    doc.setFillColor.apply(doc,GD); doc.roundedRect(M+hw+8,y,hw,30,RAD,RAD,'F');
    doc.setTextColor(200,210,225); doc.setFont(F,'normal'); doc.setFontSize(7.5);
    doc.text('6 CUOTAS SIN INTERÉS',M+hw/2,y+8,{align:'center'});
    doc.setTextColor(230,195,90); doc.setFont(F,'bold'); doc.setFontSize(13);
    doc.text(cuota,M+hw/2,y+18,{align:'center'});
    doc.setTextColor(200,210,225); doc.setFont(F,'normal'); doc.setFontSize(7);
    doc.text('× 6 = '+totalCuotas,M+hw/2,y+26,{align:'center'});
    doc.setTextColor.apply(doc,WH); doc.setFont(F,'normal'); doc.setFontSize(7.5);
    doc.text('PAGO ÚNICO',M+hw+8+hw/2,y+8,{align:'center'});
    doc.setFont(F,'bold'); doc.setFontSize(13);
    doc.text(contado,M+hw+8+hw/2,y+18,{align:'center'});
    doc.setFont(F,'normal'); doc.setFontSize(7);
    doc.text('un solo pago',M+hw+8+hw/2,y+26,{align:'center'});
    y+=38;
  }

  checkPage(15+60);
  sec('Datos del Solicitante');
  row('Nombre y Apellido',d.nombre+' '+d.apellido,false); row('DNI',d.dni,true);
  row('Email',d.email,false); row('Teléfono',d.tel,true);
  row('Estado civil',d.ecivil,false); row('Situación laboral',d.sitlab,true); y+=4;

  checkPage(15+30);
  sec('Datos del Inmueble');
  row('Tipo',d.tipo,false); row('Dirección',d.dir,true); row('Duración',d.meses+' meses',false); y+=4;

  checkPage(15+40);
  sec('Cálculo de la Suma Asegurada',GD);
  row('Canon mensual',fM(d.canonV,d.mC),false);
  row('Expensas',d.expV>0?fM(d.expV,d.mE):'—',true);
  row('Servicios',d.serV>0?fM(d.serV,d.mS):'—',false);
  row('Duración contrato',d.meses+' meses',true); y+=4;

  if (d.sumaARS > 0) {
    checkPage(17+38);
    doc.setFillColor(224,232,240); doc.setDrawColor.apply(doc,NV); doc.roundedRect(M,y,W-M*2,11,RAD,RAD,'FD');
    doc.setTextColor.apply(doc,NV); doc.setFont(F,'bold'); doc.setFontSize(10);
    doc.text('SUMA ASEGURADA EN PESOS',M+4,y+8);
    doc.setTextColor.apply(doc,GD); doc.setFontSize(13); doc.text(fA(d.sumaARS),W-M-4,y+8,{align:'right'});
    y+=17;
    cajas(fA(d.cuotaARS), fA(d.costoARS), fA(d.contARS));
  }

  if (d.sumaUSD > 0) {
    y+=4;
    checkPage(17+38);
    doc.setFillColor(250,242,220); doc.setDrawColor.apply(doc,GD); doc.roundedRect(M,y,W-M*2,11,RAD,RAD,'FD');
    doc.setTextColor.apply(doc,NV); doc.setFont(F,'bold'); doc.setFontSize(10);
    doc.text('SUMA ASEGURADA EN DÓLARES',M+4,y+8);
    doc.setTextColor.apply(doc,GD); doc.setFontSize(13); doc.text(fU(d.sumaUSD),W-M-4,y+8,{align:'right'});
    y+=17;
    cajas(fU(d.cuotaUSD), fU(d.costoUSD), fU(d.contUSD));
  }

  if (d.obs && d.obs!=='—') {
    y+=4;
    var lnObs=doc.splitTextToSize(d.obs,W-M*2-8);
    checkPage(15+lnObs.length*6+8);
    sec('Observaciones');
    doc.setTextColor.apply(doc,GR); doc.setFont(F,'normal'); doc.setFontSize(9.5);
    doc.text(lnObs,M+4,y); y+=lnObs.length*6+8;
  }

  checkPage(26);
  doc.setFillColor.apply(doc,LG); doc.roundedRect(M,y,W-M*2,18,RAD,RAD,'F');
  doc.setTextColor.apply(doc,GR); doc.setFont(F,'normal'); doc.setFontSize(7.5);
  doc.text(doc.splitTextToSize('Esta cotización es informativa y sujeta a análisis crediticio. La emisión queda condicionada a la aprobación del estudio de riesgo. Respuesta en 24 horas hábiles.',W-M*2-8),M+4,y+6);

  doc.setFillColor.apply(doc,NVD); doc.rect(0,271,W,26,'F');
  doc.setFillColor.apply(doc,GD); doc.rect(0,268,W,3,'F');
  doc.setTextColor.apply(doc,WH); doc.setFont(F,'bold'); doc.setFontSize(9);
  doc.text('Guido Bonifati · Asesor de Seguros',W/2,279,{align:'center'});
  doc.setFont(F,'normal'); doc.setTextColor.apply(doc,GD); doc.setFontSize(8.5);
  doc.text('guidobonifatiseguros@gmail.com · 11 2160-0427',W/2,288,{align:'center'});

  var filename = 'Cotizacion_Caucion_'+(d.apellido||'cliente')+'_'+(d.dni||'')+'_'+d.fecha.replace(/\//g,'-')+'.pdf';
  return { doc:doc, filename:filename, blob:doc.output('blob') };
}

/* ── texto plano del resumen (para el mail de notificación de Netlify) ── */
function resumenTexto(d){
  var lineas = [
    'Solicitante: '+d.nombre+' '+d.apellido+' (DNI '+d.dni+')',
    'Email: '+d.email+' · Tel: '+d.tel,
    'Estado civil: '+d.ecivil+' · Situación laboral: '+d.sitlab,
    'Inmueble: '+d.tipo+' — '+d.dir,
    'Duración: '+d.meses+' meses'
  ];
  if (d.sumaARS>0) lineas.push('Suma asegurada ARS: '+fA(d.sumaARS)+' · Cuotas: '+fA(d.costoARS)+' ('+fA(d.cuotaARS)+'/mes x6) · Contado: '+fA(d.contARS)+(ELEGIDO.ARS?' · ELIGIÓ: '+(ELEGIDO.ARS==='cuotas'?'6 cuotas':'pago único'):''));
  if (d.sumaUSD>0) lineas.push('Suma asegurada USD: '+fU(d.sumaUSD)+' · Cuotas: '+fU(d.costoUSD)+' ('+fU(d.cuotaUSD)+'/mes x6) · Contado: '+fU(d.contUSD)+(ELEGIDO.USD?' · ELIGIÓ: '+(ELEGIDO.USD==='cuotas'?'6 cuotas':'pago único'):''));
  lineas.push('Ingreso mensual: '+fM(d.ingreso,d.mI));
  if (d.avNom!=='—') lineas.push('Avalista: '+d.avNom+' (DNI '+d.avDni+') · Ingreso: '+fM(d.avIng,d.mAval));
  if (d.obs!=='—') lineas.push('Observaciones: '+d.obs);
  return lineas.join('\n');
}

/* ── envío real: Netlify Forms (datos + documentos adjuntos) + PDF local ── */
var MAX_MB_TOTAL = 15;
function enviar(){
  if (totalMBAdjuntos() > MAX_MB_TOTAL){
    toast('Los documentos adjuntos pesan demasiado en total (máximo '+MAX_MB_TOTAL+' MB). Sacá alguno o comprimilos antes de enviar.', true);
    return;
  }
  var d = calcData();
  var data = {
    nombre:V('nombre').trim(), apellido:V('apellido').trim(),
    dni:V('dni').trim(), email:V('email').trim(), tel:V('tel').trim(),
    ecivil:V('ecivil')||'—', sitlab:V('sitlab'),
    tipo:V('tipo'), dir:V('dir').trim(), obs:V('obs').trim()||'—',
    meses:d.meses,
    canonV:d.canonV, mC:MON.canon,
    expV:d.expV, mE:MON.exp,
    serV:d.serV, mS:MON.ser,
    sumaARS:d.sumaARS, costoARS:d.costoARS, cuotaARS:d.cuotaARS, contARS:d.contARS,
    sumaUSD:d.sumaUSD, costoUSD:d.costoUSD, cuotaUSD:d.cuotaUSD, contUSD:d.contUSD,
    ingreso:N('ingreso'), mI:MON.ing,
    avNom:V('av-nom').trim()||'—', avDni:V('av-dni').trim()||'—',
    avIng:N('av-ing'), mAval:MON.aval,
    fecha:new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}),
    hora:new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})
  };

  var btn=G('btn-send');
  btn.disabled=true;
  btn.innerHTML='<span class="spinner"></span> Enviando...';

  enviarEmailJS(data);

  var pdf = hacerPDF(data);

  var formEl = G('cotizacion-form');
  var fd = new FormData(formEl);
  DOCS.contrato.forEach(function(f){ fd.append('doc-contrato', f, f.name); });
  DOCS.recibos.forEach(function(f){ fd.append('doc-recibos', f, f.name); });
  DOCS.aval.forEach(function(f){ fd.append('doc-aval', f, f.name); });
  fd.append('cotizacion_pdf', pdf.blob, pdf.filename);
  fd.set('resumen_cotizacion', resumenTexto(data));

  function mostrarExito(){
    pdf.doc.save(pdf.filename);
    G('p4btns').style.display='none';
    G('fail').classList.remove('show');
    G('succ').classList.add('show');
    G('rbox').style.display='none';
    G('snote').style.display='none';
    for (var i=1;i<=4;i++){ G('st'+i).classList.remove('on'); G('st'+i).classList.add('done'); }
    toast('Cotización enviada correctamente');
    clearDraft();
  }
  function mostrarFallo(){
    pdf.doc.save(pdf.filename);
    G('fail').classList.add('show');
    G('p4wa').style.display='flex';
    btn.disabled=false;
    btn.innerHTML='Reintentar <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>';
    toast('El PDF se descargó, pero el envío online falló', true);
  }

  fetch('/', { method:'POST', body: fd })
    .then(function(resp){
      if (resp.ok) { mostrarExito(); return; }
      resp.text().then(function(txt){
        console.error('Netlify Forms rechazó el envío. Status:', resp.status, '\nRespuesta:', txt);
      });
      mostrarFallo();
    })
    .catch(function(err){
      console.error('Error de red al enviar el formulario:', err);
      mostrarFallo();
    });
}
G('btn-send').addEventListener('click', enviar);

/* ── toast ────────────────────────────────────────── */
function toast(msg, warn){
  var t=G('toast');
  t.innerHTML = (warn
    ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/></svg>'
    : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M5 13l4 4L19 7"/></svg>')
    + '<span>'+msg+'</span>';
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ t.classList.remove('show'); }, 4200);
}

/* ── reset ────────────────────────────────────────── */
G('btn-reset').addEventListener('click', resetForm);
function resetForm(){
  document.querySelectorAll('input').forEach(function(i){ i.value=''; i.classList.remove('invalid'); });
  document.querySelectorAll('select').forEach(function(s){ s.selectedIndex=0; });
  document.querySelectorAll('.errmsg').forEach(function(e){ e.classList.remove('show'); });
  DOCS.contrato=[]; DOCS.recibos=[]; DOCS.aval=[];
  ['contrato','recibos','aval'].forEach(renderDocs);
  ELEGIDO.ARS=null; ELEGIDO.USD=null;
  pintarEleccion('ARS'); pintarEleccion('USD');
  G('grp-aval').classList.remove('show');
  ['canon','exp','ser','ing','aval'].forEach(function(c){
    MON[c]='ARS';
    var a=G('mb-'+c+'-ars'), u=G('mb-'+c+'-usd');
    if (a){ a.classList.add('on'); u.classList.remove('on'); }
  });
  G('succ').classList.remove('show');
  G('fail').classList.remove('show');
  G('p4btns').style.display='flex';
  G('p4wa').style.display='none';
  G('rbox').style.display='block';
  G('snote').style.display='block';
  G('aval-box').classList.remove('show');
  var st=G('ing-st');
  st.innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none"/></svg><span>Ingresá tu ingreso mensual neto para verificar.</span>';
  st.style.background=''; st.style.borderLeftColor='var(--wine)';
  G('btn-send').disabled=false;
  G('btn-send').innerHTML='Enviar cotización <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  for (var i=1;i<=4;i++){ G('pan'+i).classList.remove('on','entering'); G('st'+i).classList.remove('on','done'); }
  G('pan1').classList.add('on'); G('st1').classList.add('on');
  clearDraft();
  recalc();
}

/* ── borrador local (localStorage) ───────────────── */
var DRAFT_KEY='gb_cotizador_draft_v1';
var DRAFT_FIELDS=['canon','expensas','servicios','duracion','tipo','dir','ingreso','nombre','apellido','dni','email','tel','ecivil','sitlab','obs'];
function saveDraft(){
  try{
    var data={ mon:MON, campos:{} };
    DRAFT_FIELDS.forEach(function(id){ var el=G(id); if(el) data.campos[id]=el.value; });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }catch(e){}
}
function loadDraft(){
  try{
    var raw=localStorage.getItem(DRAFT_KEY);
    if(!raw) return;
    var data=JSON.parse(raw);
    if (data.campos) DRAFT_FIELDS.forEach(function(id){ var el=G(id); if(el && data.campos[id]) el.value=data.campos[id]; });
    if (data.mon){
      Object.keys(data.mon).forEach(function(c){
        if (data.mon[c]==='USD'){
          MON[c]='USD';
          var a=G('mb-'+c+'-ars'), u=G('mb-'+c+'-usd');
          if(a){ a.classList.remove('on'); u.classList.add('on'); }
        }
      });
    }
    if (data.campos && (data.campos.canon || data.campos.duracion)) toast('Recuperamos tu cotización guardada');
  }catch(e){}
}
function clearDraft(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }
document.querySelectorAll('#pan1 input, #pan1 select, #pan3 input, #pan3 select').forEach(function(el){
  el.addEventListener('input', saveDraft);
  el.addEventListener('change', saveDraft);
});

/* ── init ─────────────────────────────────────────── */
loadDraft();
recalc();
})();
