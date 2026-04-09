/**
 * Script to inject inspectionGuide markdown into template-data.ts
 * Run: node scripts/inject-guides.js
 */
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../packages/shared/src/seed/template-data.ts');

const GUIDES = {
  // ─── ESTRUCTURA ───────────────────────────────────────
  'Control de fisuras en muros': `## Qué buscar
- Fisuras nuevas o que crecieron desde la última visita
- Clasificar por ancho: capilares (<0.5mm), medias (0.5-2mm), graves (>2mm)
- Patrón: diagonal = asentamiento, horizontal = empuje, escalera = cedimiento

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin fisuras nuevas, las existentes no crecieron |
| ⚠️ Atención | Fisura nueva <2mm o existente que creció |
| 🔴 Profesional | Fisura >2mm, patrón en escalera, o con desplazamiento |

## Procedimiento
1. Marcar fisuras con cinta y fecha en visita anterior
2. Medir ancho con fisurómetro o regla milimetrada
3. Comparar con registro fotográfico anterior
4. Fotografiar con referencia de escala (moneda)

## Normativa
- CIRSOC 200 — estructuras de hormigón armado
- Código de Edificación CABA — sección estructura`,

  'Evaluación profesional de fundaciones': `## Qué buscar
- Manchas de humedad ascendente en base de muros (hasta 50cm)
- Eflorescencias blancas (sales por capilaridad)
- Desniveles en pisos (usar nivel de burbuja, >5mm en 2m es significativo)
- Fisuras en escalera cerca de esquinas = asentamiento diferencial
- Desprendimiento de revoque en zona baja de muros

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin signos de movimiento ni humedad ascendente |
| ⚠️ Atención | Humedad leve en base, eflorescencias aisladas |
| 🔴 Profesional | Desniveles, fisuras en escalera, asentamiento |

## Procedimiento
1. Verificar nivelación de pisos con nivel de burbuja
2. Recorrer base de muros interiores buscando manchas
3. En subsuelo: verificar muros y pisos
4. Fotografiar hallazgos con ubicación de referencia

## Importante
**SIEMPRE requiere profesional matriculado** para diagnóstico definitivo.

## Normativa
- CIRSOC 200 — fundaciones
- INTI — relevamiento técnico de patologías constructivas`,

  'Verificación de juntas de dilatación': `## Qué buscar
- Sellado de juntas: que esté íntegro sin fisuras ni desprendimientos
- Material de relleno: no debe faltar ni estar deteriorado
- Que la junta permita movimiento (no debe estar rellena con mortero rígido)
- Filtración de agua por las juntas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sellado íntegro, sin filtraciones |
| ⚠️ Atención | Sellado parcialmente deteriorado |
| 🔴 Profesional | Sellado ausente, filtración activa, junta trabada con mortero |

## Procedimiento
1. Localizar todas las juntas de dilatación visibles
2. Verificar integridad del sellado en todo el recorrido
3. Buscar manchas de humedad adyacentes (indican filtración)

## Normativa
- CIRSOC 200 — juntas de dilatación en estructuras de hormigón
- Código de Edificación CABA`,

  'Reparación de fisuras detectadas': `## Qué buscar
- Fisuras previamente marcadas que requieren intervención
- Evaluar si la fisura está activa (sigue creciendo) o estabilizada
- Estado del material circundante

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Fisura estabilizada, reparación cosmética suficiente |
| ⚠️ Atención | Fisura estabilizada pero requiere sellado preventivo |
| 🔴 Profesional | Fisura activa, requiere inyección epoxi o refuerzo estructural |

## Procedimiento
1. Verificar marcas de la visita anterior (cinta con fecha)
2. Medir si el ancho cambió
3. Para fisuras estabilizadas <2mm: sellador elástico
4. Para fisuras activas o >2mm: derivar a profesional

## Normativa
- INTI — protocolos de reparación de patologías constructivas`,

  'Evaluación estructural integral quinquenal': `## Qué buscar
- Estado general de todos los elementos estructurales
- Vigas, columnas, losas, muros portantes, fundaciones
- Signos de corrosión de armaduras, carbonatación del hormigón
- Deformaciones, desplomes, pandeos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin deterioro significativo en 5 años |
| ⚠️ Atención | Deterioro leve que requiere monitoreo cercano |
| 🔴 Profesional | Cualquier signo de compromiso estructural |

## Importante
**SIEMPRE requiere ingeniero estructural matriculado.** Esta evaluación es una revisión integral, no una inspección visual rutinaria.

## Normativa
- CIRSOC 200 — evaluación de estructuras existentes
- Código de Edificación CABA — mantenimiento estructural`,

  'Inspección de losa de hormigón armado': `## Qué buscar
- Fisuras en cara inferior (cielorraso): mapa de fisuras, patrón
- Manchas de óxido (indican corrosión de armaduras)
- Flechas excesivas (deformación visible, hundimiento central)
- Desprendimiento de recubrimiento (capa de hormigón sobre armadura)
- Humedad o goteo a través de la losa

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin fisuras significativas, sin manchas de óxido |
| ⚠️ Atención | Fisuras finas sin óxido, humedad leve |
| 🔴 Profesional | Manchas de óxido, armadura expuesta, flecha excesiva |

## Procedimiento
1. Inspeccionar cara inferior con buena iluminación
2. Buscar manchas marrones/anaranjadas (óxido de armadura)
3. Verificar planeidad visual (comparar con líneas de referencia)
4. Golpear suavemente: sonido hueco = desprendimiento

## Normativa
- CIRSOC 200 — evaluación de losas de hormigón`,

  'Control de revoques exteriores': `## Qué buscar
- Desprendimientos o zonas huecas (golpear con nudillos)
- Fisuras en el revoque (mapa de fisuras)
- Manchas de humedad, eflorescencias, moho
- Ampollas o descascaramiento de pintura sobre revoque

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Revoque firme, sin fisuras ni desprendimientos |
| ⚠️ Atención | Fisuras capilares, descascaramiento leve de pintura |
| 🔴 Profesional | Zonas huecas extensas, desprendimiento activo |

## Procedimiento
1. Golpear suavemente toda la superficie con nudillos
2. Sonido hueco = revoque desprendido del muro
3. Verificar bordes de fisuras (si se mueven = activas)
4. Registrar extensión de áreas afectadas

## Normativa
- Código de Edificación CABA — mantenimiento de fachadas`,

  'Inspección de muros portantes de mampostería': `## Qué buscar
- Fisuras verticales u horizontales en muros de ladrillo
- Estado de las juntas de mortero (desgaste, faltante)
- Desplome del muro (verificar con plomada o nivel)
- Humedad, eflorescencias, daño por sales

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muro aplomado, juntas íntegras, sin fisuras |
| ⚠️ Atención | Juntas desgastadas, fisuras menores |
| 🔴 Profesional | Muro desplomado, fisuras en escalera, juntas faltantes |

## Procedimiento
1. Verificar aplomo con nivel o plomada
2. Inspeccionar juntas de mortero (desgaste >10mm = rejuntar)
3. Buscar fisuras siguiendo patrón de juntas (escalera)
4. Verificar encadenados horizontales visibles

## Normativa
- CIRSOC 501 — mampostería encadenada
- Código de Edificación CABA — muros portantes`,

  // ─── TECHOS Y CUBIERTAS ───────────────────────────────
  'Limpieza de canaletas y bajadas pluviales': `## Qué buscar
- Acumulación de hojas, tierra y sedimentos en canaletas
- Bajadas obstruidas (verificar pasando agua)
- Pendiente correcta (el agua debe escurrir sin estancarse)
- Uniones selladas (goteos debajo de canaleta)
- Soportes firmes (deformación o pandeo de canaleta)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Canaletas limpias, pendiente correcta, sin goteos |
| ⚠️ Atención | Acumulación leve, necesita limpieza |
| 🔴 Profesional | Pendiente invertida, soportes cedidos, deformación |

## Procedimiento
1. Retirar hojas y sedimentos manualmente con guantes
2. Pasar agua con balde y verificar que escurra sin estancarse
3. Verificar bajadas: escuchar flujo al verter agua arriba
4. Revisar sellado en uniones y esquinas
5. Verificar estado de rejillas protectoras

## Normativa
- Código de Edificación CABA — desagües pluviales`,

  'Control de tejas o chapa': `## Qué buscar
- Tejas: rotas, desplazadas, faltantes, con musgo
- Chapa: oxidación, tornillos flojos o faltantes, ondulación
- Sellado en cumbrera (el punto más vulnerable)
- Solapes entre piezas (mínimo según fabricante)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cubierta íntegra, sin tejas rotas ni chapa oxidada |
| ⚠️ Atención | 1-2 tejas desplazadas, oxidación superficial en chapa |
| 🔴 Profesional | Múltiples tejas rotas, chapa perforada, filtración activa |

## Procedimiento
1. Inspección visual desde escalera o terraza (NO caminar sobre tejas)
2. Usar binoculares si la cubierta no es accesible
3. Verificar cumbrera y babetas en encuentros con muros
4. En chapa: buscar zonas con burbujas de óxido

## Normativa
- Código de Edificación CABA — cubiertas`,

  'Tratamiento impermeabilizante': `## Qué buscar
- Estado de la impermeabilización actual (membrana, pintura, líquida)
- Adherencia al sustrato (bordes despegados)
- Fisuras o burbujas en el tratamiento
- Zonas donde el tratamiento ya perdió efectividad

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Impermeabilización íntegra y adherida |
| ⚠️ Atención | Desgaste superficial, requiere renovación preventiva |
| 🔴 Profesional | Tratamiento fallido, filtración activa |

## Procedimiento
1. Recorrer toda la superficie tratada
2. Verificar bordes y encuentros con muros
3. Buscar burbujas, fisuras, zonas despegadas
4. Verificar fecha del último tratamiento (vida útil ~5-10 años)

## Nota
Se recomienda profesional para la aplicación del tratamiento.`,

  'Reparación de filtraciones': `## Qué buscar
- Origen de la filtración (rastrear desde mancha interior hasta cubierta)
- Manchas en cielorraso: amarillas (agua), verdes (moho)
- Goteo activo durante o después de lluvia
- Estado del sellado en encuentros, babetas, chimeneas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas ni goteos |
| ⚠️ Atención | Mancha seca antigua, no activa |
| 🔴 Profesional | Filtración activa, goteo, moho |

## Procedimiento
1. Identificar la zona de mancha en interior
2. Subir al techo y buscar el origen arriba de la mancha
3. Verificar: membrana, babetas, canaletas, encuentros con muros
4. Marcar el punto de origen para reparación

## Importante
Las filtraciones activas requieren reparación urgente para evitar daño estructural.`,

  'Reemplazo integral de membrana asfáltica': `## Qué buscar
- Estado general de la membrana: flexible o reseca/quebradiza
- Fecha de la última aplicación (vida útil ~10 años)
- Solapes entre paños (mínimo 10cm)
- Adherencia al sustrato

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Membrana flexible, sin fisuras, dentro de vida útil |
| ⚠️ Atención | Más de 8 años, desgaste visible |
| 🔴 Profesional | Quebradiza, múltiples fisuras, vida útil excedida |

## Importante
**SIEMPRE requiere profesional** para el reemplazo. La aplicación con soplete de gas requiere habilitación.

## Normativa
- Práctica profesional: membrana asfáltica vida útil 10 años`,

  'Inspección post-granizo': `## Qué buscar
- Tejas rotas o fisuradas por impacto
- Abolladura en chapa
- Daño en membrana (perforaciones)
- Canaletas deformadas
- Claraboyas o lucernarios dañados

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin daños visibles tras el evento |
| ⚠️ Atención | Daño menor (1-2 tejas fisuradas) |
| 🔴 Profesional | Daño extenso, perforación de cubierta |

## Procedimiento
1. Inspeccionar lo antes posible después del evento
2. Documentar fotográficamente todos los daños (para seguro)
3. Verificar interior: buscar goteos nuevos
4. Revisar canaletas y bajadas por obstrucción con granizo`,

  'Control de claraboyas y lucernarios': `## Qué buscar
- Estado del vidrio o policarbonato (fisuras, amarillamiento)
- Sellado perimetral (silicona o burlete)
- Oxidación en marcos metálicos
- Condensación interior (indica pérdida de hermeticidad)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Vidrio íntegro, sellado hermético, sin condensación |
| ⚠️ Atención | Sellado deteriorado, condensación leve |
| 🔴 Profesional | Vidrio fisurado, filtración activa |

## Procedimiento
1. Verificar estado de vidrio/policarbonato visualmente
2. Revisar sellado perimetral completo
3. Buscar marcas de agua o humedad alrededor
4. Verificar mecanismo de apertura si es practicable`,

  'Limpieza de techos y terrazas': `## Qué buscar
- Acumulación de suciedad, hojas, musgo
- Desagües y rejillas obstruidos
- Estado de la superficie (membrana, baldosas, contrapiso)
- Pendiente hacia los desagües (no debe haber charcos)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Limpio, desagües libres, sin charcos |
| ⚠️ Atención | Acumulación de suciedad, limpieza necesaria |
| 🔴 Profesional | Desagüe obstruido con agua estancada, musgo extenso |

## Procedimiento
1. Barrer hojas y residuos sueltos
2. Limpiar rejillas de desagüe
3. Verificar que el agua escurra hacia los desagües
4. Si hay musgo: limpiar con agua y cepillo (no ácidos)`,

  'Revisión de babetas y encuentros': `## Qué buscar
- Babetas (chapa o membrana) en encuentros techo-muro
- Sellado en chimeneas, ventilaciones, caños que atraviesan la cubierta
- Corrosión en babetas metálicas
- Desprendimiento o levantamiento

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Babetas selladas, sin oxidación ni levantamientos |
| ⚠️ Atención | Sellado parcialmente deteriorado |
| 🔴 Profesional | Babeta levantada, filtración en encuentro |

## Procedimiento
1. Verificar cada encuentro techo-muro
2. Revisar alrededor de chimeneas y ventilaciones
3. Buscar manchas de óxido o cal debajo de babetas
4. Verificar sellado con silicona o asfalto

## Normativa
- Código de Edificación CABA — encuentros de cubierta`,

  // ─── INSTALACIÓN ELÉCTRICA ────────────────────────────
  'Prueba de disyuntor diferencial (ID)': `## Qué buscar
- Funcionamiento del botón TEST del diferencial
- Corte inmediato del suministro al presionar TEST
- Que la palanca vuelva a ON fácilmente

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Corta inmediatamente al presionar TEST |
| ⚠️ Atención | Demora en cortar (>0.3 segundos) |
| 🔴 Profesional URGENTE | No corta, no tiene diferencial, o palanca trabada |

## Procedimiento
1. Avisar a los ocupantes que se cortará la luz momentáneamente
2. Presionar botón TEST (marcado con T)
3. El diferencial debe cortar instantáneamente
4. Volver a subir la palanca a posición ON
5. Repetir con cada diferencial si hay más de uno

## Importante
Hacer esta prueba **mensualmente**. Es la protección contra electrocución.

## Normativa
- AEA 90364 — protección diferencial obligatoria
- Diferencial 30mA mínimo según ENRE`,

  'Medición de puesta a tierra': `## Qué buscar
- Valor de resistencia de puesta a tierra (PAT)
- Estado de la jabalina y conductor de protección
- Conexión del cable verde-amarillo al tablero

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | PAT <10 ohms, jabalina y conductor en buen estado |
| ⚠️ Atención | PAT entre 10-40 ohms |
| 🔴 Profesional | PAT >40 ohms, jabalina ausente, conductor cortado |

## Importante
**Requiere electricista matriculado con telurímetro.**

## Normativa
- AEA 90364 parte 5 cap. 54 — instalaciones de PAT
- IRAM 2281 — medición de resistencia de PAT
- ENRE: máximo 40 ohms para diferencial 30mA`,

  'Control de tomacorrientes y llaves': `## Qué buscar
- Tomacorrientes flojos o que no sujetan la ficha
- Marcas de calentamiento (oscurecimiento, deformación)
- Llaves de luz que chispean o hacen ruido al accionar
- Tapas rotas o faltantes
- Tomacorrientes cerca de agua sin protección (baño, cocina)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos firmes, sin marcas de calor, funcionan correctamente |
| ⚠️ Atención | Tapa rota, tomacorriente flojo |
| 🔴 Profesional | Signos de calentamiento, chispas, olor a quemado |

## Procedimiento
1. Verificar cada tomacorriente insertando y retirando una ficha
2. Accionar cada llave de luz: escuchar chispas o crepiteo
3. Verificar que tomacorrientes en baño/cocina sean con toma tierra
4. Buscar oscurecimiento alrededor de tapas (signo de arco)

## Normativa
- AEA 90364 sección 771 — instalaciones en viviendas`,

  'Revisión de instalación eléctrica completa': `## Qué buscar
- Estado general de tablero, cableado visible, tomacorrientes
- Termografía de puntos calientes (si hay instrumental)
- Cables con aislación deteriorada
- Circuitos sobrecargados

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Instalación en buen estado general |
| ⚠️ Atención | Cables antiguos pero funcionales, tablero desactualizado |
| 🔴 Profesional | Cables sin aislación, tablero sin diferencial, empalmes fuera de caja |

## Importante
**Requiere electricista matriculado.** Frecuencia recomendada por ENRE: cada 5 años.

## Normativa
- AEA 90364 — reglamentación completa
- ENRE — revisión cada 5 años recomendada`,

  'Medición de aislación de conductores (megado)': `## Qué buscar
- Resistencia de aislación de conductores con megóhmetro
- Cables envejecidos con aislación reseca = riesgo de incendio
- Valores mínimos según norma AEA

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Valores de aislación dentro de norma |
| ⚠️ Atención | Valores límite, monitorear en próxima revisión |
| 🔴 Profesional | Valores por debajo de norma, reemplazo de cables |

## Importante
**Requiere electricista matriculado con megóhmetro.** Se realiza junto con la revisión eléctrica completa cada 5 años.

## Normativa
- AEA 90364 — valores mínimos de aislación
- Norma IRAM correspondiente`,

  'Verificación de protecciones térmicas por circuito': `## Qué buscar
- Que cada circuito tenga su térmica individual
- Que el amperaje de la térmica corresponda al cableado
- Que no haya térmicas puenteadas o anuladas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cada circuito protegido, amperajes correctos |
| ⚠️ Atención | Etiquetado faltante, difícil identificar circuitos |
| 🔴 Profesional | Térmicas puenteadas, amperaje excesivo para el cable |

## Procedimiento
1. Abrir tablero y contar térmicas vs circuitos
2. Verificar que ninguna térmica esté puenteada con alambre
3. Comparar amperaje de térmica con sección del cable

## Normativa
- AEA 90364 — protecciones por circuito`,

  'Control de medidor eléctrico y acometida': `## Qué buscar
- Estado del gabinete del medidor (herrumbre, humedad)
- Cables de acometida (aislación, fijación)
- Sello del medidor intacto
- Tablero de acometida: térmica general

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Gabinete en buen estado, cables firmes |
| ⚠️ Atención | Gabinete con oxidación leve |
| 🔴 Profesional | Cables de acometida deteriorados, gabinete abierto |

## Procedimiento
1. Verificar gabinete externo del medidor
2. NO abrir el gabinete si tiene sello de la distribuidora
3. Verificar que no haya cables expuestos en acometida

## Normativa
- ENRE — reglamento de conexión de suministros`,

  'Verificación de protección contra sobretensiones (DPS)': `## Qué buscar
- Presencia de dispositivo DPS en tablero
- Indicador de estado (LED verde = OK, rojo = agotado)
- Conexión correcta entre fases y tierra

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | DPS presente y con indicador verde |
| ⚠️ Atención | DPS ausente (recomendado pero no obligatorio) |
| 🔴 Profesional | DPS con indicador rojo (agotado, reemplazar) |

## Nota
El DPS protege equipos electrónicos contra sobretensiones por rayos o maniobras en la red. Recomendado en zonas con tormentas frecuentes.

## Normativa
- AEA 90364 — protección contra sobretensiones`,

  'Inspección de instalación eléctrica enterrada': `## Qué buscar
- Tapas de registro accesibles y en buen estado
- Caños de PVC no aplastados ni fisurados (donde son visibles)
- Humedad en registros o cajas de paso enterradas
- Cables con marcas de deterioro en puntos de salida

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Registros accesibles, sin humedad |
| ⚠️ Atención | Tapa de registro trabada o deteriorada |
| 🔴 Profesional | Humedad dentro de registros, cables dañados |

## Procedimiento
1. Localizar tapas de registro en jardín/vereda
2. Abrir y verificar estado interior (humedad, cables)
3. No manipular cables, solo inspección visual

## Normativa
- AEA 90364 — canalizaciones enterradas`,

  // ─── INSTALACIÓN SANITARIA ────────────────────────────
  'Inspección de canillas y griferías': `## Qué buscar
- Goteos con la canilla cerrada
- Estado de cuerpos cerámicos (giro suave, sin juego)
- Flexibles de conexión (fecha, corrosión, deformación)
- Presión de agua adecuada al abrir

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin goteos, giro suave, presión normal |
| ⚠️ Atención | Goteo leve, flexible próximo a vencer |
| 🔴 Profesional | Pérdida en caño empotrado, llave de paso que no corta |

## Procedimiento
1. Abrir y cerrar cada canilla completamente
2. Verificar debajo de mesadas/vanitorys (buscar goteo)
3. Revisar flexibles: buscar fecha estampada
4. En monocomandos: verificar mezcla de temperatura

## Normativa
- Reglamento OSN/AySA — instalaciones sanitarias internas`,

  'Limpieza de sifones y rejillas': `## Qué buscar
- Velocidad de desagote (debe ser rápida)
- Olores provenientes de desagües (sifón seco o roto)
- Rejillas obstruidas con cabello, jabón, sedimentos
- Estado del sifón (corrosión, fisuras)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Desagote rápido, sin olores |
| ⚠️ Atención | Desagote lento, necesita limpieza |
| 🔴 Profesional | Obstrucción total, olores persistentes, sifón roto |

## Procedimiento
1. Verter agua en cada desagüe y cronometrar
2. Retirar rejillas y limpiar residuos acumulados
3. En sifones accesibles: desenroscar y limpiar
4. Verificar que el sifón tenga agua (sello hidráulico)`,

  'Limpieza y desinfección de tanque': `## Qué buscar
- Sedimentos en el fondo del tanque
- Color y olor del agua (turbia = contaminación)
- Estado de la tapa (cerrada, sin fisuras)
- Fecha de última limpieza (obligatoria anual)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Agua clara, tanque limpio, limpieza reciente |
| ⚠️ Atención | Sedimento leve, limpieza hace >6 meses |
| 🔴 Profesional | Agua turbia/con olor, nunca se limpió, tapa rota |

## Procedimiento
1. Cerrar ingreso de agua al tanque
2. Vaciar parcialmente dejando ~20cm
3. Limpiar paredes y fondo con cepillo y agua con lavandina
4. Enjuagar varias veces y llenar nuevamente
5. Registrar fecha de limpieza

## Normativa
- ENRESS — limpieza obligatoria mínimo 1 vez por año
- Resolución provincial: análisis bacteriológico anual`,

  'Detección de pérdidas ocultas': `## Qué buscar
- Manchas de humedad en paredes sin fuente visible
- Aumento inexplicable en factura de agua
- Sonido de agua corriendo con canillas cerradas
- Medidor de agua que gira con todo cerrado

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Medidor quieto con todo cerrado, sin manchas |
| ⚠️ Atención | Mancha de humedad nueva sin fuente obvia |
| 🔴 Profesional | Medidor gira con todo cerrado = pérdida oculta |

## Procedimiento
1. Cerrar todas las canillas y artefactos
2. Verificar medidor de agua: debe estar quieto
3. Si gira = hay pérdida en cañería
4. Buscar manchas de humedad en pisos y paredes
5. Derivar a plomero para localización con instrumental`,

  'Verificación de termotanque y ánodo de sacrificio': `## Qué buscar
- Estado exterior del termotanque (corrosión, pérdidas)
- Funcionamiento del ánodo de sacrificio (protege contra corrosión)
- Temperatura del agua (no debe superar 60°C)
- Válvula de seguridad (debe gotear al subir temperatura)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin pérdidas, agua caliente a temperatura normal |
| ⚠️ Atención | Ánodo a reemplazar (cada 2-3 años) |
| 🔴 Profesional | Pérdida en tanque, válvula de seguridad trabada |

## Procedimiento
1. Verificar exterior: buscar goteos o corrosión
2. Verificar válvula de seguridad (levantar palanca: debe gotear)
3. Consultar fecha de instalación (vida útil ~10 años)

## Nota
El ánodo de sacrificio requiere plomero para extracción y verificación.`,

  'Mantenimiento de cámara séptica': `## Qué buscar
- Nivel de lodos (no debe superar 1/3 del volumen)
- Olores fuertes en superficie (indica saturación)
- Tapas de inspección accesibles
- Filtración al terreno circundante

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Nivel normal, sin olores, tapas accesibles |
| ⚠️ Atención | Olores leves, nivel de lodos alto |
| 🔴 Profesional | Saturación, retorno de líquidos, contaminación |

## Importante
**Requiere empresa autorizada** para vaciado y limpieza (camión atmosférico).

## Procedimiento
1. Localizar tapas de inspección
2. Abrir con precaución (gases tóxicos, NO fumar cerca)
3. Verificar nivel de lodos visualmente
4. Frecuencia de vaciado: cada 1-2 años según uso`,

  'Inspección de llave de paso general de agua': `## Qué buscar
- Que la llave cierre completamente (corte total del agua)
- Estado de la llave (corrosión, dureza al girar)
- Accesibilidad (no debe estar tapada o inaccesible)
- Pérdida en la llave o sus conexiones

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cierra completamente, gira suave, accesible |
| ⚠️ Atención | Giro duro pero funcional |
| 🔴 Profesional | No cierra, pérdida activa, inaccesible |

## Procedimiento
1. Localizar la llave de paso general
2. Cerrar completamente girando en sentido horario
3. Verificar que no salga agua de ninguna canilla
4. Abrir nuevamente y verificar que fluya normalmente`,

  'Control de bomba presurizadora': `## Qué buscar
- Funcionamiento: se activa al abrir canilla, se apaga al cerrar
- Ruidos anormales (vibraciones, golpeteo)
- Pérdidas en conexiones
- Presión adecuada (verificar en baño más lejano)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Arranca y para correctamente, sin ruidos |
| ⚠️ Atención | Cicla frecuentemente (presostato a ajustar) |
| 🔴 Profesional | No arranca, ruido fuerte, pérdida |

## Procedimiento
1. Abrir una canilla y verificar que la bomba arranque
2. Cerrar canilla: bomba debe parar en segundos
3. Verificar presión en punto más lejano
4. Buscar pérdidas en conexiones de succión y descarga`,

  'Inspección de cañerías visibles': `## Qué buscar
- Estado de cañerías expuestas (óxido, corrosión verde, goteo)
- Soportes y grampas (firmes, sin vibración)
- Aislación térmica en caños de agua caliente
- Condensación excesiva en caños de agua fría (indica mal aislación)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin corrosión, soportes firmes, sin goteos |
| ⚠️ Atención | Corrosión superficial, falta aislación |
| 🔴 Profesional | Goteo activo, corrosión avanzada, soporte cedido |

## Procedimiento
1. Recorrer cañerías visibles en subsuelo, cocina, baño
2. Buscar goteos en uniones y conexiones
3. Verificar soportes cada 1-2 metros
4. En caños de cobre: buscar color verde (corrosión)`,

  'Limpieza de pozo de bombeo': `## Qué buscar
- Nivel de agua en el pozo (normal vs excesivo)
- Sedimentos acumulados en el fondo
- Estado de la bomba sumergible
- Flotante de nivel funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Nivel normal, bomba funcional, sin sedimento excesivo |
| ⚠️ Atención | Sedimento acumulado, requiere limpieza |
| 🔴 Profesional | Bomba no funciona, nivel excesivo, olor |

## Procedimiento
1. Verificar nivel de agua en el pozo
2. Activar bomba y verificar funcionamiento
3. Si hay sedimento excesivo: programar limpieza
4. Verificar flotante: debe activar/desactivar la bomba

## Nota
La limpieza del pozo requiere personal con equipo adecuado.`,

  'Verificación de válvula de retención': `## Qué buscar
- Funcionamiento: impide retorno de agua (sentido único)
- Que no haya golpe de ariete al cerrar canillas
- Estado exterior (corrosión, pérdidas)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin retorno de agua, sin golpes en cañería |
| ⚠️ Atención | Golpe de ariete leve |
| 🔴 Profesional | Retorno de agua, golpe fuerte, válvula trabada |

## Procedimiento
1. Verificar ubicación de la válvula (generalmente en bajada de tanque)
2. Abrir y cerrar canillas: escuchar golpes en cañería
3. Si hay retorno: la válvula necesita reemplazo`,

  // ─── GAS Y CALEFACCIÓN ────────────────────────────────
  'Control de llama piloto y quemadores': `## Qué buscar
- Color de llama piloto: debe ser azul estable
- Color de quemadores: azul = correcto, amarillo = peligro
- Hollín alrededor de quemadores
- Estabilidad de la llama (no debe oscilar)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Llama azul estable, sin hollín |
| ⚠️ Atención | Llama con puntas amarillas leves |
| 🔴 Profesional URGENTE | Llama amarilla/naranja, hollín, olor |

## Procedimiento
1. Encender cada artefacto y observar llama
2. Llama azul = combustión completa (seguro)
3. Llama amarilla = combustión incompleta (CO, peligroso)
4. Si la llama es amarilla: apagar, ventilar, llamar gasista

## Normativa
- NAG-200 — artefactos de gas domiciliarios
- Llama amarilla produce monóxido de carbono (mortal)`,

  'Prueba de monóxido de carbono': `## Qué buscar
- Detector de CO instalado (recomendado en todo ambiente con gas)
- Manchas negras/hollín en paredes/techo cerca de artefactos
- Llama amarilla en cualquier artefacto de gas
- Ventilación adecuada en ambientes con artefactos de gas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin signos de CO, ventilación adecuada, detector funcional |
| ⚠️ Atención | Sin detector de CO (recomendado instalar) |
| 🔴 Profesional URGENTE | Hollín, llama amarilla, síntomas en ocupantes |

## PELIGRO
El monóxido de carbono es **inodoro e invisible**. Causa muerte.
Si hay sospecha: ventilar inmediatamente y evacuar.

## Normativa
- NAG-200 — ventilación obligatoria para artefactos de gas`,

  'Limpieza de conductos de ventilación': `## Qué buscar
- Rejillas de ventilación limpias y sin obstrucciones
- Tiraje correcto en conductos (verificar con llama de fósforo)
- Nidos de pájaros o insectos en conductos
- Rejilla baja (entrada aire) + rejilla alta (salida aire)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Rejillas limpias, tiraje correcto |
| ⚠️ Atención | Rejilla parcialmente obstruida |
| 🔴 Profesional URGENTE | Conducto obstruido, sin tiraje, ventilación anulada |

## Procedimiento
1. Verificar que existan ambas rejillas (baja + alta) por ambiente
2. Acercar llama de fósforo a rejilla alta: debe inclinarse hacia adentro
3. Si no se inclina = conducto obstruido
4. Limpiar rejillas con cepillo

## Normativa
- NAG-200 — ventilación obligatoria en ambientes con gas
- Conducto obstruido = riesgo de acumulación de CO`,

  'Service de caldera/calefón': `## Qué buscar
- Limpieza de quemadores y serpentina
- Estado de intercambiador de calor
- Verificación de presión de gas
- Verificación de tiraje del conducto de evacuación

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Service al día, funcionamiento normal |
| ⚠️ Atención | Service vencido (más de 1 año) |
| 🔴 Profesional | Mal funcionamiento, llama irregular, ruidos |

## Importante
**SIEMPRE requiere gasista matriculado.** No intentar desarmar artefactos de gas.

## Normativa
- NAG-200 — mantenimiento de artefactos de gas
- Service anual recomendado por fabricantes`,

  'Revisión periódica obligatoria NAG-226': `## Qué buscar
- Oblea vigente (pegada en medidor o artefacto principal)
- Prueba de hermeticidad de toda la instalación
- Estado de regulador de presión
- Ventilaciones reglamentarias en todos los ambientes

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Oblea vigente, instalación aprobada |
| ⚠️ Atención | Oblea próxima a vencer |
| 🔴 Profesional | Oblea vencida o ausente, falta de revisión |

## Importante
**OBLIGATORIA cada 3 años** para vivienda unifamiliar.
**SOLO gasista matriculado ENARGAS** puede realizar esta revisión.

## Normativa
- NAG-226 (ENARGAS) — procedimiento de revisión periódica
- Resolución ENARGAS 696/2024`,

  'Verificación de llave de paso general de gas': `## Qué buscar
- Que la llave cierre completamente (corte total del gas)
- Accesibilidad: debe poder cerrarse rápidamente en emergencia
- Estado: sin corrosión ni dureza excesiva al girar
- Identificación clara (todos deben saber dónde está)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cierra bien, accesible, todos la conocen |
| ⚠️ Atención | Giro duro, ubicación difícil |
| 🔴 Profesional | No cierra, pérdida en la llave |

## Procedimiento
1. Localizar la llave de paso general
2. Cerrar (girar 90° perpendicular al caño = cerrado)
3. Verificar que ningún artefacto encienda
4. Abrir nuevamente (paralelo al caño = abierto)

## Normativa
- NAG-200 — llaves de paso obligatorias`,

  'Control del medidor de gas': `## Qué buscar
- Estado del gabinete (sin herrumbre, ventilado)
- Lectura del medidor (para comparar consumo)
- Conexiones sin pérdidas (olor a gas)
- Regulador de presión en buen estado

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin olor, gabinete en buen estado, lectura normal |
| ⚠️ Atención | Gabinete deteriorado |
| 🔴 Profesional | Olor a gas en medidor, pérdida |

## Procedimiento
1. Verificar gabinete externo
2. Anotar lectura del medidor (para control de consumo)
3. Oler alrededor de conexiones (gas natural es odorizado)
4. NO manipular regulador ni conexiones

## Normativa
- NAG-200 — medidores e instalaciones de gas`,

  'Inspección de chimenea y conducto de humos': `## Qué buscar
- Obstrucciones en el conducto (nidos, hollín acumulado)
- Tiraje correcto (verificar con llama)
- Estado del sombrero o remate de chimenea
- Fisuras en el conducto (especialmente en tramos interiores)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tiraje correcto, sin obstrucciones, sombrero en buen estado |
| ⚠️ Atención | Hollín acumulado, requiere limpieza |
| 🔴 Profesional | Sin tiraje, conducto fisurado, sombrero faltante |

## Procedimiento
1. Verificar sombrero de chimenea desde exterior (visual)
2. Acercar llama a boca del conducto: debe ser aspirada
3. Si no hay tiraje: posible obstrucción
4. Limpieza de hollín con deshollinador (profesional)

## Normativa
- NAG-200 — evacuación de productos de combustión
- Conducto obstruido = acumulación de CO en ambiente`,

  // ─── ABERTURAS ────────────────────────────────────────
  'Lubricación de bisagras y cerraduras': `## Qué buscar
- Bisagras que chirrían o resisten al movimiento
- Cerraduras duras al girar la llave
- Oxidación en componentes metálicos
- Holgura excesiva en bisagras (puerta cae)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Movimiento suave, sin ruidos, sin óxido |
| ⚠️ Atención | Chirrido, dureza leve al girar cerradura |
| 🔴 Profesional | Cerradura trabada, bisagra rota, puerta descolgada |

## Procedimiento
1. Abrir y cerrar cada puerta lentamente
2. Aplicar lubricante (WD-40 o grafito) en bisagras que chirrían
3. Aplicar grafito en polvo en cerraduras duras (NO aceite)
4. Verificar tornillos de bisagras (ajustar si están flojos)`,

  'Ajuste de burletes y sellados': `## Qué buscar
- Burletes deteriorados (aplastados, rotos, faltantes)
- Corrientes de aire con ventana/puerta cerrada
- Sellado de silicona en perímetro exterior
- Condensación excesiva en vidrios (indica falta de hermeticidad)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Burletes íntegros, sin corrientes de aire |
| ⚠️ Atención | Burletes aplastados, sellado deteriorado |
| 🔴 Profesional | Burletes faltantes en múltiples aberturas, filtración de agua |

## Procedimiento
1. Cerrar ventana/puerta y pasar la mano por el perímetro
2. Si se siente corriente de aire = burlete a reemplazar
3. Verificar sellado exterior con silicona
4. En DVH: buscar condensación entre vidrios (sello roto)`,

  'Inspección de marcos y premarcos': `## Qué buscar
- Estado de marcos de madera: hinchazón por humedad, podredumbre
- Marcos de aluminio: corrosión, oxidación blanca
- Marcos de hierro: óxido, descascaramiento de pintura
- Fijación al muro: que no se mueva al empujar

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Marcos firmes, sin deterioro, pintura íntegra |
| ⚠️ Atención | Pintura descascarada, oxidación superficial |
| 🔴 Profesional | Podredumbre en madera, marco suelto, óxido perforante |

## Procedimiento
1. Inspeccionar cada marco visualmente
2. Empujar suavemente: no debe moverse
3. En madera: buscar zonas blandas (pinchar con destornillador)
4. En hierro: buscar ampollas de óxido bajo la pintura`,

  'Control de vidrios y masillas': `## Qué buscar
- Rajaduras o fisuras en vidrios
- Estado de masilla o silicona de fijación
- Vidrios flojos (vibran con el viento)
- Vidrios de seguridad donde corresponda (puertas, mamparas)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Vidrios íntegros, masilla/silicona en buen estado |
| ⚠️ Atención | Masilla deteriorada, vidrio levemente flojo |
| 🔴 Profesional | Vidrio rajado, riesgo de caída de fragmentos |

## Procedimiento
1. Verificar cada vidrio visualmente
2. Presionar suavemente bordes: no debe haber juego
3. Verificar masilla: que no esté reseca ni faltante
4. En vidrios de seguridad: verificar sello de conformidad`,

  'Tratamiento de marcos de madera': `## Qué buscar
- Pintura o barniz descascarado
- Hinchazón por absorción de humedad
- Signos de ataque de insectos (polvo fino = termitas/carcoma)
- Podredumbre (madera blanda al presionar)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Protección íntegra, madera firme y seca |
| ⚠️ Atención | Barniz desgastado, requiere renovación |
| 🔴 Profesional | Podredumbre, ataque de insectos |

## Procedimiento
1. Verificar estado de pintura/barniz en todas las caras
2. Presionar con destornillador en zonas sospechosas
3. Buscar polvo fino al pie del marco (insectos xilófagos)
4. Si la madera está sana: lijar y aplicar protector/barniz`,

  'Mantenimiento de persianas de enrollar': `## Qué buscar
- Funcionamiento: sube y baja sin trabarse
- Estado de cintas o correas (desgaste, deshilachado)
- Cajón de persiana: no debe tener juego ni infiltraciones
- Tablillas: sin roturas ni deformación

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Funciona suavemente, cintas en buen estado |
| ⚠️ Atención | Cinta desgastada, funcionamiento con esfuerzo |
| 🔴 Profesional | Trabada, cinta rota, tablillas rotas |

## Procedimiento
1. Subir y bajar cada persiana completamente
2. Verificar estado de cinta/correa
3. Verificar sellado del cajón (evitar infiltración de aire)
4. Limpiar guías laterales con trapo húmedo`,

  'Control de mosquiteros': `## Qué buscar
- Estado de la tela (agujeros, desprendimiento del marco)
- Mecanismo de deslizamiento o fijación
- Oxidación del marco (en mosquiteros de aluminio)
- Tela tensada correctamente (sin bolsas)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tela íntegra, mecanismo funcional |
| ⚠️ Atención | Pequeños agujeros, tela floja |
| 🔴 Profesional | Tela rota/ausente, marco deformado |

## Procedimiento
1. Verificar tela en busca de agujeros o desprendimientos
2. Verificar deslizamiento en guías
3. Parches de emergencia con tela y adhesivo para agujeros pequeños`,

  'Inspección de rejas y protecciones metálicas': `## Qué buscar
- Óxido y corrosión (especialmente en base y soldaduras)
- Fijación al muro (que no se mueva al empujar)
- Pintura antióxido en buen estado
- Seguridad: que cumpla función de protección (sin puntos débiles)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin óxido, fijación firme, pintura íntegra |
| ⚠️ Atención | Óxido superficial, pintura descascarada |
| 🔴 Profesional | Óxido perforante, soldaduras rotas, reja suelta |

## Procedimiento
1. Verificar fijación: empujar y tirar con fuerza moderada
2. Buscar óxido en base (zona de contacto con muro/piso)
3. Verificar soldaduras: buscar fisuras o desprendimiento
4. Si hay óxido: limpiar con cepillo de alambre y pintar antióxido`,
};

