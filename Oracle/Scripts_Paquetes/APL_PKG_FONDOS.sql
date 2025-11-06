create or replace PACKAGE APL_PKG_FONDOS AS
    -- Procedimiento para insertar fondo
    PROCEDURE crear_fondo (
        p_descripcion          IN VARCHAR2,
        p_idproveedor          IN VARCHAR2,
        p_idtipofondo          IN NUMBER,
        p_valorfondo           IN NUMBER,
        p_fechainiciovigencia  IN TIMESTAMP,
        p_fechafinvigencia     IN TIMESTAMP,
        p_idusuarioingreso     IN VARCHAR2,
        p_nombreusuarioingreso IN VARCHAR2
    );
END APL_PKG_FONDOS;

==========================================================================================================BODY===========================

create or replace PACKAGE BODY APL_PKG_FONDOS AS

  PROCEDURE crear_fondo (
      p_descripcion             IN VARCHAR2,
      p_idproveedor             IN VARCHAR2,
      p_idtipofondo             IN NUMBER,
      p_valorfondo              IN NUMBER,
      p_fechainiciovigencia     IN TIMESTAMP,
      p_fechafinvigencia        IN TIMESTAMP,
      p_idusuarioingreso        IN VARCHAR2,
      p_nombreusuarioingreso    IN VARCHAR2
  ) AS
      -- Catálogos
      w_creacion_manual   NUMBER;
      w_entidad_fondo     NUMBER;
      w_tipo_creacion     NUMBER;
      w_estado_activo     NUMBER;
      w_estado_nuevo      NUMBER;
      w_estado_aprobado   NUMBER;

      -- Trabajo
      w_idfondo           NUMBER;
      w_estado_registro   NUMBER;
      v_tiene_aprobadores NUMBER;
  BEGIN
      -- 1) Resolver catálogos
      SELECT idcatalogo INTO w_estado_nuevo    FROM APL_TB_CATALOGO WHERE idetiqueta = 'ESTADONUEVO';
      SELECT idcatalogo INTO w_creacion_manual FROM APL_TB_CATALOGO WHERE idetiqueta = 'INDCREMANUAL';
      SELECT idcatalogo INTO w_entidad_fondo   FROM APL_TB_CATALOGO WHERE idetiqueta = 'ENTFONDO';
      SELECT idcatalogo INTO w_tipo_creacion   FROM APL_TB_CATALOGO WHERE idetiqueta = 'TPCREACION';
      SELECT idcatalogo INTO w_estado_activo   FROM APL_TB_CATALOGO WHERE idetiqueta = 'ESTADOACTIVO';
      SELECT idcatalogo INTO w_estado_aprobado FROM APL_TB_CATALOGO WHERE idetiqueta = 'ESTADOAPROBADO';

      -- 2) ¿Hay aprobadores configurados para ENTFONDO + TPCREACION + ACTIVO?
      SELECT COUNT(*)
        INTO v_tiene_aprobadores
        FROM APL_TB_APROBADOR
       WHERE entidad          = w_entidad_fondo
         AND idtipoproceso    = w_tipo_creacion
         AND idestadoregistro = w_estado_activo;

      IF v_tiene_aprobadores > 0 THEN
        w_estado_registro := w_estado_nuevo;     -- queda pendiente
      ELSE
        w_estado_registro := w_estado_aprobado;  -- pasa directo
      END IF;

      -- 3) Insertar FONDO
      INSERT INTO APL_TB_FONDO (
          descripcion,
          idproveedor,
          idtipofondo,
          valorfondo,
          fechainiciovigencia,
          fechafinvigencia,
          valordisponible,
          valorcomprometido,
          valorliquidado,
          idusuarioingreso,
          fechaingreso,
          idusuariomodifica,
          fechamodifica,
          idestadoregistro,
          indicadorcreacion
      ) VALUES (
          p_descripcion,
          p_idproveedor,
          p_idtipofondo,
          p_valorfondo,
          p_fechainiciovigencia,
          p_fechafinvigencia,
          p_valorfondo,   -- disponible = total al crear
          0,
          0,
          p_idusuarioingreso,
          SYSTIMESTAMP,   -- columna TIMESTAMP
          NULL,
          NULL,
          w_estado_registro,
          w_creacion_manual
      )
      RETURNING idfondo INTO w_idfondo;

      -- 4) Si hay aprobadores, generar filas en APL_TB_APROBACION (una por aprobador activo)
      IF v_tiene_aprobadores > 0 THEN
        INSERT INTO APL_TB_APROBACION (
            entidad,
            identidad,
            idtipoproceso,
            idusersolicitud,
            nombreusersolicitud,
            fechasolicitud,
            iduseraprobador,
            fechaaprobacion,
            comentario,
            nivelaprobacion,
            idestadoregistro
        )
        SELECT
            w_entidad_fondo              AS entidad,         -- SIEMPRE el catálogo ENTFONDO
            w_idfondo                    AS identidad,       -- el IdFondo recién creado
            w_tipo_creacion              AS idtipoproceso,   -- TPCREACION
            p_idusuarioingreso           AS idusersolicitud,
            p_nombreusuarioingreso       AS nombreusersolicitud,
            SYSTIMESTAMP                 AS fechasolicitud,
            a.iduseraprobador            AS iduseraprobador,
            NULL                         AS fechaaprobacion,
            NULL                         AS comentario,
            a.nivelaprobacion            AS nivelaprobacion,
            w_estado_nuevo               AS idestadoregistro
        FROM APL_TB_APROBADOR a
        WHERE a.entidad          = w_entidad_fondo
          AND a.idtipoproceso    = w_tipo_creacion
          AND a.idestadoregistro = w_estado_activo;
      END IF;
    /*
      -- 5) (Opcional) Registrar LOG aquí si lo necesitas
      INSERT INTO APL_TB_LOG (
          -- FechaHoraTrx usa DEFAULT SYSTIMESTAMP si tu tabla lo tiene
          idUser, IdOpcion, IdControlInterfaz, IdEvento,
          Entidad, IdEntidad, IdTipoProceso, Datos
        )
        SELECT
          p_idusuarioingreso               AS dUser,
          NULL                             AS IdOpcion,          -- ajusta si tienes opción/ pantalla
          NULL                             AS IdControlInterfaz, -- ajusta si aplica
          NULL                             AS IdEvento,          -- ajusta si aplica
          w_entidad_fondo                  AS Entidad,           -- ENTFONDO
          w_idfondo                        AS IdEntidad,         -- Id del fondo creado
          w_tipo_creacion                  AS IdTipoProceso,     -- TPCREACION
          JSON_OBJECT(
              'IdFondo'            VALUE f.IdFondo,
              'Descripcion'        VALUE f.Descripcion,
              'IdProveedor'        VALUE f.IdProveedor,
              'IdTipoFondo'        VALUE f.IdTipoFondo,
              'ValorFondo'         VALUE f.ValorFondo,
              'FechaInicioVigencia' VALUE TO_CHAR(f.FechaInicioVigencia,'YYYY-MM-DD"T"HH24:MI:SS.FF3'),
              'FechaFinVigencia'    VALUE TO_CHAR(f.FechaFinVigencia,'YYYY-MM-DD"T"HH24:MI:SS.FF3'),
              'ValorDisponible'    VALUE f.ValorDisponible,
              'ValorComprometido'  VALUE f.ValorComprometido,
              'ValorLiquidado'     VALUE f.ValorLiquidado,
              'IdUsuarioIngreso'   VALUE f.IdUsuarioIngreso,
              'FechaIngreso'       VALUE TO_CHAR(f.FechaIngreso,'YYYY-MM-DD"T"HH24:MI:SS.FF3'),
              'IdUsuarioModifica'  VALUE f.IdUsuarioModifica,
              'FechaModifica'      VALUE TO_CHAR(f.FechaModifica,'YYYY-MM-DD"T"HH24:MI:SS.FF3'),
              'IdEstadoRegistro'   VALUE f.IdEstadoRegistro,
              'IndicadorCreacion'  VALUE f.IndicadorCreacion
          RETURNING CLOB)                                       -- devuelve CLOB JSON
        FROM APL_TB_FONDO f
        WHERE f.IdFondo = w_idfondo;
*/
      -- Recomendación: dejar el COMMIT al llamador
      -- COMMIT;

  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      -- Alguna etiqueta de catálogo no existe
      RAISE_APPLICATION_ERROR(-20050, 'Falta configurar etiquetas en APL_TB_CATALOGO (ENTFONDO/TPCREACION/ESTADO*).');
  END crear_fondo;

END APL_PKG_FONDOS;