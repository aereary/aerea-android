/*
 * ============================================================
 * AÉREA — AUTO SYNC MASTER
 * ============================================================
 *
 * Este archivo NO reemplaza:
 * - Code.gs
 * - GenericLibrary.gs
 *
 * Orden seguro:
 *   1) AO3
 *   2) Biblioteca genérica
 *
 * Un trigger de respaldo cada 10 minutos. DrivePushSync.gs puede añadir una
 * ruta rápida basada en avisos sin eliminar este respaldo.
 */

const AEREA_AUTO_SYNC = {
  EVERY_MINUTES: 10,
  HANDLER: "aereaAutoSyncAll",
  PROPERTY_LAST_START: "AEREA_AUTO_LAST_START",
  PROPERTY_LAST_SUCCESS: "AEREA_AUTO_LAST_SUCCESS",
  PROPERTY_LAST_ERROR: "AEREA_AUTO_LAST_ERROR"
};


/*
 * FUNCIÓN PRINCIPAL AUTOMÁTICA
 *
 * Primero sincroniza AO3.
 * Solo si AO3 termina bien, ejecuta la biblioteca genérica.
 *
 * LockService evita que dos ejecuciones se pisen.
 */
function aereaAutoSyncAll() {
  const lock =
    LockService.getScriptLock();

  if (!lock.tryLock(1000)) {
    console.log(
      "AUTO SYNC omitido: ya hay otra ejecución en curso."
    );

    return {
      skipped: true,
      reason: "already_running"
    };
  }

  const props =
    PropertiesService
      .getScriptProperties();

  const startedAt =
    new Date()
      .toISOString();

  props.setProperty(
    AEREA_AUTO_SYNC
      .PROPERTY_LAST_START,
    startedAt
  );

  console.log(
    "===================================="
  );
  console.log(
    " AEREA AUTO SYNC MASTER"
  );
  console.log(
    "===================================="
  );
  console.log(
    "Inicio: " +
      startedAt
  );
  console.log("");

  try {
    /*
     * 1. AO3 SIEMPRE PRIMERO
     */
    console.log(
      ">>> PASO 1/2: AO3"
    );

    const ao3Result =
      aereaDriveSyncUnlocked_();

    console.log("");
    console.log(
      "AO3 terminado correctamente."
    );
    console.log("");

    /*
     * 2. BIBLIOTECA GENÉRICA
     */
    console.log(
      ">>> PASO 2/2: BIBLIOTECA GENÉRICA"
    );

    const genericResult =
      aereaGenericSyncUnlocked_();

    console.log("");
    console.log(
      "Biblioteca genérica terminada correctamente."
    );

    const successAt =
      new Date()
        .toISOString();

    props.setProperty(
      AEREA_AUTO_SYNC
        .PROPERTY_LAST_SUCCESS,
      successAt
    );

    props.deleteProperty(
      AEREA_AUTO_SYNC
        .PROPERTY_LAST_ERROR
    );

    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      " AUTO SYNC COMPLETADO"
    );
    console.log(
      "===================================="
    );
    console.log(
      "Éxito: " +
        successAt
    );

    return {
      skipped: false,
      success: true,
      ao3: ao3Result,
      generic: genericResult
    };

  } catch (error) {
    const message =
      error &&
      error.stack
        ? String(error.stack)
        : String(error);

    props.setProperty(
      AEREA_AUTO_SYNC
        .PROPERTY_LAST_ERROR,
      new Date()
        .toISOString() +
        " | " +
        message
    );

    console.error(
      "AEREA AUTO SYNC FALLÓ:"
    );
    console.error(
      message
    );

    /*
     * Re-lanzamos el error para que Apps Script
     * registre la ejecución como fallida.
     */
    throw error;

  } finally {
    lock.releaseLock();
  }
}


/*
 * INSTALAR AUTOMATIZACIÓN
 *
 * Ejecutar UNA sola vez después de probar
 * aereaAutoSyncAll() manualmente.
 */
function aereaInstallAutoSyncAll() {
  /*
   * Limpia triggers viejos de sync para impedir dobles ejecuciones.
   */
  aereaRemoveAutoSyncAll();

  ScriptApp
    .newTrigger(
      AEREA_AUTO_SYNC.HANDLER
    )
    .timeBased()
    .everyMinutes(
      AEREA_AUTO_SYNC
        .EVERY_MINUTES
    )
    .create();

  console.log(
    "===================================="
  );
  console.log(
    " AUTO SYNC INSTALADO"
  );
  console.log(
    "===================================="
  );
  console.log(
    "Función: " +
      AEREA_AUTO_SYNC.HANDLER
  );
  console.log(
    "Frecuencia aproximada: cada " +
      AEREA_AUTO_SYNC
        .EVERY_MINUTES +
      " minutos."
  );
  console.log(
    "Orden: AO3 -> biblioteca genérica."
  );

  return aereaAutoSyncStatus();
}


/*
 * DESACTIVAR AUTOMATIZACIÓN
 *
 * También elimina posibles triggers viejos
 * directos de aereaDriveSync/aereaGenericSync
 * para que haya un único punto de entrada.
 */
function aereaRemoveAutoSyncAll() {
  const handlers =
    new Set([
      "aereaAutoSyncAll",
      "aereaDriveSync",
      "aereaGenericSync"
    ]);

  let deleted = 0;

  ScriptApp
    .getProjectTriggers()
    .forEach(
      function(trigger) {
        if (
          handlers.has(
            trigger
              .getHandlerFunction()
          )
        ) {
          ScriptApp
            .deleteTrigger(
              trigger
            );

          deleted++;
        }
      }
    );

  console.log(
    "Triggers de sync eliminados: " +
      deleted
  );

  return deleted;
}


/*
 * VER ESTADO
 */
function aereaAutoSyncStatus() {
  const triggers =
    ScriptApp
      .getProjectTriggers();

  const masterTriggers =
    triggers.filter(
      function(trigger) {
        return (
          trigger
            .getHandlerFunction() ===
          AEREA_AUTO_SYNC.HANDLER
        );
      }
    );

  const props =
    PropertiesService
      .getScriptProperties();

  const status = {
    installed:
      masterTriggers.length === 1,

    trigger_count:
      masterTriggers.length,

    last_start:
      props.getProperty(
        AEREA_AUTO_SYNC
          .PROPERTY_LAST_START
      ),

    last_success:
      props.getProperty(
        AEREA_AUTO_SYNC
          .PROPERTY_LAST_SUCCESS
      ),

    last_error:
      props.getProperty(
        AEREA_AUTO_SYNC
          .PROPERTY_LAST_ERROR
      )
  };

  console.log(
    "===================================="
  );
  console.log(
    " AEREA AUTO SYNC STATUS"
  );
  console.log(
    "===================================="
  );
  console.log(
    JSON.stringify(
      status,
      null,
      2
    )
  );

  return status;
}