// ─── INJECTION LOGIC ────────────────────────────────────
let content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
let added = 0;
let notFound = 0;

for (const [taskName, guide] of Object.entries(GUIDES)) {
  // Find the task name in the file
  const escapedName = taskName.replace(/[.*+?${}()|[\]\\]/g, '\\$&');
  const nameRegex = new RegExp(`name: '${escapedName}'`);
  const nameMatch = content.match(nameRegex);

  if (!nameMatch) {
    // Try with escaped apostrophes
    const altName = taskName.replace(/'/g, "\\'");
    const altEscaped = altName.replace(/[.*+?${}()|[\]\\]/g, '\\$&');
    const altRegex = new RegExp(`name: '${altEscaped}'`);
    if (!content.match(altRegex)) {
      console.log('NOT FOUND:', taskName);
      notFound++;
      continue;
    }
  }

  const nameIdx = content.search(nameRegex);
  if (nameIdx === -1) { notFound++; continue; }

  // Find defaultSector line after this name
  const afterName = content.substring(nameIdx, nameIdx + 2000);
  const sectorMatch = afterName.match(/(defaultSector: '[A-Z_]+',)/);
  if (!sectorMatch) { console.log('NO SECTOR:', taskName); continue; }

  const sectorStr = sectorMatch[1];
  const sectorIdx = content.indexOf(sectorStr, nameIdx);

  // Check if already has guide
  const nextChunk = content.substring(sectorIdx, sectorIdx + 100);
  if (nextChunk.includes('inspectionGuide:')) {
    console.log('SKIP (already has guide):', taskName);
    continue;
  }

  // Inject guide after defaultSector line
  const injection = '\n        inspectionGuide: `' + guide + '`,';
  content = content.substring(0, sectorIdx + sectorStr.length) + injection + content.substring(sectorIdx + sectorStr.length);
  added++;
  console.log('ADDED:', taskName);
}

fs.writeFileSync(TEMPLATE_PATH, content);
console.log(`\nDone: ${added} guides added, ${notFound} not found`);
