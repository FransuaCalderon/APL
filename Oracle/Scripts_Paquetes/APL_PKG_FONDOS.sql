create or replace PACKAGE apl_pkg_fondos AS
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
        p_idfondo        IN NUMBER,
        p_cursor         OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    );
    
 
    --Procedimiento para mostrar la bandeja de Modificacion
    PROCEDURE sp_bandeja_modificacion (
        p_cursor OUT SYS_REFCURSOR
    );

    --Procedimiento para mostrar la bandeja de Modificacion Por Id
    PROCEDURE sp_bandeja_modificacion_por_id (
        p_idfondo        IN NUMBER,
        p_cursor         OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    );
    
    --Procedimiento para mostrar la bandeja de Inactivacion
    PROCEDURE sp_bandeja_inactivacion (
        p_cursor OUT SYS_REFCURSOR
    );
    
    
    --Procedimiento para mostrar la bandeja de Aprobacion
    PROCEDURE sp_bandeja_consulta_aprobacion (
        p_usuarioaprobador IN VARCHAR2,                   -- Usuario aprobador (OBLIGATORIO)
        p_cursor           OUT SYS_REFCURSOR
    );
    
    --Procedimiento para mostrar la bandeja de Aprobacion Por Id
    PROCEDURE sp_bandeja_consulta_aprobacion_por_id (
        p_idfondo      IN NUMBER,
        p_idaprobacion IN NUMBER,
        p_cursor       OUT SYS_REFCURSOR
    );
    
    PROCEDURE sp_proceso_aprobacion_fondo (       
        p_entidad                   IN NUMBER,
        p_identidad                 IN NUMBER,
        p_idtipoproceso             IN NUMBER,
        p_idetiquetatipoproceso     IN VARCHAR2,
        p_comentario                IN VARCHAR2,
        p_idetiquetaestado          IN VARCHAR2,
        p_idaprobacion              IN NUMBER,
        p_usuarioaprobador          IN VARCHAR2,
        p_codigo_salida             OUT NUMBER,
        p_mensaje_salida            OUT VARCHAR2   
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

    PROCEDURE sp_bandeja_modificacion (
        p_cursor OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_cursor FOR SELECT
                f.idfondo,
                f.descripcion,
                f.idproveedor                                 AS proveedor,
                ct.nombre                                     AS tipo_fondo,
                f.valorfondo                                  AS valor_fondo,
                to_char(f.fechainiciovigencia, 'YYYY-Mon-DD') AS fecha_inicio,
                to_char(f.fechafinvigencia, 'YYYY-Mon-DD')    AS fecha_fin,
                f.valordisponible                             AS valor_disponible,
                f.valorcomprometido                           AS valor_comprometido,
                f.valorliquidado                              AS valor_liquidado,
                ce.nombre                                     AS estado
        FROM
                apl_tb_fondo  f
                LEFT JOIN apl_tb_catalogo ct ON f.idtipofondo = ct.idcatalogo
                LEFT JOIN apl_tb_catalogo ce ON f.idestadoregistro = ce.idcatalogo
        ORDER BY
                f.idfondo;

    END sp_bandeja_modificacion;

    PROCEDURE sp_bandeja_modificacion_por_id (
        p_idfondo        IN NUMBER,
        p_cursor         OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    ) AS
    BEGIN
        OPEN p_cursor FOR SELECT
                f.idfondo,
                f.descripcion,
                f.idproveedor                                 AS proveedor,
                ct.nombre                                     AS tipo_fondo,
                f.valorfondo                                  AS valor_fondo,
                to_char(f.fechainiciovigencia, 'YYYY-Mon-DD') AS fecha_inicio,
                to_char(f.fechafinvigencia, 'YYYY-Mon-DD')    AS fecha_fin,
                f.valordisponible                             AS valor_disponible,
                f.valorcomprometido                           AS valor_comprometido,
                f.valorliquidado                              AS valor_liquidado,
                ce.nombre                                     AS estado
        FROM
                apl_tb_fondo    f
                LEFT JOIN apl_tb_catalogo ct ON f.idtipofondo = ct.idcatalogo
                LEFT JOIN apl_tb_catalogo ce ON f.idestadoregistro = ce.idcatalogo
        WHERE
                f.idfondo = p_idfondo
        ORDER BY
                f.idfondo;

    EXCEPTION
        WHEN no_data_found THEN
            p_codigo_salida := -2000;
            p_mensaje_salida := 'No se encontró el fondo con ID: ' || p_idfondo;
        WHEN OTHERS THEN
            p_codigo_salida := -20002;
            p_mensaje_salida := 'Error al consultar bandeja: ' || sqlerrm;
    END sp_bandeja_modificacion_por_id;

    PROCEDURE sp_bandeja_inactivacion (
        p_cursor OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_cursor FOR SELECT
                f.idfondo,
                f.descripcion,
                f.idproveedor                                 AS proveedor,
                ct.nombre                                     AS tipo_fondo,
                f.valorfondo                                  AS valor_fondo,
                to_char(f.fechainiciovigencia, 'YYYY-Mon-DD') AS fecha_inicio,
                to_char(f.fechafinvigencia, 'YYYY-Mon-DD')    AS fecha_fin,
                f.valordisponible                             AS valor_disponible,
                f.valorcomprometido                           AS valor_comprometido,
                f.valorliquidado                              AS valor_liquidado,
                ce.nombre                                     AS estado
        FROM
                apl_tb_fondo    f
                LEFT JOIN apl_tb_catalogo ct ON f.idtipofondo = ct.idcatalogo
                LEFT JOIN apl_tb_catalogo ce ON f.idestadoregistro = ce.idcatalogo
        ORDER BY
                f.idfondo;

    END sp_bandeja_inactivacion;

    PROCEDURE sp_bandeja_consulta_aprobacion (
        p_usuarioaprobador IN VARCHAR2,     -- Usuario aprobador (OBLIGATORIO)
        p_cursor           OUT SYS_REFCURSOR -- Cursor de salida
    ) AS
    BEGIN
        OPEN p_cursor FOR SELECT
                              x.*
                          FROM
                              (
                                  SELECT
                                      solicitud,
                                      idetiquetatipoproceso,
                                      idtipoproceso,
                                      idfondo,
                                      descripcion,
                                      proveedor,
                                      tipo_fondo,
                                      valor_fondo,
                                      fecha_inicio,
                                      fecha_fin,
                                      valor_disponible,
                                      valor_comprometido,
                                      valor_liquidado,
                                      idestados_fondo,
                                      nombre_estado_fondo,
                                      id_etiqueta_estado_fondo,
                                      nivelaprobacion,
                                      aprobador,
                                      idaprobacion,
                                      entidad_etiqueta,
                                      tipo_proceso_etiqueta,
                                      estado_aprob_etiqueta
                                  FROM
                                      (
                                          SELECT
                                              cp.nombre                                     AS solicitud,
                                              cp.idetiqueta                                 AS idetiquetatipoproceso,
                                              a.idtipoproceso,
                                              f.idfondo,
                                              f.descripcion,
                                              f.idproveedor                                 AS proveedor,
                                              ct.nombre                                     AS tipo_fondo,
                                              f.valorfondo                                  AS valor_fondo,
                                              to_char(f.fechainiciovigencia, 'YYYY-Mon-DD') AS fecha_inicio,
                                              to_char(f.fechafinvigencia, 'YYYY-Mon-DD')    AS fecha_fin,
                                              f.valordisponible                             AS valor_disponible,
                                              f.valorcomprometido                           AS valor_comprometido,
                                              f.valorliquidado                              AS valor_liquidado,
                                              f.idestadoregistro                            AS idestados_fondo,
                                              ce.nombre                                     AS nombre_estado_fondo,
                                              ce.idetiqueta                                 AS id_etiqueta_estado_fondo,
                                              a.nivelaprobacion,
                                              a.iduseraprobador                             AS aprobador,
                                              a.idaprobacion,
                                              en.idetiqueta                                 AS entidad_etiqueta,
                                              cp.idetiqueta                                 AS tipo_proceso_etiqueta,
                                              ea.idetiqueta                                 AS estado_aprob_etiqueta,
                                              ROW_NUMBER()
                                              OVER(PARTITION BY a.entidad, a.identidad, a.idtipoproceso
                                                   ORDER BY
                                                       a.entidad, a.identidad, a.idtipoproceso,
                                                       a.nivelaprobacion ASC
                                              )                                             AS rn
                                          FROM
                                                   apl_tb_fondo f
                                              INNER JOIN apl_tb_aprobacion a ON a.identidad = f.idfondo
                                              LEFT JOIN apl_tb_catalogo   cp ON a.idtipoproceso = cp.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   ct ON f.idtipofondo = ct.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   ce ON f.idestadoregistro = ce.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   en ON a.entidad = en.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   ea ON a.idestadoregistro = ea.idcatalogo
                                          WHERE
                                              ce.idetiqueta IN ( 'ESTADONUEVO', 'ESTADOMODIFICADO', 'ESTADOAPROBADO', 'ESTADOVIGENTE' )
                                              AND en.idetiqueta = 'ENTFONDO'
                                              AND cp.idetiqueta IN ( 'TPCREACION', 'TPINACTIVACION' )
                                              AND ea.idetiqueta = 'ESTADONUEVO'
                                      )
                                  WHERE
                                      rn = 1
                              ) x
                          WHERE
                              x.aprobador = p_usuarioaprobador
                          ORDER BY
                              x.idfondo;

    EXCEPTION
        WHEN OTHERS THEN
            raise_application_error(-20005, 'Error en bandeja de aprobación: ' || sqlerrm);
    END sp_bandeja_consulta_aprobacion;
    
    PROCEDURE sp_bandeja_consulta_aprobacion_por_id (
        p_idfondo       IN NUMBER,
        p_idaprobacion  IN NUMBER,
        p_cursor        OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_cursor FOR 
                        
                          
                SELECT
                    cp.nombre                                     AS solicitud,
                    cp.idetiqueta                                 AS idEtiquetaTipoProceso,
                    a.idtipoproceso,
                    f.idfondo,
                    f.descripcion,
                    f.idproveedor                                 AS proveedor,
                    ct.nombre                                     AS tipo_fondo,
                    f.valorfondo                                  AS valor_fondo,
                    to_char(f.fechainiciovigencia, 'YYYY-Mon-DD') AS fecha_inicio,
                    to_char(f.fechafinvigencia, 'YYYY-Mon-DD')    AS fecha_fin,
                    f.valordisponible                             AS valor_disponible,
                    f.valorcomprometido                           AS valor_comprometido,
                    f.valorliquidado                              AS valor_liquidado,
                    f.idestadoregistro                            AS idEstados_fondo,
                    ce.nombre                                     AS nombre_estado_fondo,
                    ce.idetiqueta                                 AS id_etiqueta_estado_fondo,
                    a.nivelaprobacion,
                    a.iduseraprobador                             AS aprobador,
                    a.idaprobacion,
                    en.idetiqueta                                 AS entidad_etiqueta,
                    cp.idetiqueta                                 AS tipo_proceso_etiqueta,
                    ea.idetiqueta                                 AS estado_aprob_etiqueta
                                             
                                                                                        
                    FROM
                            apl_tb_fondo f
                            INNER JOIN apl_tb_aprobacion a ON a.identidad = p_idfondo--
                            LEFT JOIN apl_tb_catalogo   cp ON a.idtipoproceso = cp.idcatalogo
                            LEFT JOIN apl_tb_catalogo   ct ON f.idtipofondo = ct.idcatalogo
                            LEFT JOIN apl_tb_catalogo   ce ON f.idestadoregistro = ce.idcatalogo
                            LEFT JOIN apl_tb_catalogo   en ON a.entidad = en.idcatalogo
                            LEFT JOIN apl_tb_catalogo   ea ON a.idestadoregistro = ea.idcatalogo
                     WHERE
                            f.idfondo = p_idfondo and a.idaprobacion = p_idaprobacion;
                                                    
                            
                    EXCEPTION
                        WHEN OTHERS
                    then raise_application_error(-20005, 'Error en bandeja de aprobación: ' || sqlerrm);
    end sp_bandeja_consulta_aprobacion_por_id;
    
    PROCEDURE sp_proceso_aprobacion_fondo (
        p_entidad                   IN NUMBER,
        p_identidad                 IN NUMBER,
        p_idtipoproceso             IN NUMBER,
        p_idetiquetatipoproceso     IN VARCHAR2,
        p_comentario                IN VARCHAR2,
        p_idetiquetaestado          IN VARCHAR2,
        p_idaprobacion              IN NUMBER,
        p_usuarioaprobador          IN VARCHAR2,
        p_codigo_salida             OUT NUMBER,
        p_mensaje_salida            OUT VARCHAR2
    ) AS
        -- Variables para IDs de catálogo
        v_idestado             NUMBER;
        v_estadonuevo          NUMBER;
        v_idestadoinactivo     NUMBER;
        
        -- Contador de registros pendientes
        v_registros_pendientes_aprobacion NUMBER := 0;
        
        -- Fecha del sistema
        v_fechasistema            TIMESTAMP := SYSTIMESTAMP;
        
        -- Variables para validación
        v_existe_aprobacion  NUMBER := 0;
        v_existe_fondo       NUMBER := 0;
    
    BEGIN
        -- ===== VALIDACIONES INICIALES =====
        
        -- Validar que existe la aprobación
        SELECT COUNT(*) 
        INTO v_existe_aprobacion
        FROM apl_tb_aprobacion 
        WHERE idaprobacion = p_idaprobacion;
        
        IF v_existe_aprobacion = 0 THEN
            p_mensaje_salida := 'ERROR: No existe la aprobación con ID ' || p_idaprobacion;
            RETURN;
        END IF;
        
        -- Validar que existe el fondo
        SELECT COUNT(*) 
        INTO v_existe_fondo
        FROM apl_tb_fondo 
        WHERE idfondo = p_identidad;
        
        IF v_existe_fondo = 0 THEN
            p_mensaje_salida := 'ERROR: No existe el fondo con ID ' || p_identidad;
            RETURN;
        END IF;
        
        -- ===== OBTENER IDS DE CATÁLOGO =====
        
        BEGIN
            -- ID del estado destino según etiqueta
            SELECT idcatalogo 
            INTO v_idestado 
            FROM apl_tb_catalogo 
            WHERE idetiqueta = p_idetiquetaestado
            AND ROWNUM = 1;
            
            -- ID del estado NUEVO
            SELECT idcatalogo 
            INTO v_estadonuevo
            FROM apl_tb_catalogo 
            WHERE idetiqueta = 'ESTADONUEVO'
            AND ROWNUM = 1;
            
            -- ID del estado INACTIVO
            SELECT idcatalogo 
            INTO v_idestadoinactivo
            FROM apl_tb_catalogo 
            WHERE idetiqueta = 'ESTADOINACTIVO'
            AND ROWNUM = 1;
            
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                p_mensaje_salida := 'ERROR: No se encontraron las etiquetas de catálogo necesarias';
                RETURN;
        END;
        
        -- ===== PASO 1: ACTUALIZAR APROBACIÓN =====
        
        UPDATE apl_tb_aprobacion 
        SET 
            fechaaprobacion = v_fechasistema,
            comentario = p_comentario,
            idestadoregistro = v_idestado
        WHERE 
            idaprobacion = p_idaprobacion;
        
        IF SQL%ROWCOUNT = 0 THEN
            p_mensaje_salida := 'ERROR: No se pudo actualizar la aprobación';
            ROLLBACK;
            RETURN;
        END IF;
        
        -- ===== PASO 2: VERIFICAR APROBACIONES PENDIENTES =====
        
        SELECT COUNT(*) 
        INTO v_registros_pendientes_aprobacion
        FROM apl_tb_aprobacion 
        WHERE 
            entidad = p_entidad                  --32
            AND identidad = p_identidad          --1
            AND idtipoproceso = p_idtipoproceso  --42
            AND idestadoregistro = v_estadonuevo; --4
        
        -- ===== PASO 3: ACTUALIZAR FONDO SI NO HAY PENDIENTES =====
        
        IF v_registros_pendientes_aprobacion = 0 THEN
            
            -- Caso 1: CREACIÓN
            IF UPPER(p_idetiquetatipoproceso) = 'TPCREACION' THEN
                
                UPDATE apl_tb_fondo 
                SET 
                    idusuariomodifica = p_usuarioaprobador,
                    fechamodifica = v_fechasistema,
                    idestadoregistro = v_idestado
                WHERE 
                    idfondo = p_identidad;
                    
                IF SQL%ROWCOUNT = 0 THEN
                    p_mensaje_salida := 'ERROR: No se pudo actualizar el fondo';
                    ROLLBACK;
                    RETURN;
                END IF;
                
                p_mensaje_salida := 'OK: Fondo creado y aprobado exitosamente';
            
            -- Caso 2: INACTIVACIÓN
            ELSIF UPPER(p_idetiquetatipoproceso) = 'TPINACTIVACION' THEN
                
                -- Solo inactivar si el estado es APROBADO
                IF UPPER(p_idetiquetaestado) = 'ESTADOAPROBADO' THEN
                    
                    UPDATE apl_tb_fondo 
                    SET 
                        idusuariomodifica = p_usuarioaprobador,
                        fechamodifica = v_fechasistema,
                        idestadoregistro = v_idestadoinactivo,
                        valordisponible = 0
                    WHERE 
                        idfondo = p_identidad;
                        
                    IF SQL%ROWCOUNT = 0 THEN
                        p_mensaje_salida := 'ERROR: No se pudo inactivar el fondo';
                        ROLLBACK;
                        RETURN;
                    END IF;
                    
                    p_mensaje_salida := 'OK: Fondo inactivado exitosamente';
                    
                ELSE
                    p_mensaje_salida := 'OK: Aprobación rechazada, fondo no inactivado';
                END IF;
                
            ELSE
                p_mensaje_salida:= 'ERROR: Tipo de proceso no reconocido: ' || p_idetiquetatipoproceso;
                ROLLBACK;
                RETURN;
            END IF;
            
        ELSE
            p_mensaje_salida := 'OK: Aprobación registrada. Quedan ' || v_registros_pendientes_aprobacion || ' aprobaciones pendientes';
        END IF;
        
        -- Confirmar transacción
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_codigo_salida := -20006;
            p_mensaje_salida := 'Error en proceso de aprobación: ' || SQLERRM;
            
            
    END sp_proceso_aprobacion_fondo;

    
end apl_pkg_fondos;