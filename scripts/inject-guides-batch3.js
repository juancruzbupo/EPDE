/**
 * Batch 3: Final 48 guides — Pisos, Mobiliario, GLP, Pozo, Solar, Domótica, Cielorraso, Rayos, Escaleras, Documentación + 1 Estructura
 * Run: node scripts/inject-guides-batch3.js
 */
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../packages/shared/src/seed/template-data.ts');

const GUIDES = {
  // ─── ESTRUCTURA (1 faltante) ──────────────────────────
  'Control de humedad ascendente en cimientos': `## Qué buscar
- Manchas de humedad en base de muros (hasta ~1m de altura)
- Eflorescencias blancas (sales cristalizadas por capilaridad)
- Pintura ampollada o revoque desprendido en zona baja
- Olor a humedad en ambientes a nivel de terreno
- Moho en zócalos y detrás de muebles pegados a muro

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas, muros secos en zona baja |
| ⚠️ Atención | Manchas leves, eflorescencias aisladas |
| 🔴 Profesional | Humedad en más de 2 muros, revoque desprendido extenso |

## Procedimiento
1. Recorrer base de todos los muros interiores con linterna
2. Medir altura de la mancha (>50cm = importante)
3. Verificar si el terreno exterior tiene pendiente hacia la casa
4. Buscar capa aisladora horizontal (debe existir a ~15cm del suelo)
5. Medir con hidrómetro de contacto si está disponible

## Normativa
- CIRSOC 200 — protección de fundaciones contra humedad
- INTI — patologías de humedad ascendente por capilaridad`,

  // ─── PISOS Y CONTRAPISOS ──────────────────────────────
  'Inspección general de pisos': `## Qué buscar
- Baldosas flojas (golpear: sonido hueco = despegada)
- Juntas deterioradas o faltantes
- Fisuras en contrapiso visible
- Desniveles (usar nivel de burbuja o bolita)
- En madera: tablas que crujan, signos de humedad, polvo fino (termitas)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Pisos nivelados, baldosas firmes, juntas completas |
| ⚠️ Atención | Baldosas flojas aisladas, juntas deterioradas |
| 🔴 Profesional | Desnivel progresivo, signos de termitas, contrapiso fisurado |

## Procedimiento
1. Recorrer todos los ambientes golpeando baldosas con nudillos
2. Sonido hueco = baldosa despegada del sustrato
3. Verificar nivelación con nivel de burbuja
4. En pisos de madera: buscar polvo fino al pie de zócalos

## Normativa
- Código de Edificación CABA — pisos y contrapisos`,

  'Verificación de contrapiso y nivelación': `## Qué buscar
- Desniveles visibles o perceptibles al caminar
- Fisuras en contrapiso (donde es visible: garaje, lavadero)
- Hundimientos localizados
- Humedad ascendente a través del contrapiso

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Superficie nivelada, sin fisuras, sin humedad |
| ⚠️ Atención | Fisura menor en contrapiso, desnivel leve |
| 🔴 Profesional | Hundimiento, desnivel >5mm en 2m, humedad generalizada |

## Procedimiento
1. Usar nivel de burbuja en diagonal del ambiente
2. Tolerancia normal: <3mm en 2 metros
3. Verificar en garaje y lavadero donde contrapiso es visible`,

  'Sellado de juntas de dilatación en pisos': `## Qué buscar
- Estado del material de sellado (silicona, poliuretano, masilla)
- Juntas abiertas o con material faltante
- Fisuras paralelas a las juntas (indica movimiento no absorbido)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Juntas selladas, material íntegro |
| ⚠️ Atención | Sellado parcialmente deteriorado |
| 🔴 Profesional | Juntas abiertas, movimiento visible entre paños |

## Procedimiento
1. Localizar juntas de dilatación en pisos
2. Verificar que el sellado esté íntegro y flexible
3. Si falta material: rellenar con sellador elástico`,

  'Tratamiento de pisos de madera o parquet': `## Qué buscar
- Desgaste del barniz o plastificado (zonas opacas, sin brillo)
- Tablas hinchadas por humedad
- Rayones profundos que exponen la madera
- Crujidos al caminar (tablas sueltas o subsuelo con juego)
- Polvo fino al pie de zócalos (insectos xilófagos)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Barniz íntegro, tablas firmes, sin crujidos |
| ⚠️ Atención | Desgaste de barniz en zonas de tránsito |
| 🔴 Profesional | Tablas hinchadas, polvo fino (termitas), crujidos extensos |

## Procedimiento
1. Verificar zonas de alto tránsito (pasillos, entrada)
2. Buscar tablas que se mueven al presionar
3. Buscar signos de humedad en bordes y encuentros con muros
4. Si hay desgaste: programar pulido y plastificado`,

  'Limpieza y sellado de pisos de piedra natural': `## Qué buscar
- Manchas penetrantes (aceite, vino, óxido)
- Porosidad excesiva (la piedra absorbe líquidos rápido)
- Eflorescencias (sales blancas que emergen)
- Fisuras o bordes astillados

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Piedra limpia, sellado vigente, sin manchas |
| ⚠️ Atención | Manchas leves, sellado desgastado |
| 🔴 Profesional | Fisuras, eflorescencias recurrentes |

## Procedimiento
1. Limpiar con producto neutro (NO ácidos en mármol/piedra caliza)
2. Verificar si la piedra absorbe agua rápido (gota de agua)
3. Si absorbe rápido: necesita sellado impermeabilizante
4. Aplicar sellador específico para el tipo de piedra`,

  // ─── MOBILIARIO Y EQUIPAMIENTO FIJO ───────────────────
  'Inspección de alacenas y bajo-mesadas': `## Qué buscar
- Bisagras de puertas: giro suave, sin juego excesivo
- Interior: humedad, moho, deformación por agua
- Estantes: firmeza, pandeo bajo peso
- Sellado con mesada: que no filtre agua al interior

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Puertas cierran bien, interior seco, estantes firmes |
| ⚠️ Atención | Bisagra floja, humedad leve en base |
| 🔴 Profesional | Base deformada por agua, moho interno |

## Procedimiento
1. Abrir todas las puertas y verificar bisagras
2. Verificar interior con linterna (buscar humedad en fondo)
3. En bajo-mesada: buscar goteos de cañería o grifería`,

  'Inspección de mesada y bacha': `## Qué buscar
- Sellado perimetral de mesada (silicona en unión con pared)
- Goteo debajo de la bacha (verificar sifón y conexiones)
- Estado de la superficie (fisuras en granito, hinchazón en melamina)
- Grifería: goteo, dureza, flexibles

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin goteos, sellado íntegro, superficie en buen estado |
| ⚠️ Atención | Sellado deteriorado, goteo leve en sifón |
| 🔴 Profesional | Melamina hinchada por agua, pérdida activa |

## Procedimiento
1. Verificar debajo de la bacha: buscar humedad o goteo
2. Abrir canilla y observar sifón: no debe gotear
3. Verificar sellado de silicona en perímetro de mesada`,

  'Limpieza de filtros de extractor de cocina': `## Qué buscar
- Filtros con grasa acumulada (reduce eficiencia de extracción)
- Motor con ruido anormal
- Ducto de salida obstruido

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Filtros limpios, extracción eficiente |
| ⚠️ Atención | Filtros con grasa visible, limpieza necesaria |
| 🔴 Profesional | Motor no funciona, ducto obstruido |

## Procedimiento
1. Retirar filtros metálicos del extractor
2. Sumergir en agua caliente con desengrasante 30 min
3. Cepillar y enjuagar
4. Dejar secar antes de reinstalar
5. Frecuencia: cada 2-3 meses con uso regular`,

  'Inspección de campana extractora': `## Qué buscar
- Funcionamiento del motor (velocidades, ruido)
- Estado del conducto de evacuación al exterior
- Iluminación integrada
- Acumulación de grasa en superficies internas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Motor funciona en todas las velocidades, sin grasa excesiva |
| ⚠️ Atención | Luz quemada, grasa acumulada, velocidad baja débil |
| 🔴 Profesional | Motor no funciona, conducto desconectado |

## Procedimiento
1. Encender en cada velocidad y verificar succión
2. Verificar que evacue al exterior (no recircule)
3. Limpiar superficie interna con desengrasante`,

  'Inspección de mueble de baño/vanitory': `## Qué buscar
- Humedad en interior y base (goteo de grifería o sifón)
- Estado de la superficie (hinchazón en melamina por agua)
- Bisagras y cajones: funcionamiento correcto
- Sellado de bacha con mesada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Interior seco, mueble firme, grifería sin goteo |
| ⚠️ Atención | Humedad leve en base, bisagra floja |
| 🔴 Profesional | Base deformada, goteo activo, mueble inestable |

## Procedimiento
1. Abrir puertas/cajones y verificar interior con linterna
2. Buscar marcas de agua en la base
3. Verificar conexiones de grifería (flexibles, sifón)`,

  'Control de mecanismo de descarga de inodoro': `## Qué buscar
- Que el depósito llene y corte correctamente
- Que la descarga sea completa y rápida
- Que no haya pérdida continua de agua (escurrimiento constante)
- Botón o palanca de descarga funcional

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Descarga completa, corte correcto, sin pérdida |
| ⚠️ Atención | Llenado lento, descarga débil |
| 🔴 Profesional | Pérdida continua (flotante no corta), mecanismo roto |

## Procedimiento
1. Descargar y observar: debe vaciar rápido y volver a llenar
2. Esperar llenado: el agua debe cortar (no seguir corriendo)
3. Verificar que no haya escurrimiento constante en taza`,

  'Verificación de fijación de sanitarios': `## Qué buscar
- Inodoro firme al sentarse (no debe moverse ni oscilar)
- Bidet firme (mismo criterio)
- Lavatorio firme (no debe moverse al apoyarse)
- Sellado en base de inodoro (silicona o masilla)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los sanitarios firmes, sin movimiento |
| ⚠️ Atención | Movimiento leve, sellado deteriorado |
| 🔴 Profesional | Sanitario suelto, riesgo de rotura de conexión |

## Procedimiento
1. Sentarse en el inodoro y verificar estabilidad
2. Empujar lateralmente cada sanitario: no debe moverse
3. Verificar sellado de silicona en base`,

  'Control de conexiones de lavarropas': `## Qué buscar
- Manguera de ingreso de agua: estado, conexión, pérdida
- Manguera de desagote: correctamente insertada, sin obstrucción
- Conexión eléctrica: enchufe con toma tierra
- Nivelación del equipo (patas regulables)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Conexiones firmes, sin pérdidas, nivelado |
| ⚠️ Atención | Manguera con desgaste, vibración excesiva |
| 🔴 Profesional | Pérdida en manguera, enchufe sin tierra, desagüe obstruido |

## Procedimiento
1. Verificar mangueras visualmente (buscar hinchazón o fisura)
2. Verificar que la llave de paso cierre correctamente
3. Verificar que la manguera de desagote esté bien sujeta`,

  'Control de termotanque eléctrico': `## Qué buscar
- Pérdidas de agua (goteo en base o conexiones)
- Funcionamiento: debe calentar agua a temperatura normal
- Estado de ánodo de sacrificio (si aplica, cada 2-3 años)
- Válvula de seguridad: debe gotear al sobrecalentar

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin pérdidas, agua caliente a temperatura normal |
| ⚠️ Atención | Demora excesiva en calentar, ánodo a revisar |
| 🔴 Profesional | Pérdida de agua, no calienta, válvula trabada |

## Procedimiento
1. Verificar exterior: buscar goteos o corrosión
2. Verificar que el agua caliente llegue correctamente
3. Levantar palanca de válvula de seguridad: debe gotear
4. Consultar edad del equipo (vida útil ~10 años)`,

  'Inspección de lavavajillas': `## Qué buscar
- Conexiones de agua y desagote sin pérdidas
- Funcionamiento: ciclo completo sin errores
- Interior: limpieza, estado de brazos aspersores, filtro
- Sello de puerta: que no gotee al funcionar

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin pérdidas, ciclo completo, interior limpio |
| ⚠️ Atención | Filtro sucio, olor interior |
| 🔴 Profesional | Pérdida de agua, no completa ciclo, error persistente |

## Procedimiento
1. Verificar conexiones debajo (acceder por bajo-mesada)
2. Correr un ciclo corto y verificar que no gotee
3. Limpiar filtro inferior periódicamente`,

  // ─── GAS ENVASADO (GLP) ───────────────────────────────
  'Inspección de regulador de presión de GLP': `## Qué buscar
- Estado general del regulador (corrosión, deformación)
- Fecha de fabricación (vida útil ~10 años)
- Conexión firme al tanque/tubo
- Membrana funcional (no debe haber olor a gas en el regulador)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Regulador en buen estado, sin olor a gas |
| ⚠️ Atención | Regulador con más de 8 años, corrosión leve |
| 🔴 Profesional | Olor a gas en regulador, membrana dañada |

## Importante
**Requiere gasista matriculado** para reemplazo.

## Normativa
- NAG-200 — instalaciones de GLP`,

  'Control de válvulas y conexiones flexibles GLP': `## Qué buscar
- Estado de flexibles: fecha de vencimiento (máx 2 años)
- Conexiones firmes sin pérdidas
- Válvulas de corte accesibles y funcionales
- Manguera sin fisuras, cortes ni deformaciones

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Flexibles vigentes, conexiones firmes, sin olor |
| ⚠️ Atención | Flexible próximo a vencer (<3 meses) |
| 🔴 Profesional URGENTE | Flexible vencido, olor a gas, manguera deteriorada |

## Procedimiento
1. Verificar fecha estampada en cada flexible
2. Verificar que no estén retorcidos ni aplastados
3. Oler alrededor de cada conexión

## Normativa
- NAG-200 — flexibles de conexión para GLP`,

  'Verificación de ubicación y ventilación del tanque GLP': `## Qué buscar
- Ubicación: exterior, ventilado, alejado de fuentes de calor
- Distancia mínima de aberturas, desagües, sótanos
- Tanque nivelado y protegido del sol directo
- Ventilación del recinto (si está en gabinete)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Ubicación correcta, ventilado, protegido |
| ⚠️ Atención | Exposición solar directa, vegetación cercana |
| 🔴 Profesional | Cerca de fuente de calor, sin ventilación, en sótano |

## PELIGRO
El GLP es más pesado que el aire — se acumula en zonas bajas. NUNCA almacenar en sótano.

## Normativa
- NAG-200 — ubicación de tanques de GLP`,

  'Prueba de hermeticidad de instalación GLP': `## Qué buscar
- Fugas en toda la instalación: regulador, flexibles, llaves, artefactos
- Prueba con agua jabonosa o manómetro

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin fugas detectadas |
| ⚠️ Atención | No se realizó la prueba recientemente |
| 🔴 Profesional URGENTE | Fuga detectada (burbujas en agua jabonosa) |

## Importante
**Requiere gasista matriculado** para prueba con manómetro.
Prueba casera con agua jabonosa: aplicar en uniones y buscar burbujas.

## Normativa
- NAG-200 — prueba de hermeticidad obligatoria
- NAG-226 — revisión periódica`,

  // ─── AGUA DE POZO ─────────────────────────────────────
  'Análisis fisicoquímico y bacteriológico de agua': `## Qué buscar
- Fecha del último análisis (recomendado anual)
- Resultados dentro de parámetros de potabilidad
- Color, olor o sabor inusual del agua

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Análisis vigente, parámetros dentro de norma |
| ⚠️ Atención | Análisis vencido (>1 año) |
| 🔴 Profesional | Parámetros fuera de norma, agua con color/olor |

## Importante
**Requiere laboratorio habilitado** para el análisis. Tomar muestra según protocolo del laboratorio.

## Normativa
- Código Alimentario Argentino — agua de consumo humano
- ENRESS — calidad de agua`,

  'Service de bomba sumergible': `## Qué buscar
- Funcionamiento: presión y caudal normales
- Ruidos anormales (vibración, golpeteo)
- Consumo eléctrico (disyuntor que salta = problema)
- Arena o sedimento en el agua bombeada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Presión normal, agua limpia, sin ruidos |
| ⚠️ Atención | Presión reducida, sedimento leve |
| 🔴 Profesional | No bombea, ruido fuerte, arena en agua |

## Importante
**Requiere profesional especializado** para extracción y service de bomba sumergible.`,

  'Control de brocal y sellado de perforación': `## Qué buscar
- Brocal (tapa del pozo): sellado, sin fisuras, seguro
- Que no ingresen contaminantes al pozo (agua superficial, insectos)
- Estado del revestimiento superior de la perforación
- Distancia de fuentes de contaminación (cámara séptica >15m)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Brocal sellado, sin fisuras, alejado de contaminantes |
| ⚠️ Atención | Sellado deteriorado |
| 🔴 Profesional | Brocal roto, agua superficial ingresa al pozo |

## Normativa
- Código de Edificación — perforaciones para agua
- Distancia mínima a cámara séptica: 15 metros`,

  'Mantenimiento de equipo de tratamiento de agua': `## Qué buscar
- Estado de filtros (carbón activado, sedimentos): fecha de cambio
- Funcionamiento de ablandador (si existe): nivel de sal
- UV o clorinador: lámpara/dosificador funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Filtros vigentes, equipo funcionando correctamente |
| ⚠️ Atención | Filtros próximos a vencer |
| 🔴 Profesional | Equipo no funciona, agua con color/olor a pesar del tratamiento |

## Procedimiento
1. Verificar fecha de último cambio de filtros
2. Cambiar según recomendación del fabricante (generalmente 6-12 meses)
3. Si tiene ablandador: verificar nivel de sal`,

  // ─── ENERGÍA SOLAR Y SUSTENTABLE ──────────────────────
  'Limpieza de paneles solares fotovoltaicos': `## Qué buscar
- Suciedad acumulada (polvo, hojas, excremento de pájaros)
- Sombras nuevas sobre los paneles (árboles crecidos)
- Vidrio del panel: fisuras, puntos calientes (hotspots)
- Estructura de soporte: corrosión, tornillos flojos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Paneles limpios, sin sombras, estructura firme |
| ⚠️ Atención | Suciedad visible, sombra parcial |
| 🔴 Profesional | Vidrio fisurado, hotspot visible, estructura dañada |

## Procedimiento
1. Limpiar con agua y esponja suave (NO detergente abrasivo)
2. Preferir limpieza temprano a la mañana (panel frío)
3. Verificar producción después de limpiar (debe mejorar)
4. NO pisar los paneles`,

  'Inspección de sistema fotovoltaico completo': `## Qué buscar
- Producción de energía (comparar con meses anteriores)
- Inversor: indicadores LED, mensajes de error
- Cables y conectores: estado de aislación, fijación
- Tablero de protecciones DC/AC

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Producción normal, inversor sin errores |
| ⚠️ Atención | Producción reducida, alerta en inversor |
| 🔴 Profesional | Inversor apagado, producción nula, cable dañado |

## Importante
**Requiere técnico especializado en energía solar** para diagnóstico eléctrico del sistema.`,

  'Control de termotanque solar': `## Qué buscar
- Colector: vidrio íntegro, sin fisuras, tubos sin condensación interna
- Tanque acumulador: sin pérdidas, aislación íntegra
- Cañerías: aislación térmica en buen estado
- Válvula de seguridad y antiretorno

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sistema funcional, agua caliente por solar, sin pérdidas |
| ⚠️ Atención | Aislación deteriorada, eficiencia reducida |
| 🔴 Profesional | Vidrio del colector roto, pérdida de agua, no calienta |

## Procedimiento
1. Verificar temperatura del agua solar (sin resistencia eléctrica)
2. Inspeccionar colector desde abajo: buscar fisuras en vidrio
3. Verificar aislación de cañerías (no debe estar húmeda)`,

  'Verificación de sistema de recolección de agua de lluvia': `## Qué buscar
- Filtro de hojas/sedimentos: estado y limpieza
- Tanque de almacenamiento: tapa, limpieza, nivel
- Bomba de distribución: funcionamiento
- Calidad del agua almacenada (para uso no potable)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Filtros limpios, tanque sellado, bomba funcional |
| ⚠️ Atención | Filtro sucio, tanque con sedimento |
| 🔴 Profesional | Sistema contaminado, bomba dañada |

## Procedimiento
1. Limpiar filtro de ingreso
2. Verificar nivel del tanque
3. Verificar que el agua almacenada no tenga olor ni color
4. Recordar: esta agua NO es potable (uso en riego/limpieza)`,

  'Inspección de sistema de reciclado de aguas grises': `## Qué buscar
- Funcionamiento del sistema de filtrado/tratamiento
- Estado de bombas y válvulas
- Calidad del agua tratada (olor, color)
- Separación correcta de aguas grises y negras

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sistema funcional, agua tratada sin olor |
| ⚠️ Atención | Eficiencia reducida, mantenimiento necesario |
| 🔴 Profesional | Sistema detenido, olor fuerte, contaminación cruzada |

## Importante
**Requiere profesional especializado** para mantenimiento y verificación de calidad.`,

  // ─── DOMÓTICA Y ELECTRÓNICA ───────────────────────────
  'Control de sistema de alarma': `## Qué buscar
- Sirena: debe sonar al activar en modo test
- Sensores de movimiento: verificar cobertura
- Contactos magnéticos en puertas/ventanas
- Comunicación con central de monitoreo (si tiene)
- Batería de respaldo: estado y autonomía

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los sensores funcionan, sirena suena, comunicación OK |
| ⚠️ Atención | Batería baja, 1 sensor sin respuesta |
| 🔴 Profesional | Sistema no arma, sin comunicación, múltiples fallas |

## Procedimiento
1. Activar modo TEST (consultar manual del panel)
2. Caminar frente a cada sensor: debe detectar
3. Abrir puertas/ventanas con contacto magnético: debe alertar
4. Verificar fecha de última batería (reemplazo cada 2-3 años)`,

  'Inspección de cámaras de seguridad': `## Qué buscar
- Imagen clara en cada cámara (enfoque, nitidez)
- Visión nocturna: verificar de noche
- Grabador (DVR/NVR): espacio de disco, grabación continua
- Cableado: estado de cables y conectores
- Ángulo de cobertura: que no haya puntos ciegos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todas las cámaras con imagen clara, grabación funcionando |
| ⚠️ Atención | 1 cámara desenfocada, disco casi lleno |
| 🔴 Profesional | Cámara sin imagen, grabador no funciona |

## Procedimiento
1. Verificar cada cámara desde el monitor/app
2. Verificar visión nocturna (LEDs infrarrojos)
3. Verificar grabación: reproducir video del día anterior
4. Limpiar lente si está sucia`,

  'Mantenimiento de portero eléctrico o videoportero': `## Qué buscar
- Audio: se escucha claramente desde adentro y afuera
- Video (si tiene): imagen clara, sin interferencia
- Apertura eléctrica de puerta: funcional
- Timbre: funcional en todos los puntos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Audio claro, video nítido, apertura funcional |
| ⚠️ Atención | Audio con ruido, imagen borrosa |
| 🔴 Profesional | Sin audio, sin video, apertura no funciona |

## Procedimiento
1. Probar desde la puerta de calle: llamar y hablar
2. Verificar que se escuche adentro con claridad
3. Probar apertura eléctrica desde cada punto interno
4. Si tiene cámara: verificar imagen en monitor`,

  'Control de automatización del hogar': `## Qué buscar
- Funcionamiento de dispositivos inteligentes (luces, enchufes, termostato)
- Conectividad WiFi en todos los puntos
- Programaciones y escenas: que ejecuten correctamente
- Hub/controlador central: funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los dispositivos responden, programaciones activas |
| ⚠️ Atención | 1-2 dispositivos desconectados, WiFi débil en algún punto |
| 🔴 Profesional | Hub caído, múltiples dispositivos sin respuesta |

## Procedimiento
1. Verificar cada dispositivo desde la app de control
2. Ejecutar una escena/programación y verificar respuesta
3. Verificar señal WiFi en puntos remotos de la casa`,

  // ─── CIELORRASO Y ENTREPISOS ──────────────────────────
  'Inspección de cielorraso suspendido (durlock/yeso)': `## Qué buscar
- Fisuras en juntas entre placas
- Manchas de humedad (filtración desde piso superior o techo)
- Hundimientos o deformaciones
- Tornillos visibles (defecto de terminación)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Superficie uniforme, sin fisuras ni manchas |
| ⚠️ Atención | Fisuras capilares en juntas, mancha seca |
| 🔴 Profesional | Hundimiento, mancha activa, placa suelta |

## Procedimiento
1. Inspeccionar con buena iluminación rasante (ángulo bajo)
2. Buscar fisuras en uniones de placas
3. Buscar manchas amarillentas (indican humedad)`,

  'Control de cielorraso de machimbre': `## Qué buscar
- Tablas combadas o desprendidas
- Signos de humedad: manchas, hinchazón
- Insectos xilófagos: polvo fino en el piso debajo
- Estado del barniz o pintura

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tablas firmes, sin deformación, protección vigente |
| ⚠️ Atención | Barniz desgastado, 1-2 tablas con movimiento |
| 🔴 Profesional | Polvo de insectos, tablas desprendidas, humedad |

## Procedimiento
1. Inspeccionar visualmente toda la superficie
2. Buscar polvo fino al pie de paredes (insectos)
3. Verificar estado de protección (barniz/lasur)`,

  'Inspección de entretecho': `## Qué buscar
- Filtraciones: manchas de agua, goteo activo
- Aislación térmica: estado del material aislante
- Estructura de techo: vigas, cabriadas, correas
- Presencia de animales: pájaros, murciélagos, roedores
- Cableado eléctrico: estado de aislación

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Seco, aislación íntegra, estructura firme |
| ⚠️ Atención | Aislación desplazada, suciedad de animales |
| 🔴 Profesional | Filtración activa, estructura dañada, plaga |

## Procedimiento
1. Acceder con precaución (escalera segura, linterna)
2. Verificar: pisar solo sobre vigas, NO sobre cielorraso
3. Buscar manchas de agua en estructura de madera
4. Verificar estado de aislación térmica`,

  'Control de entrepiso de madera': `## Qué buscar
- Crujidos al caminar (tablas sueltas, vigas con juego)
- Vibraciones excesivas (viga subdimensionada)
- Signos de humedad en cara inferior
- Flechas (hundimiento visible en centro del vano)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Firme, sin crujidos excesivos, sin vibración |
| ⚠️ Atención | Crujidos en zonas puntuales |
| 🔴 Profesional | Vibración excesiva, flecha visible, humedad |

## Normativa
- CIRSOC 601 — estructuras de madera`,

  // ─── PROTECCIÓN CONTRA RAYOS ──────────────────────────
  'Inspección de pararrayos': `## Qué buscar
- Punta captora: estado, verticalidad, corrosión
- Cable bajada: continuidad, fijación al muro, aislación
- Conexión a tierra: estado de la jabalina
- Medición de resistencia de PAT del pararrayos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sistema completo, PAT <10 ohms, sin corrosión |
| ⚠️ Atención | Corrosión leve en cable, PAT entre 10-20 ohms |
| 🔴 Profesional | Cable cortado, jabalina ausente, PAT >20 ohms |

## Importante
**Requiere profesional matriculado** para medición y mantenimiento.

## Normativa
- IRAM 2184 — protección contra descargas atmosféricas`,

  'Control post-tormenta eléctrica': `## Qué buscar
- Funcionamiento de artefactos electrónicos
- Estado del disyuntor diferencial (pudo haber disparado)
- Protección contra sobretensiones (DPS): indicador
- Daños visibles en instalaciones exteriores

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los equipos funcionan, sin daños |
| ⚠️ Atención | DPS disparado (reemplazar), 1 equipo dañado |
| 🔴 Profesional | Múltiples equipos dañados, olor a quemado en tablero |

## Procedimiento
1. Verificar tablero: ¿saltó alguna protección?
2. Verificar equipos electrónicos sensibles
3. Verificar indicador de DPS (si tiene)`,

  'Verificación de equipotencialización': `## Qué buscar
- Todas las masas metálicas conectadas al sistema de tierra
- Continuidad de las conexiones de equipotencialización
- En baño: barra equipotencial conectando caños, marcos, rejillas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todas las masas conectadas, continuidad verificada |
| ⚠️ Atención | Conexión floja o corroída |
| 🔴 Profesional | Masas metálicas sin conexión a tierra |

## Importante
**Requiere electricista matriculado** para verificación con instrumental.

## Normativa
- AEA 90364 — equipotencialización en viviendas
- IRAM 2281 — sistemas de puesta a tierra`,

  // ─── ESCALERAS Y BARANDAS ─────────────────────────────
  'Inspección de escalera interior y exterior': `## Qué buscar
- Estado de escalones: fisuras, desgaste, faltantes
- Antideslizante: presencia en narices de escalón
- Nivelación: escalones uniformes (desnivel genera tropiezos)
- Iluminación adecuada en todo el recorrido

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Escalones firmes, antideslizante, bien iluminada |
| ⚠️ Atención | Desgaste en nariz, iluminación insuficiente |
| 🔴 Profesional | Escalón roto, desnivel peligroso, sin baranda |

## Normativa
- Código de Edificación CABA — escaleras y medios de escape`,

  'Control de barandas y pasamanos': `## Qué buscar
- Altura mínima: 90cm en interior, 100cm en exterior/terraza
- Firmeza: no debe moverse al empujar o apoyarse
- Distancia entre barrotes: <12cm (seguridad infantil)
- Material: estado de pintura, óxido, madera podrida

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Firme, altura correcta, barrotes seguros |
| ⚠️ Atención | Óxido superficial, pintura descascarada |
| 🔴 Profesional | Baranda suelta, altura insuficiente, barrotes faltantes |

## Procedimiento
1. Empujar con fuerza moderada: no debe ceder
2. Medir altura (90cm interior, 100cm exterior)
3. Verificar distancia entre barrotes (brazo de niño no debe pasar)

## Normativa
- Código de Edificación CABA — barandas y protecciones`,

  'Mantenimiento de escalera de acceso a terraza': `## Qué buscar
- Estado de la escalera (fija, marinera, o rebatible)
- Fijación al muro o estructura
- Peldaños firmes y antideslizantes
- Baranda o protección lateral

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Escalera firme, peldaños seguros, con baranda |
| ⚠️ Atención | Óxido en fijaciones, peldaño flojo |
| 🔴 Profesional | Escalera inestable, peldaño roto, sin protección |

## Procedimiento
1. Verificar fijación a la pared/estructura
2. Subir con precaución verificando cada peldaño
3. Verificar baranda o pasamanos`,

  // ─── DOCUMENTACIÓN Y NORMATIVA ────────────────────────
  'Renovación de certificado de gas (oblea)': `## Qué buscar
- Fecha de vencimiento de la oblea actual
- Oblea visible y legible en lugar accesible
- Gasista matriculado para la revisión

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Oblea vigente |
| ⚠️ Atención | Oblea vence en menos de 3 meses |
| 🔴 Profesional | Oblea vencida o ausente |

## Importante
**Obligatoria cada 3 años** para vivienda unifamiliar. Solo gasista matriculado ENARGAS.

## Normativa
- NAG-226 (ENARGAS) — revisión periódica obligatoria`,

  'Actualización de planos de instalaciones': `## Qué buscar
- Existencia de planos de instalaciones (eléctrica, gas, sanitaria)
- Que reflejen las modificaciones realizadas
- Accesibilidad para consulta en caso de emergencia

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Planos existentes y actualizados |
| ⚠️ Atención | Planos desactualizados (modificaciones no registradas) |
| 🔴 Profesional | Sin planos de ninguna instalación |

## Nota
Los planos facilitan el diagnóstico y la reparación. Solicitar al profesional que realice cualquier modificación que entregue plano actualizado.`,

  'Revisión de póliza de seguro del hogar': `## Qué buscar
- Vigencia de la póliza
- Cobertura: qué riesgos incluye (incendio, robo, daño por agua, RC)
- Suma asegurada: que cubra el valor real de reconstrucción
- Exclusiones: qué NO cubre

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Póliza vigente, cobertura adecuada |
| ⚠️ Atención | Suma asegurada desactualizada |
| 🔴 Profesional | Sin seguro, póliza vencida |

## Nota
Revisar anualmente y actualizar suma asegurada según inflación.`,

  'Verificación de habilitación municipal': `## Qué buscar
- Final de obra o habilitación del inmueble
- Habilitaciones especiales (pileta, GLP, comercio si aplica)
- Plano de mensura actualizado
- Catastro al día

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Documentación completa y al día |
| ⚠️ Atención | Ampliaciones sin declarar |
| 🔴 Profesional | Sin final de obra, construcción sin habilitación |

## Nota
Las ampliaciones no declaradas pueden generar multas y problemas en la venta del inmueble.`,

  'Archivo de comprobantes de mantenimiento': `## Qué buscar
- Comprobantes de service de artefactos (gas, eléctrica)
- Certificados de revisión (oblea de gas, fumigaciones)
- Facturas de reparaciones importantes
- Garantías vigentes de equipos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Archivo organizado con todos los comprobantes |
| ⚠️ Atención | Comprobantes sueltos, sin orden |
| 🔴 Profesional | Sin comprobantes de servicios obligatorios |

## Nota
Mantener un archivo (físico o digital) con todos los comprobantes de mantenimiento. Sirve como respaldo para seguro, venta del inmueble, y seguimiento de garantías.`,
};

