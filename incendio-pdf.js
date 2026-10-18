/* ── PDF de cotización de Incendio (mismo estilo visual que el de Caución de Alquiler) ── */
function hacerPDFIncendio(d){
  var jsPDFlib = window.jspdf.jsPDF;
  var doc = new jsPDFlib({format:'a4'});
  doc.addFileToVFS('Saira-Regular.ttf', PDF_SAIRA_REGULAR_B64);
  doc.addFont('Saira-Regular.ttf', 'Saira', 'normal');
  doc.addFileToVFS('Saira-Bold.ttf', PDF_SAIRA_BOLD_B64);
  doc.addFont('Saira-Bold.ttf', 'Saira', 'bold');
  var F = 'Saira';
  var EM=[200,90,48], EMD=[156,67,34], WH=[255,255,255], LG=[246,247,249], GR=[69,75,82], NV=[52,80,107];
  var W=210, H=297, M=16, y=0, RAD=2.2;
  var MU=[130,134,141], BD=[228,230,234];

  function checkPage(need){
    if (y + need > H - 48){
      doc.addPage();
      doc.setDrawColor.apply(doc,BD); doc.setLineWidth(.4); doc.line(0,15,W,15);
      doc.setTextColor.apply(doc,EMD); doc.setFont(F,'bold'); doc.setFontSize(9.5);
      doc.text('COTIZACIÓN SEGURO DE INCENDIO',M,10);
      y = 26;
    }
  }

  var logoW=42, logoH=logoW*391/874;
  doc.addImage(PDF_LOGO_GB_B64,'PNG', M, 8, logoW, logoH);

  var txX = M+logoW+8;
  doc.setTextColor.apply(doc,EMD); doc.setFontSize(16); doc.setFont(F,'bold');
  doc.text('COTIZACIÓN SEGURO DE INCENDIO',txX,18);
  doc.setFontSize(9.5); doc.setFont(F,'normal'); doc.setTextColor.apply(doc,MU);
  doc.text('Fecha: '+d.fecha+' · '+d.hora,txX,26);

  doc.setFillColor.apply(doc,EM); doc.rect(0,40,W,1.4,'F');
  y=52;

  function sec(t,c){ c=c||EMD; doc.setFillColor.apply(doc,c); doc.roundedRect(M,y,W-M*2,10,RAD,RAD,'F'); doc.setTextColor.apply(doc,WH); doc.setFont(F,'bold'); doc.setFontSize(10); doc.text(t.toUpperCase(),M+5,y+7); y+=15; }
  function row(l,v,alt){ if(alt){doc.setFillColor.apply(doc,LG);doc.rect(M,y-1,W-M*2,9,'F');} doc.setTextColor.apply(doc,GR); doc.setFont(F,'normal'); doc.setFontSize(9.5); doc.text(l,M+4,y+5); doc.setTextColor.apply(doc,NV); doc.setFont(F,'bold'); doc.text(String(v),W-M-4,y+5,{align:'right'}); y+=10; }

  checkPage(15+40);
  sec('Datos del Tomador');
  row('Nombre y Apellido',(d.nombre+' '+d.apellido).trim()||'—',false);
  row('Email',d.email||'—',true);
  row('Teléfono',d.tel||'—',false); y+=4;

  checkPage(15+60);
  sec('Datos del Inmueble');
  row('Provincia',d.provincia,false); row('Localidad',d.localidad,true);
  row('Dirección',d.dir,false); row('Metros cuadrados cubiertos',d.superficie!=='—'?d.superficie+' m²':'—',true);
  row('Uso del inmueble',d.actividad,false); y+=4;

  checkPage(15+70);
  sec('Sumas Aseguradas por Concepto',EM);
  if (d.saEdif>0) row('Incendio Edificio',fAraw(d.saEdif)+'  (prima '+fAraw(d.primaEdif)+')',false);
  if (d.saCont>0) row('Incendio Contenido',fAraw(d.saCont)+'  (prima '+fAraw(d.primaCont)+')',true);
  if (d.chkTerr) row('Terremoto',fAraw(d.saCat)+'  (prima '+fAraw(d.primaTerr)+')',false);
  if (d.chkGran) row('Granizo',fAraw(d.saCat)+'  (prima '+fAraw(d.primaGran)+')',true);
  if (d.saRc>0) row('Responsabilidad Civil Linderos',fAraw(d.saRc)+'  (prima '+fAraw(d.primaRc)+')',false);
  if (d.saRemocion>0) row('Remoción de Escombros',fAraw(d.saRemocion)+'  (incluida)',true);
  y+=4;

  checkPage(17+36);
  doc.setFillColor(251,233,225); doc.setDrawColor.apply(doc,EM); doc.roundedRect(M,y,W-M*2,11,RAD,RAD,'FD');
  doc.setTextColor.apply(doc,EMD); doc.setFont(F,'bold'); doc.setFontSize(10);
  doc.text('PRIMA TOTAL',M+4,y+8);
  doc.setTextColor.apply(doc,EM); doc.setFontSize(13); doc.text(fAraw(d.primaTotal),W-M-4,y+8,{align:'right'});
  y+=17;

  var hw=W-M*2;
  doc.setFillColor.apply(doc,EMD); doc.roundedRect(M,y,hw,30,RAD,RAD,'F');
  doc.setTextColor(250,220,210); doc.setFont(F,'normal'); doc.setFontSize(7.5);
  doc.text('PREMIO TOTAL · 10 CUOTAS DE '+fAraw(d.cuotaMensual),M+hw/2,y+9,{align:'center'});
  doc.setTextColor.apply(doc,WH); doc.setFont(F,'bold'); doc.setFontSize(15);
  doc.text(fAraw(d.premioTotal),M+hw/2,y+22,{align:'center'});
  y+=38;

  checkPage(26);
  doc.setFillColor.apply(doc,LG); doc.roundedRect(M,y,W-M*2,18,RAD,RAD,'F');
  doc.setTextColor.apply(doc,GR); doc.setFont(F,'normal'); doc.setFontSize(7.5);
  doc.text(doc.splitTextToSize('Esta cotización fue calculada con tasas de referencia y es informativa. El valor definitivo queda sujeto a confirmación con la aseguradora al momento de emitir la póliza. Respuesta en 24 horas hábiles.',W-M*2-8),M+4,y+6);

  doc.setFillColor.apply(doc,EMD); doc.rect(0,271,W,26,'F');
  doc.setFillColor.apply(doc,EM); doc.rect(0,268,W,3,'F');
  doc.setTextColor.apply(doc,WH); doc.setFont(F,'bold'); doc.setFontSize(9);
  doc.text('Guido Bonifati · Asesor de Seguros',W/2,279,{align:'center'});
  doc.setFont(F,'normal'); doc.setTextColor(250,220,210); doc.setFontSize(8.5);
  doc.text('guidobonifatiseguros@gmail.com · 11 2160-0427',W/2,288,{align:'center'});

  var filename = 'Cotizacion_Incendio_'+(d.apellido||'cliente')+'_'+d.fecha.replace(/\//g,'-')+'.pdf';
  return { doc:doc, filename:filename, blob:doc.output('blob') };
}
