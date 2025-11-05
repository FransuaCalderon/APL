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
      v_creacion_manual   NUMBER;
      v_entidad_fondo     NUMBER;
      v_tipo_creacion     NUMBER;
      v_estado_activo     NUMBER;
      v_estado_nuevo      NUMBER;
      v_estado_aprobado   NUMBER;

      -- Trabajo
      v_idfondo           NUMBER;
      v_estado_registro   NUMBER;
      v_tiene_aprobadores NUMBER;
  BEGIN
      -- 1) Resolver catálogos
      SELECT idcatalogo INTO v_estado_nuevo    FROM APL_TB_CATALOGO WHERE idetiqueta = 'ESTADONUEVO';    --2
      SELECT idcatalogo INTO v_creacion_manual FROM APL_TB_CATALOGO WHERE idetiqueta = 'INDCREMANUAL';   --38
      SELECT idcatalogo INTO v_entidad_fondo   FROM APL_TB_CATALOGO WHERE idetiqueta = 'ENTFONDO';       --32
      SELECT idcatalogo INTO v_tipo_creacion   FROM APL_TB_CATALOGO WHERE idetiqueta = 'TPCREACION';     --40
      SELECT idcatalogo INTO v_estado_activo   FROM APL_TB_CATALOGO WHERE idetiqueta = 'ESTADOACTIVO';   --1
      SELECT idcatalogo INTO v_estado_aprobado FROM APL_TB_CATALOGO WHERE idetiqueta = 'ESTADOAPROBADO'; --4

      -- 2) ¿Hay aprobadores configurados para ENTFONDO + TPCREACION + ACTIVO?
      SELECT COUNT(*)
        INTO v_tiene_aprobadores
        FROM APL_TB_APROBADOR
       WHERE entidad          = v_entidad_fondo
         AND idtipoproceso    = v_tipo_creacion
         AND idestadoregistro = v_estado_activo;

      IF v_tiene_aprobadores > 0 THEN
        v_estado_registro := v_estado_nuevo;     -- queda pendiente
      ELSE
        v_estado_registro := v_estado_aprobado;  -- pasa directo
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
          v_estado_registro,
          v_creacion_manual
      )
      RETURNING idfondo INTO v_idfondo;

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
            v_entidad_fondo              AS entidad,         -- SIEMPRE el catálogo ENTFONDO
            v_idfondo                    AS identidad,       -- el IdFondo recién creado
            v_tipo_creacion              AS idtipoproceso,   -- TPCREACION
            p_idusuarioingreso           AS idusersolicitud,
            p_nombreusuarioingreso       AS nombreusersolicitud,
            SYSTIMESTAMP                 AS fechasolicitud,
            a.iduseraprobador            AS iduseraprobador,
            NULL                         AS fechaaprobacion,
            NULL                         AS comentario,
            a.nivelaprobacion            AS nivelaprobacion,
            v_estado_nuevo               AS idestadoregistro
        FROM APL_TB_APROBADOR a
        WHERE a.entidad          = v_entidad_fondo
          AND a.idtipoproceso    = v_tipo_creacion
          AND a.idestadoregistro = v_estado_activo;
      END IF;

      -- 5) (Opcional) Registrar LOG aquí si lo necesitas

  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      -- Alguna etiqueta de catálogo no existe
      RAISE_APPLICATION_ERROR(-20050, 'Falta configurar etiquetas en APL_TB_CATALOGO (ENTFONDO/TPCREACION/ESTADO*).');
  END crear_fondo;

END APL_PKG_FONDOS;