# Política de ramas de aérea

## Fuente de verdad actual

La rama estable y fuente de verdad es:

```text
main
```

Contiene la última línea acumulativa de Android, Career, Health, horarios,
post-its, calendario, bibliotecas y mantenimiento. La línea histórica anterior
de `main` quedó preservada antes de la promoción.

## Reglas

1. Toda rama nueva parte de la rama estable.
2. Los Pull Requests apuntan a `main`.
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
ancestro de `main`. `branchOnly` mayor que cero significa que todavía existe
historia exclusiva y que la rama no debe borrarse sin archivarla.

## Limpieza del 16 de septiembre de 2026

- Se auditaron 39 ramas remotas.
- Se eliminaron 30 ramas completamente fusionadas.
- Siete ramas con historia exclusiva se conservaron como etiquetas bajo
  `archive/2026-09-16/` antes de eliminarlas.
- La antigua `main` se preservó como
  `archive/2026-09-16/main-before-stable-promotion`.
- La promoción reconcilió ambas historias mediante un merge normal, sin
  reescritura ni `force push`.

La rama temporal `fix/restore-just-calendar-baseline-20260915` puede eliminarse
cuando el Pull Request de promoción esté fusionado y su verificación quede en
verde.
