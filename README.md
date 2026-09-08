# Cotizador Caución de Alquiler — Guido Bonifati

Cotizador online de caución de alquiler (garantía sin garante propietario), con cálculo de cotización en tiempo real, carga de documentación y envío mediante Netlify Forms.

Rediseño del cotizador original (`guidobonifaticotizacionalquileres.netlify.app`), con la identidad visual del sitio principal (colores wine/mauve/mostaza, tipografía Saira + Saira Condensed, logo real).

## Estructura

- `index.html` — estructura y contenido de la página.
- `styles.css` — estilos.
- `app.js` — lógica: cálculo de cotización, validaciones, pasos del formulario, carga de documentos, generación de PDF y envío.

## Cómo publicarlo en Netlify

1. En [app.netlify.com](https://app.netlify.com), **Add new site → Import an existing project**.
2. Elegí este repositorio de GitHub (`cotizador-caucion-alquiler`).
3. No hace falta configurar build command ni publish directory (es un sitio estático plano) — dejalo con los valores por defecto o poné publish directory `/` (raíz).
4. Deploy.

## Activar las notificaciones por email (paso importante, no es automático)

Los envíos del formulario (datos + documentos adjuntos) quedan guardados en el panel de Netlify, pero **el email a `guidobonifatiseguros@gmail.com` hay que activarlo manualmente una vez**:

1. En el panel del sitio en Netlify: **Site configuration → Forms → Form notifications**.
2. **Add notification → Email notification**.
3. Email to notify: `guidobonifatiseguros@gmail.com`.
4. Form: `cotizacion`.
5. Guardar.

Después de esto, cada cotización enviada:
- Queda visible en **Site configuration → Forms → cotizacion** (con los documentos adjuntos descargables ahí).
- Dispara un email de notificación a Guido.

**Importante — probarlo antes de darlo por hecho:** la vez pasada el email no llegó con el sistema anterior (EmailJS) y no se detectó a tiempo. Antes de compartir el link con clientes, hagan una cotización de prueba de punta a punta y confirmen que:
1. Aparece en el panel de Forms de Netlify.
2. Llega el email de notificación a la casilla.

Si en algún momento quieren que los documentos lleguen como adjunto real dentro del cuerpo del mail (en vez de un link al panel de Netlify), se puede sumar una automatización con Zapier o Make que dispare un email con los archivos adjuntos cuando entra una cotización nueva.

## Fórmula de cotización (para referencia futura)

- **Suma asegurada** = (alquiler mensual + expensas + servicios) × duración en meses, por separado en cada moneda si hay montos en pesos y en dólares.
- **Costo según duración:**
  - 12 meses → 6,00% en 6 cuotas sin interés / 5,10% al contado
  - 24 meses → 5,40% en 6 cuotas sin interés / 4,90% al contado
  - 36 meses → 5,10% en 6 cuotas sin interés / 4,80% al contado
- **Avalista:** se ofrece si el ingreso mensual neto es menor a 2 veces el alquiler mensual.

## Datos de contacto embebidos en el código

- Email de notificación: `guidobonifatiseguros@gmail.com`
- WhatsApp: `+54 9 11 2160-0427` (en `index.html`, buscar `wa.me/5491121600427`)

Para cambiarlos, buscar y reemplazar esos valores en `index.html` y `app.js`.
