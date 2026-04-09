/**
 * Batch 2: Guides for Pintura, Jardín, Climatización, Humedad, Incendio, Plagas
 * Run: node scripts/inject-guides-batch2.js
 */
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../packages/shared/src/seed/template-data.ts');

const GUIDES = {
  // ─── PINTURA Y REVESTIMIENTOS ─────────────────────────
  'Inspección de pintura exterior': `## Qué buscar
- Descascaramiento, ampollas, decoloración
- Manchas de humedad que atraviesan la pintura
- Eflorescencias (depósitos blancos de sales)
- Moho o verdín (especialmente en zonas con sombra)
- Chalking (la pintura se vuelve polvorienta al tocar)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Pintura firme, color uniforme, sin descascaramiento |
| ⚠️ Atención | Descascaramiento localizado, decoloración leve |
| 🔴 Profesional | Descascaramiento extenso, humedad que atraviesa muro |

## Procedimiento
1. Recorrer todas las fachadas y muros exteriores
2. Verificar zonas bajas (salpicaduras de agua)
3. Verificar zonas con sombra permanente (moho)
4. Pasar la mano: si queda polvo blanco = chalking (repintar)
5. Fotografiar áreas afectadas

## Normativa
- Código de Edificación CABA — mantenimiento de fachadas
- Vida útil pintura exterior: 5 años (según exposición)`,

  'Control de humedad en muros interiores': `## Qué buscar
- Manchas oscuras en paredes y techos
- Pintura ampollada o descascarada
- Olor a humedad persistente
- Moho visible (especialmente en esquinas y detrás de muebles)
- Condensación en ventanas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas, sin olor, sin condensación excesiva |
| ⚠️ Atención | Manchas pequeñas, condensación en ventanas |
| 🔴 Profesional | Moho extenso, humedad que no seca, olor persistente |

## Procedimiento
1. Inspeccionar esquinas superiores de cada ambiente
2. Mover muebles alejados de la pared y buscar detrás
3. Verificar baños y cocina: zonas más propensas
4. Buscar puente térmico en columnas y vigas (condensación)

## Normativa
- Código de Edificación CABA — condiciones de habitabilidad`,

  'Tratamiento anti-humedad': `## Qué buscar
- Efectividad del tratamiento existente (si fue aplicado)
- Zonas donde la humedad reaparece después del tratamiento
- Estado de la capa aisladora horizontal
- Necesidad de tratamiento nuevo

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin recurrencia de humedad, tratamiento vigente |
| ⚠️ Atención | Humedad leve recurrente en zonas tratadas |
| 🔴 Profesional | Tratamiento fallido, humedad generalizada |

## Nota
Se recomienda profesional especializado en patologías de humedad para diagnóstico y tratamiento.`,

  'Inspección de revestimientos cerámicos': `## Qué buscar
- Baldosas flojas o desprendidas (golpear: sonido hueco)
- Juntas deterioradas, faltantes o con moho
- Fisuras en cerámicos
- Manchas de humedad detrás de revestimientos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cerámicos firmes, juntas completas, sin fisuras |
| ⚠️ Atención | Juntas deterioradas, 1-2 baldosas flojas |
| 🔴 Profesional | Múltiples baldosas desprendidas, humedad detrás |

## Procedimiento
1. Golpear suavemente cada cerámico con nudillos
2. Sonido hueco = cerámico despegado del sustrato
3. Verificar juntas: buscar faltantes o con moho negro
4. En baño/cocina: verificar sellado de silicona en perímetro`,

  'Sellado de juntas en áreas húmedas': `## Qué buscar
- Estado de silicona en unión pared-mesada, pared-bañera, pared-ducha
- Moho negro en juntas de silicona
- Silicona despegada o agrietada
- Filtración de agua detrás de revestimientos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Silicona íntegra, sin moho, adherida |
| ⚠️ Atención | Moho superficial, silicona con grietas menores |
| 🔴 Profesional | Silicona despegada, filtración activa |

## Procedimiento
1. Verificar todas las juntas de silicona en baño y cocina
2. Tirar suavemente del borde: no debe despegarse
3. Si hay moho: limpiar con lavandina diluida
4. Si está agrietada: retirar y rehacer con silicona sanitaria`,

  'Repintado de fachada exterior': `## Qué buscar
- Necesidad de repintado (pintura desgastada, descascarada)
- Reparación previa de revoques dañados
- Estado de la superficie base (preparación necesaria)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Pintura en buen estado, sin necesidad de repintado |
| ⚠️ Atención | Desgaste visible, programar repintado |
| 🔴 Profesional | Descascaramiento extenso + daño en revoque |

## Nota
Se recomienda profesional para trabajos en altura. Frecuencia: cada 5 años según exposición y tipo de pintura.

## Normativa
- Código de Edificación CABA — mantenimiento de fachadas`,

  'Tratamiento de capa aisladora horizontal': `## Qué buscar
- Presencia de capa aisladora (barrera contra humedad ascendente)
- Efectividad: no debe haber humedad por encima de la capa
- Fisuras o discontinuidades en la capa

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin humedad ascendente, capa aisladora funcional |
| ⚠️ Atención | Humedad leve en base de muros |
| 🔴 Profesional | Humedad generalizada, capa aisladora ausente o dañada |

## Importante
**Requiere profesional** para diagnóstico y reparación de capa aisladora.`,

  'Inspección de revoques interiores': `## Qué buscar
- Fisuras en revoques (mapa de fisuras)
- Zonas huecas (golpear con nudillos)
- Humedad, eflorescencias, descascaramiento
- Desprendimiento de material

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Revoque firme, sin fisuras ni zonas huecas |
| ⚠️ Atención | Fisuras capilares, descascaramiento leve |
| 🔴 Profesional | Zonas huecas extensas, desprendimiento activo |

## Procedimiento
1. Golpear superficies con nudillos (sonido hueco = desprendido)
2. Verificar esquinas y uniones muro-techo
3. Buscar manchas de humedad en zonas bajas`,

  // ─── JARDÍN Y EXTERIORES ──────────────────────────────
  'Inspección de veredas y senderos': `## Qué buscar
- Baldosas flojas, rotas o faltantes
- Desniveles que generen riesgo de tropiezos
- Grietas en contrapiso
- Pendiente hacia la vivienda (debe ser al revés)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Superficie nivelada, sin baldosas flojas, pendiente correcta |
| ⚠️ Atención | 1-2 baldosas flojas, grieta menor |
| 🔴 Profesional | Desnivel peligroso, pendiente hacia la casa, hundimiento |

## Procedimiento
1. Recorrer todos los senderos verificando estabilidad
2. Verificar pendiente: el agua debe escurrir HACIA AFUERA de la casa
3. Buscar raíces de árboles que levanten baldosas`,

  'Control de medianeras y cercos': `## Qué buscar
- Fisuras o inclinación en medianeras
- Estado de cercos perimetrales (madera, alambre, hierro)
- Humedad o eflorescencias en muros medianeros
- Vegetación invasiva desde terrenos linderos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muro aplomado, cerco firme, sin fisuras |
| ⚠️ Atención | Fisuras leves, cerco con postes flojos |
| 🔴 Profesional | Muro inclinado, riesgo de derrumbe |

## Normativa
- Código Civil argentino — medianeras y límites de propiedad
- Municipalidad local — distancias de árboles a medianeras`,

  'Limpieza de desagües exteriores': `## Qué buscar
- Rejillas de piso obstruidas (hojas, tierra)
- Bocas de tormenta tapadas
- Agua estancada en patios o jardín
- Pendiente correcta hacia los desagües

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Desagües libres, sin agua estancada |
| ⚠️ Atención | Rejillas sucias, limpieza necesaria |
| 🔴 Profesional | Desagüe obstruido internamente, agua ingresa a la casa |

## Procedimiento
1. Limpiar rejillas de piso exteriores
2. Verter agua y verificar velocidad de desagote
3. Si el agua no baja: posible obstrucción en cañería`,

  'Control de pileta de natación': `## Qué buscar
- Estado del agua (claridad, pH, cloro)
- Revestimiento (fisuras, desprendimiento de venecitas)
- Equipos: bomba, filtro, clorinador
- Borde perimetral y deck (seguridad antideslizante)
- Cerco de seguridad (obligatorio si hay niños)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Agua clara, equipos funcionando, revestimiento íntegro |
| ⚠️ Atención | Agua turbia, filtro sucio, fisura leve en borde |
| 🔴 Profesional | Pérdida de agua (nivel baja), venecitas desprendidas, bomba rota |

## Normativa
- Ordenanza municipal — cerco de seguridad obligatorio
- Decreto 3181/2007 (PBA) — piletas de natación`,

  'Poda de árboles cercanos a la estructura': `## Qué buscar
- Ramas en contacto con techos, cables o canaletas
- Raíces que levantan veredas o afectan cimientos
- Árboles inclinados hacia la vivienda
- Ramas secas que puedan caer

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Árboles sin contacto con estructura, raíces contenidas |
| ⚠️ Atención | Ramas próximas a cables o techos |
| 🔴 Profesional | Árbol inclinado, raíces dañando cimientos |

## Importante
La poda de árboles en vereda requiere autorización municipal. NO podar sin consultar.

## Normativa
- Ley 12276 (PBA) — arbolado público
- Código Civil — distancias de árboles a medianeras`,

  'Mantenimiento de parrilla y quincho': `## Qué buscar
- Estado del hogar (fisuras en ladrillos refractarios)
- Conducto de humos (tiraje correcto)
- Mesada y superficies de trabajo
- Estructura del quincho (columnas, techo)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Hogar íntegro, buen tiraje, estructura firme |
| ⚠️ Atención | Ladrillos fisurados, tiraje lento |
| 🔴 Profesional | Conducto obstruido, estructura comprometida |

## Procedimiento
1. Encender fuego pequeño y verificar tiraje
2. Inspeccionar ladrillos refractarios (fisuras profundas = reemplazar)
3. Verificar estructura del quincho (columnas, vigas, techo)`,

  'Control de cochera y garaje': `## Qué buscar
- Estado del portón (mecanismo, guías, motor si es automático)
- Piso (fisuras, manchas de aceite, nivelación)
- Instalación eléctrica (iluminación, tomacorrientes)
- Desagüe de piso

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Portón funcional, piso en buen estado, iluminación correcta |
| ⚠️ Atención | Portón con esfuerzo, piso fisurado |
| 🔴 Profesional | Portón trabado, motor quemado, instalación eléctrica deteriorada |

## Procedimiento
1. Abrir y cerrar portón: verificar movimiento suave
2. Lubricar guías y bisagras
3. Verificar sensor de seguridad (portón automático)`,

  'Inspección de pérgola, semi-cubierta o deck': `## Qué buscar
- Estado de la madera (podredumbre, insectos, astillado)
- Fijaciones y anclajes (tornillos, bulones)
- Protección (barniz, aceite, pintura)
- Estabilidad de la estructura

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Madera firme, protección vigente, fijaciones sólidas |
| ⚠️ Atención | Protección desgastada, requiere mantenimiento |
| 🔴 Profesional | Podredumbre, estructura inestable, insectos |

## Procedimiento
1. Verificar estabilidad empujando lateralmente
2. Buscar zonas blandas en madera (presionar con destornillador)
3. Buscar polvo fino al pie (indicio de insectos xilófagos)
4. Verificar fecha de último tratamiento protector`,

  'Mantenimiento de sistema de riego': `## Qué buscar
- Aspersores obstruidos o rotos
- Fugas en conexiones y tuberías
- Programador/timer funcionando correctamente
- Distribución uniforme del agua

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los aspersores funcionan, sin fugas |
| ⚠️ Atención | 1-2 aspersores obstruidos, programador descalibrado |
| 🔴 Profesional | Tubería rota enterrada, múltiples fugas |

## Procedimiento
1. Activar cada zona del riego manualmente
2. Verificar que todos los aspersores funcionen
3. Buscar zonas húmedas inesperadas (tubería rota)`,

  'Inspección de cerco perimetral y portones': `## Qué buscar
- Estado de postes (inclinación, podredumbre en madera)
- Alambrado o tejido: tensión correcta, sin roturas
- Portones: bisagras, cerradura, cierre automático
- Oxidación en componentes metálicos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cerco firme, portones funcionales, sin óxido |
| ⚠️ Atención | Óxido superficial, tensión floja en alambrado |
| 🔴 Profesional | Postes inclinados, cerco caído, portón descolgado |

## Procedimiento
1. Recorrer todo el perímetro
2. Verificar tensión del alambrado
3. Abrir/cerrar cada portón
4. Buscar óxido en base de postes metálicos`,

  'Control de tanque cisterna enterrado': `## Qué buscar
- Tapa de inspección accesible y sellada
- Nivel de agua correcto
- Estado interior (fisuras, contaminación)
- Bomba de elevación funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tapa sellada, nivel correcto, bomba funcional |
| ⚠️ Atención | Tapa deteriorada, nivel bajo |
| 🔴 Profesional | Fisura en cisterna, contaminación, bomba dañada |

## Procedimiento
1. Verificar accesibilidad de la tapa
2. Abrir y verificar nivel y aspecto del agua
3. Activar bomba de elevación
4. Limpieza anual recomendada

## Normativa
- ENRESS — mantenimiento de tanques (aplica también a cisternas)`,

  'Inspección de muro de contención': `## Qué buscar
- Fisuras o desplazamiento del muro
- Inclinación (pandeo hacia afuera)
- Drenaje detrás del muro (barbacanas funcionando)
- Erosión del suelo en la base

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muro aplomado, drenaje funcional, sin fisuras |
| ⚠️ Atención | Fisuras menores, barbacanas parcialmente obstruidas |
| 🔴 Profesional | Muro inclinado, fisuras activas, erosión en base |

## Importante
**Requiere ingeniero estructural** si hay signos de movimiento.`,

  'Puesta en marcha y cierre estacional de pileta': `## Qué buscar en apertura (primavera)
- Estado de revestimiento después del invierno
- Limpieza de filtro y bomba
- Nivel de agua y reposición
- Verificación de químicos (pH, cloro)

## Qué buscar en cierre (otoño)
- Limpieza profunda antes de cubrir
- Nivel de agua para invernada
- Protección de equipos (cubrir bomba si está expuesta)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Equipos funcionan, revestimiento íntegro |
| ⚠️ Atención | Filtro desgastado, bomba con ruido |
| 🔴 Profesional | Pérdida de agua, bomba no funciona, fisura en vaso |`,

  // ─── CLIMATIZACIÓN ────────────────────────────────────
  'Limpieza de filtros de aire acondicionado': `## Qué buscar
- Filtros sucios u obstruidos (reducen eficiencia)
- Polvo acumulado en la unidad interior
- Olor desagradable al encender (hongos en filtro)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Filtros limpios, sin olor |
| ⚠️ Atención | Filtros con polvo visible, requieren lavado |
| 🔴 Profesional | Olor fuerte a moho, filtro dañado |

## Procedimiento
1. Apagar el equipo
2. Abrir tapa frontal de unidad interior
3. Retirar filtros deslizándolos
4. Lavar con agua y jabón neutro
5. Dejar secar completamente antes de reinstalar
6. Frecuencia: cada 2-3 meses en uso intensivo`,

  'Service de aire acondicionado': `## Qué buscar
- Eficiencia de enfriamiento/calefacción
- Ruidos anormales en unidad interior o exterior
- Goteo de agua donde no corresponde
- Gas refrigerante (si enfría poco = posible fuga)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Enfría/calienta correctamente, sin ruidos |
| ⚠️ Atención | Service vencido (>1 año), eficiencia reducida |
| 🔴 Profesional | No enfría, gotea, ruido fuerte, olor a quemado |

## Importante
**Requiere técnico matriculado** para manipulación de gas refrigerante.

## Normativa
- Service anual recomendado por fabricantes
- Manipulación de gas refrigerante requiere habilitación`,

  'Inspección de unidad exterior': `## Qué buscar
- Serpentina limpia (sin pelusas ni suciedad acumulada)
- Ventilador funcionando sin vibraciones
- Soportes y anclajes firmes
- Desagüe de condensado (no debe gotear sobre vía pública)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Serpentina limpia, ventilador suave, soportes firmes |
| ⚠️ Atención | Suciedad en serpentina, requiere limpieza |
| 🔴 Profesional | Soportes flojos en altura, ventilador con vibración |

## Procedimiento
1. Verificar visualmente estado de la serpentina
2. Encender y escuchar: no debe vibrar excesivamente
3. Verificar que el desagüe de condensado drene correctamente
4. NO lavar con hidrolavadora (puede dañar aletas)`,

  'Control de ventilación natural': `## Qué buscar
- Rejillas de ventilación sin obstrucciones
- Circulación de aire entre ambientes
- Condensación excesiva en ventanas (indica poca ventilación)
- Ventanas que permitan apertura efectiva

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Buena circulación, sin condensación, rejillas libres |
| ⚠️ Atención | Condensación leve, rejillas parcialmente obstruidas |
| 🔴 Profesional | Ambientes sin ventilación posible, moho por condensación |

## Procedimiento
1. Verificar rejillas en cada ambiente
2. Abrir ventanas enfrentadas y sentir circulación cruzada
3. Buscar condensación en vidrios (especialmente en invierno)`,

  'Evaluación de aislación térmica': `## Qué buscar
- Diferencia de temperatura notable entre interior y exterior
- Paredes frías al tacto en invierno (puente térmico)
- Condensación en muros y techos
- Consumo energético excesivo de climatización

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Confort térmico aceptable, sin condensación |
| ⚠️ Atención | Puentes térmicos localizados, condensación leve |
| 🔴 Profesional | Condensación generalizada, consumo energético excesivo |

## Nota
Se recomienda profesional para diagnóstico termográfico y propuesta de mejoras.`,

  'Inspección de calefacción por losa radiante': `## Qué buscar
- Funcionamiento uniforme (toda la superficie debe calentar)
- Zonas frías (posible obstrucción o fuga en circuito)
- Estado de la caldera o fuente de calor
- Presión del sistema (manómetro en rango)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Calentamiento uniforme, presión estable |
| ⚠️ Atención | Zona fría localizada, presión baja |
| 🔴 Profesional | Múltiples zonas frías, pérdida de presión, fuga |

## Importante
**Requiere profesional matriculado** para reparaciones en el circuito.`,

  'Control de ventiladores de techo': `## Qué buscar
- Estabilidad al girar (no debe temblar ni hacer ruido)
- Estado de aspas (fisuras, deformación)
- Fijación al techo (soporte firme)
- Funcionamiento en todas las velocidades

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Gira suave, silencioso, firme |
| ⚠️ Atención | Vibración leve, aspa suelta |
| 🔴 Profesional | Vibración fuerte, soporte flojo, ruido mecánico |

## Procedimiento
1. Encender en cada velocidad
2. Verificar que no vibre ni haga ruido
3. Si vibra: verificar tornillos de aspas y soporte
4. Limpiar aspas con trapo húmedo (acumulan polvo)`,

  // ─── HUMEDAD E IMPERMEABILIZACIÓN ─────────────────────
  'Inspección de manchas y eflorescencias': `## Qué buscar
- Manchas de humedad en muros interiores y exteriores
- Eflorescencias blancas (sales cristalizadas)
- Moho (manchas negras o verdes)
- Patrón de la mancha: ascendente, descendente, localizada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas, sin eflorescencias, sin moho |
| ⚠️ Atención | Eflorescencias leves, manchas secas |
| 🔴 Profesional | Manchas activas, moho extenso, eflorescencias recurrentes |

## Procedimiento
1. Recorrer todos los muros con buena iluminación
2. Identificar patrón: ascendente (capilaridad), descendente (filtración), localizada (cañería)
3. Medir altura de mancha ascendente (>50cm = importante)
4. Fotografiar con referencia de ubicación

## Normativa
- INTI — protocolo de relevamiento de patologías de humedad`,

  'Control de muros enterrados y subsuelos': `## Qué buscar
- Humedad en muros en contacto con el terreno
- Eflorescencias en base de muros de subsuelo
- Filtración activa (goteo o escurrimiento)
- Estado de impermeabilización exterior (si es visible)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muros secos, sin eflorescencias |
| ⚠️ Atención | Humedad leve en base, eflorescencias aisladas |
| 🔴 Profesional | Filtración activa, humedad generalizada |

## Importante
**Requiere profesional** para diagnóstico y solución de impermeabilización enterrada.`,

  'Verificación de impermeabilización en baños y cocina': `## Qué buscar
- Estado de la impermeabilización bajo pisos y en muros de ducha
- Manchas de humedad en techo del piso inferior (si es PA)
- Sellado de silicona en perímetro de bañera/ducha
- Rejuntes en buen estado

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas en piso inferior, silicona íntegra, rejuntes completos |
| ⚠️ Atención | Rejuntes deteriorados, silicona con moho |
| 🔴 Profesional | Mancha en techo de piso inferior = filtración activa |

## Procedimiento
1. Verificar techo del ambiente debajo del baño (manchas)
2. Revisar silicona en bañera, ducha, mesada
3. Verificar rejuntes en piso y paredes`,

  'Control de ventilación para prevención de condensación': `## Qué buscar
- Condensación en ventanas y muros fríos
- Moho en esquinas (especialmente superiores)
- Ambientes con poca ventilación natural
- Extractores de baño/cocina funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin condensación, ventilación adecuada |
| ⚠️ Atención | Condensación leve en ventanas en invierno |
| 🔴 Profesional | Moho por condensación crónica, sin ventilación posible |

## Procedimiento
1. Verificar condensación en ventanas (especialmente en invierno)
2. Verificar extractores de baño y cocina (deben funcionar)
3. Recomendar ventilación diaria mínima de 15 minutos`,

  'Inspección post-lluvia intensa': `## Qué buscar
- Filtraciones nuevas en techos y muros
- Agua acumulada en patios, jardín, subsuelo
- Desagües desbordados
- Humedad en muros que no existía antes

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin filtraciones ni acumulación de agua |
| ⚠️ Atención | Acumulación menor que drena sola |
| 🔴 Profesional | Filtración activa, agua en subsuelo, muro saturado |

## Procedimiento
1. Recorrer interior: buscar goteos o manchas nuevas
2. Verificar exterior: patios, senderos, jardín (agua estancada)
3. Verificar subsuelo si tiene (nivel de agua)
4. Verificar canaletas y bajadas (pueden haberse obstruido)`,

  'Control de drenaje perimetral': `## Qué buscar
- Pendiente del terreno alrededor de la casa (debe ser hacia afuera)
- Drenaje francés o zanjeo perimetral (si existe)
- Acumulación de agua junto a cimientos
- Estado de los caños de drenaje

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Agua escurre hacia afuera, sin acumulación |
| ⚠️ Atención | Pendiente insuficiente en algunos sectores |
| 🔴 Profesional | Agua se acumula junto a cimientos, drenaje obstruido |

## Procedimiento
1. Observar durante o después de lluvia: ¿hacia dónde va el agua?
2. Verificar que no haya charcos permanentes junto a muros
3. Si hay drenaje francés: verificar que no esté colmatado`,

  // ─── SEGURIDAD CONTRA INCENDIO ────────────────────────
  'Verificación de detectores de humo': `## Qué buscar
- Presencia de detectores en cada nivel/planta
- Funcionamiento del botón de TEST (debe sonar alarma)
- Estado de baterías (pitido intermitente = batería baja)
- Ubicación correcta (techo, no obstruido por muebles)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los detectores funcionan al presionar TEST |
| ⚠️ Atención | Batería baja (pitido intermitente) |
| 🔴 Profesional | No funciona, no tiene detectores |

## Procedimiento
1. Presionar botón TEST de cada detector
2. Debe sonar alarma fuerte
3. Si no suena: reemplazar batería primero
4. Si sigue sin funcionar: reemplazar detector completo
5. Limpiar polvo acumulado con paño seco

## Normativa
- Recomendación: mínimo 1 detector por planta
- Baterías: reemplazo anual (excepto litio 10 años)`,

  'Control y recarga de matafuegos': `## Qué buscar
- Fecha de última recarga (etiqueta adherida, vigencia 1 año)
- Presión del manómetro (aguja en zona verde)
- Precinto de seguridad intacto
- Accesibilidad: ubicación visible y señalizada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Recarga vigente, presión correcta, accesible |
| ⚠️ Atención | Recarga próxima a vencer (menos de 30 días) |
| 🔴 Profesional | Recarga vencida, presión baja, precinto roto |

## Importante
La recarga debe ser realizada por **empresa habilitada** (CEMERA).

## Normativa
- Ley 6116 CABA — vigencia de recarga: 1 año
- Decreto 351/79 — protección contra incendios`,

  'Revisión de instalación eléctrica como fuente de ignición': `## Qué buscar
- Cables recalentados o con aislación derretida
- Empalmes fuera de caja (chispas)
- Tablero subdimensionado (térmicas que saltan frecuentemente)
- Zapatillas o triples sobrecargados

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin signos de calentamiento, empalmes en caja |
| ⚠️ Atención | Uso de triples/zapatillas en exceso |
| 🔴 Profesional | Cables derretidos, chispas, olor a quemado |

## Normativa
- AEA 90364 — prevención de incendios en instalaciones eléctricas
- Cortocircuito: principal causa de incendio doméstico en Argentina`,

  'Verificación de vías de evacuación': `## Qué buscar
- Que las salidas estén libres de obstáculos
- Que las puertas abran fácilmente (no trabadas)
- Iluminación en pasillos y escaleras
- Que todos los habitantes conozcan la salida de emergencia

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Salidas libres, puertas funcionales, iluminación correcta |
| ⚠️ Atención | Objetos reducen paso, iluminación insuficiente |
| 🔴 Profesional | Salida bloqueada, puerta trabada, sin iluminación |

## Procedimiento
1. Recorrer el camino desde cada dormitorio hasta la salida
2. Verificar que puertas abran sin esfuerzo
3. Verificar iluminación de emergencia (si existe)
4. En PH o edificio: verificar escalera de escape`,

  'Control de detector de monóxido de carbono': `## Qué buscar
- Presencia de detector de CO en ambientes con gas
- Funcionamiento del botón TEST
- Ubicación correcta (1.5m de altura, cerca de artefactos de gas)
- Estado de batería

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Detector funcional, bien ubicado |
| ⚠️ Atención | Sin detector (altamente recomendado) |
| 🔴 Profesional | Detector alarma constantemente (posible fuga de CO) |

## PELIGRO
El monóxido de carbono es **inodoro y mortal**. Si el detector alarma: ventilar y evacuar inmediatamente.

## Normativa
- Recomendado en todo ambiente con artefactos de gas
- Detección temprana salva vidas`,

  'Revisión de instalación de gas como fuente de ignición': `## Qué buscar
- Flexibles vencidos (fecha estampada, máx 2 años)
- Fugas en conexiones (olor a gas)
- Artefactos con llama amarilla
- Ventilación obstruida

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Flexibles vigentes, sin olor, llama azul, ventilación libre |
| ⚠️ Atención | Flexible próximo a vencer |
| 🔴 Profesional URGENTE | Olor a gas, llama amarilla, ventilación obstruida |

## Normativa
- NAG-200 — instalaciones de gas como fuente de ignición
- Fuga de gas + chispa = riesgo de explosión`,

  // ─── CONTROL DE PLAGAS ────────────────────────────────
  'Inspección general de indicios de plagas': `## Qué buscar
- Excrementos de roedores (pequeños, oscuros, en rincones)
- Caminos de hormigas o presencia de cucarachas
- Sonidos en paredes o techos (roedores en entretecho)
- Daños en cables, madera, alimentos almacenados
- Nidos (detrás de muebles, en subsuelo, entretecho)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin indicios de plagas |
| ⚠️ Atención | Indicios menores (hormigas aisladas, 1-2 cucarachas) |
| 🔴 Profesional | Excrementos de roedores, daño en cables, nidos |

## Procedimiento
1. Inspeccionar cocina: detrás de electrodomésticos, bajo mesada
2. Inspeccionar subsuelo y entretecho (con linterna)
3. Buscar en rincones y zócalos
4. Verificar despensa/alacena: buscar rastros en alimentos`,

  'Control preventivo de termitas': `## Qué buscar
- Polvo fino al pie de marcos o muebles de madera (indicio clave)
- Madera que suena hueca al golpear
- Túneles de barro en cimientos o muros (termitas subterráneas)
- Alas descartadas cerca de ventanas (enjambre)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin indicios de termitas |
| ⚠️ Atención | Polvo fino sospechoso, verificar origen |
| 🔴 Profesional URGENTE | Túneles de barro, madera hueca, enjambre |

## Importante
**Requiere empresa especializada** en control de termitas. El daño puede ser extenso antes de ser visible.

## Normativa
- Empresa habilitada por autoridad sanitaria municipal`,

  'Desinsectación preventiva': `## Qué buscar
- Presencia de cucarachas (especialmente en cocina y baño)
- Hormigueros en jardín cercanos a la casa
- Arañas en rincones, sótano, garaje
- Polillas en roperos o despensa

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin presencia significativa de insectos |
| ⚠️ Atención | Algunos insectos aislados, tratamiento preventivo recomendado |
| 🔴 Profesional | Infestación, cucarachas frecuentes, hormiguero en cimientos |

## Nota
Se recomienda desinsectación preventiva **anual** por empresa habilitada.

## Normativa
- Ley 11843 — servicios de desinsectación
- Empresa registrada ante autoridad sanitaria`,

  'Desratización preventiva': `## Qué buscar
- Excrementos (granos oscuros de ~1cm)
- Marcas de dientes en cables, madera, plástico
- Sonidos nocturnos en entretecho o paredes
- Madrigueras (acumulación de materiales en rincones)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin indicios de roedores |
| ⚠️ Atención | Indicios leves, colocar trampas de monitoreo |
| 🔴 Profesional | Excrementos frecuentes, daño en cables, madriguera |

## PELIGRO
Los roedores pueden transmitir enfermedades (hantavirus, leptospirosis) y causar incendios al roer cables eléctricos.

## Normativa
- Ley 11843 — desratización obligatoria
- NO usar veneno sin asesoramiento (riesgo para mascotas y niños)`,

  'Eliminación de criaderos de mosquitos': `## Qué buscar
- Recipientes con agua estancada (macetas, tapas, neumáticos)
- Canaletas obstruidas con agua acumulada
- Bebederos de mascotas sin renovar
- Piletas fuera de uso con agua estancada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin agua estancada, recipientes dados vuelta |
| ⚠️ Atención | Algunos recipientes con agua, necesitan vaciarse |
| 🔴 Profesional | Pileta fuera de uso con agua verde, múltiples criaderos |

## Procedimiento
1. Recorrer jardín buscando TODO recipiente con agua
2. Dar vuelta o perforar recipientes que junten agua
3. Renovar agua de bebederos cada 2-3 días
4. Verificar canaletas sin pendiente (agua estancada)

## Normativa
- Campaña nacional contra dengue — eliminar criaderos de Aedes aegypti`,

  'Control de murciélagos': `## Qué buscar
- Presencia de murciélagos en entretecho, aleros, persianas
- Guano (excremento) acumulado en pisos o paredes
- Sonidos al atardecer (chillidos agudos)
- Puntos de ingreso: rendijas >1.5cm en aleros y techos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin presencia de murciélagos |
| ⚠️ Atención | 1-2 avistamientos, posible colonia pequeña |
| 🔴 Profesional | Colonia establecida, guano acumulado |

## Importante
**NO manipular murciélagos con las manos** (riesgo de rabia). Consultar a zoonosis municipal para exclusión humanitaria.

## Normativa
- Zoonosis municipal — protocolo de exclusión de murciélagos
- Los murciélagos son fauna protegida — NO se pueden matar`,
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