// ─── INJECTION LOGIC ────────────────────────────────────
let content = fs.readFileSync(TEMPLATE_PATH, 'utf8');
let added = 0;
let notFound = 0;

for (const [taskName, guide] of Object.entries(GUIDES)) {
  const escapedName = taskName.replace(/[.*+?${}()|[\]\\]/g, '\\$&');
  const nameRegex = new RegExp(`name: '${escapedName}'`);
  const nameIdx = content.search(nameRegex);

  if (nameIdx === -1) {
    console.log('NOT FOUND:', taskName);
    notFound++;
    continue;
  }

  const afterName = content.substring(nameIdx, nameIdx + 2000);
  const sectorMatch = afterName.match(/(defaultSector: '[A-Z_]+',)/);
  if (!sectorMatch) { console.log('NO SECTOR:', taskName); continue; }

  const sectorStr = sectorMatch[1];
  const sectorIdx = content.indexOf(sectorStr, nameIdx);

  const nextChunk = content.substring(sectorIdx, sectorIdx + 100);
  if (nextChunk.includes('inspectionGuide:')) {
    console.log('SKIP (already has guide):', taskName);
    continue;
  }

  const injection = '\n        inspectionGuide: `' + guide + '`,';
  content = content.substring(0, sectorIdx + sectorStr.length) + injection + content.substring(sectorIdx + sectorStr.length);
  added++;
  console.log('ADDED:', taskName);
}

fs.writeFileSync(TEMPLATE_PATH, content);
console.log(`\nDone: ${added} guides added, ${notFound} not found`);
