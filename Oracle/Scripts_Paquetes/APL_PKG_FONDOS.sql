CREATE OR REPLACE PACKAGE apl_pkg_fondos AS
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

    --Procedimineto para actualizar fondo
    PROCEDURE actualizar_fondo (
        p_idfondo               IN NUMBER,
        p_descripcion           IN VARCHAR2,
        p_idproveedor           IN VARCHAR2,
        p_idtipofondo           IN NUMBER,
        p_valorfondo            IN NUMBER,
        p_fechainiciovigencia   IN TIMESTAMP,
        p_fechafinvigencia      IN TIMESTAMP,
        p_idusuariomodifica     IN VARCHAR2,
        p_nombreusuariomodifica IN VARCHAR2,
        p_codigo_salida         OUT NUMBER,
        p_mensaje_salida        OUT VARCHAR2
    );
        
    --Procedimiento para listar fondo
    PROCEDURE sp_listar_fondos (
        p_cursor         OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    );
    
    -- Procedimiento para obtener un fondo por ID
    PROCEDURE sp_obtener_fondo_por_id (
        p_idfondo IN NUMBER,
        p_cursor  OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    );

END apl_pkg_fondos;
==========================================================================================================BODY===========================

CREATE OR REPLACE PACKAGE BODY apl_pkg_fondos AS

    PROCEDURE crear_fondo (
        p_descripcion          IN VARCHAR2,
        p_idproveedor          IN VARCHAR2,
        p_idtipofondo          IN NUMBER,
        p_valorfondo           IN NUMBER,
        p_fechainiciovigencia  IN TIMESTAMP,
        p_fechafinvigencia     IN TIMESTAMP,
        p_idusuarioingreso     IN VARCHAR2,
        p_nombreusuarioingreso IN VARCHAR2
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
        SELECT
            idcatalogo
        INTO v_estado_nuevo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADONUEVO';    --2
        SELECT
            idcatalogo
        INTO v_creacion_manual
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'INDCREMANUAL';   --38
        SELECT
            idcatalogo
        INTO v_entidad_fondo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ENTFONDO';       --32
        SELECT
            idcatalogo
        INTO v_tipo_creacion
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'TPCREACION';     --40
        SELECT
            idcatalogo
        INTO v_estado_activo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADOACTIVO';   --1
        SELECT
            idcatalogo
        INTO v_estado_aprobado
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADOAPROBADO'; --4

      -- 2) ¿Hay aprobadores configurados para ENTFONDO + TPCREACION + ACTIVO?
        SELECT
            COUNT(*)
        INTO v_tiene_aprobadores
        FROM
            apl_tb_aprobador
        WHERE
                entidad = v_entidad_fondo
            AND idtipoproceso = v_tipo_creacion
            AND idestadoregistro = v_estado_activo;

        IF v_tiene_aprobadores > 0 THEN
            v_estado_registro := v_estado_nuevo;     -- queda pendiente
        ELSE
            v_estado_registro := v_estado_aprobado;  -- pasa directo
        END IF;

      -- 3) Insertar FONDO
        INSERT INTO apl_tb_fondo (
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
            sysdate,   -- columna TIMESTAMP
            NULL,
            NULL,
            v_estado_registro,
            v_creacion_manual
        ) RETURNING idfondo INTO v_idfondo;

      -- 4) Si hay aprobadores, generar filas en APL_TB_APROBACION (una por aprobador activo)
        IF v_tiene_aprobadores > 0 THEN
            INSERT INTO apl_tb_aprobacion (
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
                    v_entidad_fondo        AS entidad,         -- SIEMPRE el catálogo ENTFONDO
                    v_idfondo              AS identidad,       -- el IdFondo recién creado
                    v_tipo_creacion        AS idtipoproceso,   -- TPCREACION
                    p_idusuarioingreso     AS idusersolicitud,
                    p_nombreusuarioingreso AS nombreusersolicitud,
                    systimestamp           AS fechasolicitud,
                    a.iduseraprobador      AS iduseraprobador,
                    NULL                   AS fechaaprobacion,
                    NULL                   AS comentario,
                    a.nivelaprobacion      AS nivelaprobacion,
                    v_estado_nuevo         AS idestadoregistro
                FROM
                    apl_tb_aprobador a
                WHERE
                        a.entidad = v_entidad_fondo
                    AND a.idtipoproceso = v_tipo_creacion
                    AND a.idestadoregistro = v_estado_activo;

        END IF;

      -- 5) (Opcional) Registrar LOG aquí si lo necesitas

    EXCEPTION
        WHEN no_data_found THEN
      -- Alguna etiqueta de catálogo no existe
            raise_application_error(-20050, 'Falta configurar etiquetas en APL_TB_CATALOGO (ENTFONDO/TPCREACION/ESTADO*).');
    END crear_fondo;

    PROCEDURE actualizar_fondo (
        p_idfondo               IN NUMBER,
        p_descripcion           IN VARCHAR2,
        p_idproveedor           IN VARCHAR2,
        p_idtipofondo           IN NUMBER,
        p_valorfondo            IN NUMBER,
        p_fechainiciovigencia   IN TIMESTAMP,
        p_fechafinvigencia      IN TIMESTAMP,
        p_idusuariomodifica     IN VARCHAR2,
        p_nombreusuariomodifica IN VARCHAR2,
        p_codigo_salida         OUT NUMBER,
        p_mensaje_salida        OUT VARCHAR2
    ) AS
      -- Catálogos
        v_entidad_fondo      NUMBER;
        v_tipo_modificacion  NUMBER;
        v_estado_activo      NUMBER;
        v_estado_nuevo       NUMBER;
        v_estado_modificado  NUMBER;
        v_estado_negado      NUMBER;
        v_estado_aprobado    NUMBER; 

      -- Trabajo
        v_estado_actual      NUMBER;
        v_tiene_aprobadores  NUMBER;
        v_nuevo_estado       NUMBER;
        v_descripcion_actual VARCHAR2(500);
        v_idproveedor_actual VARCHAR2(100);
        v_idtipofondo_actual NUMBER;
        v_valorfondo_actual  NUMBER;
        v_fechainicio_actual TIMESTAMP;
        v_fechafin_actual    TIMESTAMP;
        v_valorcomprometido  NUMBER;
        v_valorliquidado     NUMBER;
    BEGIN
      -- ============================================================================
      -- 1) RESOLVER CATÁLOGOS
      -- ============================================================================
        SELECT
            idcatalogo
        INTO v_entidad_fondo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ENTFONDO';

        SELECT
            idcatalogo
        INTO v_tipo_modificacion
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'TPMODIFICACION';

        SELECT
            idcatalogo
        INTO v_estado_aprobado
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADOAPROBADO';

        SELECT
            idcatalogo
        INTO v_estado_nuevo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADONUEVO';

        SELECT
            idcatalogo
        INTO v_estado_modificado
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADOMODIFICADO';

        SELECT
            idcatalogo
        INTO v_estado_negado
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADONEGADO';

        SELECT
            idcatalogo
        INTO v_estado_activo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADOACTIVO';


      -- ============================================================================
      -- 2) OBTENER DATOS ACTUALES DEL FONDO
      -- ============================================================================
        BEGIN
            SELECT
                idestadoregistro,
                descripcion,
                idproveedor,
                idtipofondo,
                valorfondo,
                fechainiciovigencia,
                fechafinvigencia,
                valorcomprometido,
                valorliquidado
            INTO
                v_estado_actual,
                v_descripcion_actual,
                v_idproveedor_actual,
                v_idtipofondo_actual,
                v_valorfondo_actual,
                v_fechainicio_actual,
                v_fechafin_actual,
                v_valorcomprometido,
                v_valorliquidado
            FROM
                apl_tb_fondo
            WHERE
                idfondo = p_idfondo;

        EXCEPTION
            WHEN no_data_found THEN
                raise_application_error(-20001, 'El fondo con ID '
                                                || p_idfondo
                                                || ' no existe.');
        END;

      -- ============================================================================
      -- 3) VALIDACIÓN: Si el fondo está APROBADO, no se puede modificar
      -- ============================================================================
        IF v_estado_actual = v_estado_aprobado THEN
            p_codigo_salida := -20002;
            p_mensaje_salida := 'Fondo fue aprobado en este momento y no se puede Modificar';
            RETURN;
        END IF;

      -- ============================================================================
      -- 4) VALIDACIÓN: Si el fondo está NEGADO
      -- ============================================================================
        IF v_estado_actual = v_estado_negado THEN
            -- Modificar con los nuevos datos y aplicar validaciones de creación

            -- Verificar si hay aprobadores configurados
            SELECT
                COUNT(*)
            INTO v_tiene_aprobadores
            FROM
                apl_tb_aprobador
            WHERE
                    entidad = v_entidad_fondo
                AND idtipoproceso = v_tipo_modificacion
                AND idestadoregistro = v_estado_activo;

            -- Determinar el nuevo estado
            IF v_tiene_aprobadores > 0 THEN
                v_nuevo_estado := v_estado_nuevo;        -- Queda pendiente aprobación
            ELSE
                v_nuevo_estado := v_estado_aprobado;     -- Pasa directo a aprobado
            END IF;

            -- Actualizar el fondo
            UPDATE apl_tb_fondo
            SET
                descripcion = p_descripcion,
                idproveedor = p_idproveedor,
                idtipofondo = p_idtipofondo,
                valorfondo = p_valorfondo,
                fechainiciovigencia = p_fechainiciovigencia,
                fechafinvigencia = p_fechafinvigencia,
                valordisponible = p_valorfondo - v_valorcomprometido - v_valorliquidado,
                idusuariomodifica = p_idusuariomodifica,
                fechamodifica = sysdate,
                idestadoregistro = v_nuevo_estado
            WHERE
                idfondo = p_idfondo;

            -- Si hay aprobadores, generar aprobaciones
            IF v_tiene_aprobadores > 0 THEN
                INSERT INTO apl_tb_aprobacion (
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
                        v_entidad_fondo         AS entidad,
                        p_idfondo               AS identidad,
                        v_tipo_modificacion     AS idtipoproceso,
                        p_idusuariomodifica     AS idusersolicitud,
                        p_nombreusuariomodifica AS nombreusersolicitud,
                        systimestamp            AS fechasolicitud,
                        a.iduseraprobador       AS iduseraprobador,
                        NULL                    AS fechaaprobacion,
                        NULL                    AS comentario,
                        a.nivelaprobacion       AS nivelaprobacion,
                        v_estado_nuevo          AS idestadoregistro
                    FROM
                        apl_tb_aprobador a
                    WHERE
                            a.entidad = v_entidad_fondo
                        AND a.idtipoproceso = v_tipo_modificacion
                        AND a.idestadoregistro = v_estado_activo;

            END IF;

            RETURN; -- Salir del procedimiento
        END IF;

      -- ============================================================================
      -- 5) VALIDACIÓN: Si el fondo está NUEVO o MODIFICADO - Actualizar normalmente
      -- ============================================================================
        IF v_estado_actual IN ( v_estado_nuevo, v_estado_modificado ) THEN

            -- Verificar si hay aprobadores configurados
            SELECT
                COUNT(*)
            INTO v_tiene_aprobadores
            FROM
                apl_tb_aprobador
            WHERE
                    entidad = v_entidad_fondo
                AND idtipoproceso = v_tipo_modificacion
                AND idestadoregistro = v_estado_activo;

            -- Determinar el nuevo estado
            IF v_tiene_aprobadores > 0 THEN
                v_nuevo_estado := v_estado_modificado;   -- Queda como modificado
            ELSE
                v_nuevo_estado := v_estado_aprobado;     -- Pasa directo a aprobado
            END IF;

            -- Actualizar el fondo
            UPDATE apl_tb_fondo
            SET
                descripcion = p_descripcion,
                idproveedor = p_idproveedor,
                idtipofondo = p_idtipofondo,
                valorfondo = p_valorfondo,
                fechainiciovigencia = p_fechainiciovigencia,
                fechafinvigencia = p_fechafinvigencia,
                valordisponible = p_valorfondo - v_valorcomprometido - v_valorliquidado,
                idusuariomodifica = p_idusuariomodifica,
                fechamodifica = sysdate,
                idestadoregistro = v_nuevo_estado
            WHERE
                idfondo = p_idfondo;

            -- Si hay aprobadores Y el estado era NUEVO, generar aprobaciones
            -- Si el estado era MODIFICADO, actualizar las aprobaciones existentes
            IF v_tiene_aprobadores > 0 THEN
                IF v_estado_actual = v_estado_nuevo THEN
                    -- Actualizar aprobaciones existentes a estado modificado
                    UPDATE apl_tb_aprobacion
                    SET
                        idestadoregistro = v_estado_modificado,
                        fechasolicitud = systimestamp
                    WHERE
                            entidad = v_entidad_fondo
                        AND identidad = p_idfondo
                        AND idtipoproceso = v_tipo_modificacion
                        AND idestadoregistro = v_estado_nuevo;

                ELSE
                    -- Si ya estaba modificado, solo actualizar fecha
                    UPDATE apl_tb_aprobacion
                    SET
                        fechasolicitud = systimestamp
                    WHERE
                            entidad = v_entidad_fondo
                        AND identidad = p_idfondo
                        AND idtipoproceso = v_tipo_modificacion
                        AND idestadoregistro = v_estado_modificado;

                END IF;
            END IF;

        END IF;

    EXCEPTION
        WHEN no_data_found THEN
            p_codigo_salida := -20050;
            p_mensaje_salida := 'Falta configurar etiquetas en APL_TB_CATALOGO (ENTFONDO/TPMODIFICACION/ESTADO*).';
            RETURN;
        WHEN OTHERS THEN
            p_codigo_salida := -20099;
            p_mensaje_salida := 'Error al actualizar fondo: ' || sqlerrm;
            RETURN;
    END actualizar_fondo;

    PROCEDURE sp_listar_fondos (
        p_cursor         OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    ) AS
    BEGIN
        OPEN p_cursor FOR SELECT
                              idfondo,
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
                          FROM
                              apl_tb_fondo
                          ORDER BY
                              fechaingreso DESC;

    EXCEPTION
        WHEN OTHERS THEN
            p_codigo_salida := -20001;
            p_mensaje_salida := 'Error al listar fondos: ' || sqlerrm;
            RETURN;
    END sp_listar_fondos;

    PROCEDURE sp_obtener_fondo_por_id (
        p_idfondo        IN NUMBER,
        p_cursor         OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    ) AS
    BEGIN
        OPEN p_cursor FOR SELECT
                              idfondo,
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
                          FROM
                              apl_tb_fondo
                          WHERE
                              idfondo = p_idfondo;

    EXCEPTION
        WHEN OTHERS THEN
            p_codigo_salida := -20002;
            p_mensaje_salida := 'Error al obtener fondo por ID: ' || sqlerrm;
            RETURN;
    END sp_obtener_fondo_por_id;

END apl_pkg_fondos;