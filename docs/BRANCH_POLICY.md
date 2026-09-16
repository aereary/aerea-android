# Política de ramas de aérea

## Fuente de verdad actual

La rama estable es:

```text
fix/restore-just-calendar-baseline-20260915
```

Contiene la última línea acumulativa de Android, Career, Health, horarios,
post-its, calendario, bibliotecas y mantenimiento. Hasta que termine la
promoción controlada, `main` es histórica y no debe usarse como base de trabajo.

## Reglas

1. Toda rama nueva parte de la rama estable.
2. Un Pull Request apunta a la rama estable mientras `main` siga en transición.
3. Las ramas fusionadas se eliminan después de comprobar que el workflow está
   verde.
4. Una rama con commits únicos no se elimina hasta crear una etiqueta de
   archivo o confirmar que sus cambios están superados.
5. Los cambios visuales y los cambios de datos/sincronización usan Pull Requests
   separados.
6. `build-apk.yml` publica; `verify.yml` solo comprueba y nunca crea Releases.

## Auditoría reproducible

Después de descargar todas las referencias remotas:

```bash
git fetch --all --prune
npm run audit:branches
```

El informe marca una rama como `merged` únicamente si su commit final ya es
ancestro de la rama estable. `branchOnly` mayor que cero significa que todavía
existe historia exclusiva y que la rama no debe borrarse sin archivarla.

## Estado del inventario del 16 de septiembre de 2026

- 39 ramas remotas encontradas.
- 31 ramas están completamente contenidas en la rama estable: la propia rama
  estable y 30 ramas históricas eliminables.
- `main` conserva cinco commits de una integración antigua de Generic Library;
  la implementación estable actual es posterior y está cubierta por pruebas,
  pero la historia se preservará antes de promover la rama estable.
- Seis ramas antiguas conservan prototipos AO3, Boca o General Library no
  ancestrales. Antes de eliminarlas deben convertirse en etiquetas bajo
  `archive/2026-09-16/`.
- `recovery/consolidation-2026-09-05` solo añade un merge histórico; no contiene
  un árbol de código más nuevo que la rama estable.

## Promoción de `main`

La promoción se hará en un cambio separado después de:

1. una compilación Android verde;
2. una actualización instalada sobre la APK anterior sin pérdida de datos;
3. una comprobación rápida en teléfono y tableta;
4. una etiqueta de respaldo para la `main` anterior;
5. una reconciliación de su historia sin reemplazar el árbol estable.

Hasta completar esos pasos, cambiar la rama predeterminada o forzar `main`
sería una operación destructiva innecesaria.
