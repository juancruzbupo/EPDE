# Actualización de Costos — Landing EPDE

## Dónde están los datos en el código

**Archivo:** `apps/web/src/components/landing/landing-page.tsx`
**Constante:** `COST_COMPARISONS` (línea ~139)
**Disclaimer:** buscar "actualizados a" y cambiar la fecha

```ts
const COST_COMPARISONS: CostComparison[] = [
  {
    pathology: 'Filtraciones en techos',
    preventive: '$150.000 – $400.000',
    emergency: '$2.500.000 – $6.000.000',
    multiplier: '8x – 15x',
  },
  {
    pathology: 'Humedad de cimientos',
    preventive: '$300.000 – $800.000',
    emergency: '$3.500.000 – $9.000.000',
    multiplier: '8x – 12x',
  },
  {
    pathology: 'Fallas eléctricas',
    preventive: '$80.000 – $180.000',
    emergency: '$1.200.000 – $3.500.000',
    multiplier: '10x – 20x',
  },
];
```

---

## Fuentes para actualizar precios

### 1. Costo por m² de construcción (referencia macro)

| Fuente                                             | URL                                                               | Qué buscar                                          |
| -------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| **CAPER** (Colegio de Arquitectos de Entre Ríos)   | https://www.colegioarquitectos.org.ar/category/costo-m2/          | "Costo m2 Entre Ríos" — publican mensualmente       |
| **INDEC — ICC** (Índice del Costo de Construcción) | https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33             | Variación interanual para ajustar proporcionalmente |
| **DGEC Entre Ríos**                                | https://www.entrerios.gov.ar/dgec/ → Publicaciones → Construcción | ICC provincial, más preciso para Paraná             |

### 2. Mano de obra (UOCRA)

| Fuente                                   | URL                                             | Qué buscar                                    |
| ---------------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| **UOCRA escala salarial**                | Buscar: `"escala salarial UOCRA [mes] [año]"`   | Oficial albañil $/hora (Zona A = Paraná)      |
| **Infobae / LM Neuquén** suelen publicar | Buscar: `"cuánto cobra un albañil [mes] [año]"` | Resumen periodístico con valores actualizados |

### 3. Precios de referencia por rubro

| Rubro                                        | Fuente                         | URL                                                                  |
| -------------------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| **Techista** (impermeabilización, membranas) | Home Solution                  | https://homesolution.net/ar/about/preciosreferencia/techista         |
| **Albañil** (revoques, picar, reconstruir)   | Home Solution                  | https://homesolution.net/ar/about/preciosreferencia/albanil          |
| **Electricista** (revisión, recableado)      | Home Solution                  | https://homesolution.net/ar/about/preciosreferencia/electricista     |
| **Membrana por m²**                          | Impermeabilizaciones de Techos | https://www.impermeabilizacionesdetechos.com/precios-mano-de-obra-m2 |
| **Durlock / cielorraso por m²**              | Calculadora Durlock            | https://calculadoradurlock.com/                                      |
| **Precios generales actualizados**           | AyC Revista                    | https://aycrevista.com.ar/ → sección "Precios de la construcción"    |
| **Generador de precios (unitarios)**         | CYPE Argentina                 | http://www.argentina.generadordeprecios.info/                        |

### 4. Tipo de cambio (para referencia USD)

| Fuente            | URL                                          |
| ----------------- | -------------------------------------------- |
| Ámbito Financiero | https://www.ambito.com/contenidos/dolar.html |

---

## Cómo calcular cada patología

### Filtraciones en techos

**Prevención** = reparación focalizada temprana (sellado de fisuras en membrana + parches)

- Referencia: precio techista por m² × 10-20 m² afectados + materiales (sellador, membrana líquida parcial)
- Consultar Home Solution → Techista

**Emergencia** = picar impermeabilización vieja + nueva membrana completa + reconstruir cielorraso Durlock

- Desglose por m² (50-80 m² típicos):
  - Demolición impermeabilización: ~$15.000-$20.000/m²
  - Nueva membrana + carpeta: ~$30.000-$40.000/m²
  - Cielorraso Durlock: ~$40.000-$55.000/m² (ver Calculadora Durlock)
  - Pintura y terminación: ~$8.000-$12.000/m²

**Multiplicador** = emergencia ÷ prevención (típico 8x-15x)

### Humedad de cimientos

**Prevención** = tratamiento por inyección de siliconas/silicatos en etapa temprana

- Referencia: ~$130.000-$160.000 por metro lineal × 10-15 ml afectados
- Alternativa electroósmosis: equipo + instalación ~$400.000-$600.000

**Emergencia** = excavación perimetral + membrana en cimientos + reconstrucción de revoques

- Desglose (20-30 ml perimetrales):
  - Excavación hasta cimientos: $800.000-$1.500.000
  - Membrana asfáltica + drenaje: $600.000-$1.200.000
  - Relleno y compactación: $200.000-$400.000
  - Picar revoque húmedo (30-50 m²): $13.000-$15.000/m²
  - Revoque nuevo grueso + fino: $10.000-$20.000/m²
  - Pintura: $150.000-$400.000

**Multiplicador** = típico 8x-12x

### Fallas eléctricas

**Prevención** = revisión diagnóstica + reparaciones menores

- Visita diagnóstica: $25.000-$46.000
- Cambio de térmica/disyuntor: $24.000-$37.000
- Cambio de toma/llave: $13.000-$21.000
- Consultar Home Solution → Electricista

**Emergencia** = recableado parcial + reparación de daños colaterales

- Recableado parcial (50% vivienda, ~25 bocas): $340.000-$600.000
- Tablero nuevo + térmicas + disyuntor: $150.000-$300.000
- Reparación de paredes (picar + revoque + pintura, 10-20 m²): $200.000-$500.000
- Certificado DCI: $117.000-$228.000
- Materiales (cables, caños, cajas): $200.000-$400.000
- Consultar AAIERIC: https://www.aaieric.org.ar/costos-mano-de-obra

**Multiplicador** = típico 10x-20x

---

## Procedimiento de actualización

1. **Frecuencia**: cada 3-6 meses (o cuando haya paritaria UOCRA significativa)

2. **Pasos**:
   - Consultar ICC INDEC o CAPER → obtener % variación desde última actualización
   - Verificar 2-3 precios unitarios en Home Solution y AyC Revista
   - Ajustar los rangos en `COST_COMPARISONS` proporcionalmente
   - Recalcular multiplicadores (deberían mantenerse estables — ambos lados suben)
   - Actualizar la fecha en el disclaimer: `"actualizados a [mes] [año]"`

3. **Atajo rápido** (ajuste por inflación sin re-investigar):
   - Buscar variación ICC interanual en INDEC
   - Multiplicar ambos extremos de cada rango por `(1 + variación%)`
   - Redondear a miles

4. **Rebuild**:
   ```bash
   pnpm --filter @epde/web build && pnpm --filter @epde/web start
   ```

---

## Supuestos de la estimación actual (marzo 2026)

- **Vivienda tipo**: unifamiliar, 100-150 m², planta baja, losa o techo inclinado
- **Ubicación**: barrios residenciales de Paraná, Entre Ríos
- **Zona UOCRA**: A
- **Ajuste Paraná vs CABA**: mano de obra -10% a -15%, materiales +5% (flete)
- **Dólar blue referencia**: ~$1.415 (solo para contexto, precios en ARS)
- **Inflación materiales (feb 2025)**: +17,6% interanual
- **Inflación mano de obra (feb 2025)**: +92,8% interanual
