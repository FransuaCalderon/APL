create or replace PACKAGE APL_PKG_ACUERDOS AS  
    -- Declaración de tipos públicos
    TYPE t_cursor IS REF CURSOR;


    -- Declaración de procedimientos públicos
    PROCEDURE sp_listar_consulta_fondo(
        p_cursor    OUT t_cursor,
        p_codigo    OUT NUMBER,
        p_mensaje   OUT VARCHAR2
    );

    -- Declaración crear acuerdo
    PROCEDURE sp_crear_acuerdo(
        p_tipo_clase_etiqueta     IN  VARCHAR2,
        p_json_cabecera           IN  CLOB,
        p_json_fondo              IN  CLOB DEFAULT NULL,      -- Para GENERAL
        p_json_articulos          IN  CLOB DEFAULT NULL,      -- Para CON ARTICULOS
        p_idacuerdo_out           OUT NUMBER,
        p_idopcion                IN NUMBER,
        p_idcontrolinterfaz       IN VARCHAR2,
        p_idevento_etiqueta       IN VARCHAR2,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    );
    
    /*
    =========================================================
    Descripción: Bandeja Consulta / Aprobacion Acuerdo
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_aprobacion_acuerdos (
        p_usuarioaprobador        IN VARCHAR2,                   -- Usuario aprobador (OBLIGATORIO)
        p_cursor                  OUT SYS_REFCURSOR,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    );
    
    PROCEDURE sp_consulta_bandeja_aprobacion_por_id (
        p_idacuerdo            IN  NUMBER,
        p_idaprobacion         IN  NUMBER,
        p_cursor_cabecera      OUT SYS_REFCURSOR,
        p_cursor_articulos     OUT SYS_REFCURSOR,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    );
    
    PROCEDURE sp_proceso_aprobacion_acuerdo (
        p_entidad                   IN NUMBER,
        p_identidad                 IN NUMBER,
        p_idtipoproceso             IN NUMBER,
        p_idetiquetatipoproceso     IN VARCHAR2,
        p_comentario                IN VARCHAR2,
        p_idetiquetaestado          IN VARCHAR2,
        p_idaprobacion              IN NUMBER,
        p_usuarioaprobador          IN VARCHAR2,
        -- Parámetros para el LOG
        p_idopcion                  IN NUMBER, 
        p_idcontrolinterfaz         IN VARCHAR2,
        p_idevento_etiqueta         IN VARCHAR2,
        p_nombreusuario             IN VARCHAR2,  
        p_codigo_salida             OUT NUMBER,
        p_mensaje_salida            OUT VARCHAR2
    );
    
    /*
    =========================================================
    Descripción: Bandeja Consulta / Modificacion Acuerdo 
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_modificacion (
        p_cursor          OUT t_cursor,
        p_codigo_salida   OUT NUMBER,
        p_mensaje_salida  OUT VARCHAR2
    );
    
    PROCEDURE sp_consulta_bandeja_modificacion_por_id (
        p_idacuerdo            IN  NUMBER,
        p_cursor_cabecera      OUT SYS_REFCURSOR,
        p_cursor_articulos     OUT SYS_REFCURSOR,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    );
    
    PROCEDURE sp_modificar_acuerdo (
        -- Parámetros del acuerdo
        p_idacuerdo             IN NUMBER,
        p_claseacuerdo          IN VARCHAR2,        -- 'CLAGENERAL' o 'CLAARTICULO'
        p_idmotivoacuerdo       IN NUMBER,
        p_descripcion           IN VARCHAR2,
        p_fechainiciovigencia   IN TIMESTAMP,
        p_fechafinvigencia      IN TIMESTAMP,
        p_idusuariomodifica     IN VARCHAR2,
        p_idtipoproceso         IN NUMBER,
        
        -- Parámetros del fondo
        p_idfondo               IN NUMBER,
        p_valoraporte           IN NUMBER,
        p_valordisponible       IN NUMBER,
        p_valorcomprometido     IN NUMBER DEFAULT NULL,
        p_valorliquidado        IN NUMBER DEFAULT NULL,
        
        -- JSON de artículos (solo para CLAARTICULO)
        p_json_articulos        IN CLOB DEFAULT NULL,
        
        --parametros para el log
        p_idopcion                IN NUMBER,
        p_idcontrolinterfaz       IN VARCHAR2,
        p_idevento_etiqueta       IN VARCHAR2,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    );
    
    /*
    =========================================================
    Descripción: Bandeja Consulta / Inactivacion Acuerdo 
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_inactivacion_acuerdo(
        p_cursor OUT SYS_REFCURSOR
    );
    
    PROCEDURE sp_consulta_bandeja_inactivacion_acuerdo_por_id (
        p_idacuerdo            IN  NUMBER,
        p_cursor_cabecera      OUT SYS_REFCURSOR,
        p_cursor_articulos     OUT SYS_REFCURSOR,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    );
    
    
    PROCEDURE sp_proceso_inactivacion_acuerdo (
        p_idacuerdo             IN  NUMBER,
        p_nombreusuarioingreso  IN  VARCHAR2,
        -- Variables log
        p_idopcion              IN  NUMBER,
        p_idcontrolinterfaz     IN  VARCHAR2,
        p_idevento_etiqueta     IN  VARCHAR2,
        p_nombreusuario         IN  VARCHAR2,  
        -- Variables de salida
        p_codigo_salida         OUT NUMBER,
        p_mensaje               OUT VARCHAR2
    );
    
    /*
    =========================================================
    Descripción: Bandeja Consulta / Acuerdo 
    =========================================================
    */
    PROCEDURE sp_bandeja_consulta_acuerdo (
        p_cursor          OUT t_cursor, 
        p_codigo_salida     OUT NUMBER,
        p_mensaje_salida    OUT VARCHAR2
    );
    
    
    PROCEDURE sp_bandeja_consulta_acuerdo_por_id (
        p_idacuerdo            IN  NUMBER,
        p_cursor_cabecera      OUT t_cursor,
        p_cursor_articulos     OUT t_cursor,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    );
   

END APL_PKG_ACUERDOS;

------------------------------------------body----

create or replace PACKAGE BODY apl_pkg_fondos AS
    
    PROCEDURE crear_fondo (
        p_descripcion          IN VARCHAR2,
        p_idproveedor          IN VARCHAR2,
        p_idtipofondo          IN NUMBER,
        p_valorfondo           IN NUMBER,
        p_fechainiciovigencia  IN TIMESTAMP,
        p_fechafinvigencia     IN TIMESTAMP,
        p_idusuarioingreso     IN VARCHAR2,
        p_nombreusuarioingreso IN VARCHAR2,
        --parametros para el log
        p_idopcion             IN NUMBER, 
        p_idcontrolinterfaz    IN VARCHAR2,
        p_idevento_etiqueta    IN VARCHAR2,
        p_nombreusuario        IN VARCHAR2,  
        p_idfondo              OUT NUMBER,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
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

      -- Variables para LOG
        v_datos_json             VARCHAR2(4000);
        v_id_control_interfaz    NUMBER;
        v_idevento               NUMBER;
      --Variable para el lote
        v_numero_lote_aprobacion NUMBER;
        v_row_exists             NUMBER;

    BEGIN

      --VARIABLES PARA EL LOG
        SELECT idcatalogo INTO v_id_control_interfaz FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
        SELECT idcatalogo INTO v_idevento FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;

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
            v_estado_registro := v_estado_nuevo;     -- NUEVO

             -- Validar que el fondo existe
             SELECT
                CASE
                    WHEN EXISTS (SELECT 1 FROM apl_tb_lote WHERE entidad = v_entidad_fondo 
                    ) THEN
                     1
                    ELSE
                     0
                END

                INTO v_row_exists
                FROM
                    dual;

                IF v_row_exists = 0  THEN
                    v_numero_lote_aprobacion := 1;
                    INSERT INTO apl_tb_lote (
                        entidad,
                        secuencial
                    )VALUES(
                        v_entidad_fondo,
                        v_numero_lote_aprobacion
                    );
                ELSE 
                    SELECT secuencial INTO v_numero_lote_aprobacion FROM apl_tb_lote WHERE entidad = v_entidad_fondo;
                     v_numero_lote_aprobacion := v_numero_lote_aprobacion + 1;
                     UPDATE apl_tb_lote  
                     SET secuencial = v_numero_lote_aprobacion
                     WHERE entidad = v_entidad_fondo;
                END IF;
        ELSE
            v_estado_registro := v_estado_aprobado;  -- APROBADO
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
            indicadorcreacion,
            marcaprocesoaprobacion,
            numeroloteaprobacion
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
            v_creacion_manual,
            ' ',
            v_numero_lote_aprobacion
        ) RETURNING idfondo INTO v_idfondo;

        p_idfondo := v_idfondo;

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
                idestadoregistro,
                numeroloteaprobacion
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
                    v_estado_nuevo         AS idestadoregistro,
                    v_numero_lote_aprobacion
                FROM
                    apl_tb_aprobador a
                WHERE
                        a.entidad = v_entidad_fondo
                    AND a.idtipoproceso = v_tipo_creacion
                    AND a.idestadoregistro = v_estado_activo;

        END IF;

      -- 5) (Opcional) Registrar LOG aquí si lo necesitas
       v_datos_json := JSON_OBJECT(
            'idfondo' VALUE v_idfondo,
            'descripcion' VALUE p_descripcion,
            'idproveedor' VALUE p_idproveedor,
            'idtipofondo' VALUE p_idtipofondo,
            'valorfondo' VALUE p_valorfondo,
            'fechainiciovigencia' VALUE TO_CHAR(p_fechainiciovigencia, 'YYYY-MM-DD HH24:MI:SS'),
            'fechafinvigencia' VALUE TO_CHAR(p_fechafinvigencia, 'YYYY-MM-DD HH24:MI:SS'),
            'valordisponible' VALUE p_valorfondo,
            'valorcomprometido' VALUE 0,
            'valorliquidado' VALUE 0,
            'idusuarioingreso' VALUE p_idusuarioingreso,
            'fechaingreso' VALUE TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'),
            'idestadoregistro' VALUE v_estado_registro,
            'indicadorcreacion' VALUE v_creacion_manual,
            'numeroloteaprobacion' VALUE v_numero_lote_aprobacion
        );

        -- Insertar en la tabla de LOG
        INSERT INTO apl_tb_log (
            fechahoratrx,
            iduser,
            idopcion,
            idcontrolinterfaz ,
            idevento,
            entidad,
            identidad,
            idtipoproceso,        
            datos
        ) VALUES (
            SYSTIMESTAMP,
            p_idusuarioingreso,
            p_idopcion, 
            v_id_control_interfaz, 
            v_idevento, 
            v_entidad_fondo,
            v_idfondo,
            v_tipo_creacion,
            v_datos_json
        );


        -- Confirmar la transacción si es necesario
        COMMIT;


    EXCEPTION
        WHEN no_data_found THEN
      -- Alguna etiqueta de catálogo no existe
            p_codigo_salida    := -20050;
            p_mensaje_salida       := 'Falta configurar etiquetas en APL_TB_CATALOGO (ENTFONDO/TPCREACION/ESTADO*).';

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
         --parametros para el log
        p_idopcion              IN NUMBER,           
        p_idcontrolinterfaz     IN VARCHAR2,           
        p_idevento_etiqueta     IN VARCHAR2,
        p_nombreusuario         IN VARCHAR2,  
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
        v_valordisponible    NUMBER; --
        v_filas_afectadas    NUMBER;

        --nuevas
        --v_entidad_fondo     NUMBER;
         v_tipo_creacion     NUMBER;
        --v_estado_activo     NUMBER;

      -- Variables para LOG
        v_datos_json            VARCHAR2(4000);
        v_id_control_interfaz   NUMBER;
        v_idevento              NUMBER;

    BEGIN
        --VARIABLES PARA EL LOG
        SELECT idcatalogo INTO v_id_control_interfaz FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
        SELECT idcatalogo INTO v_idevento FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;

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

       --nuevos 
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
        INTO v_entidad_fondo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ENTFONDO';       --32


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
                idestadoregistro = v_estado_modificado
            WHERE
                idfondo = p_idfondo;

            --generar el registros de aprobaciones [VALIDACION NUEVA]
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
                        v_entidad_fondo         AS entidad,         -- SIEMPRE el catálogo ENTFONDO
                        p_idfondo               AS identidad,       -- el IdFondo recién creado
                        v_tipo_creacion         AS idtipoproceso,   -- TPCREACION
                        p_idusuariomodifica     AS idusuarioModifica,
                        p_nombreusuariomodifica AS nombreusuarioModifica,
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
                AND a.idtipoproceso = v_tipo_creacion
                AND a.idestadoregistro = v_estado_activo;

            END IF;


            -- Construir JSON con los datos actualizados
            v_datos_json := JSON_OBJECT(
                'idfondo' VALUE p_idfondo,
                'descripcion' VALUE p_descripcion,
                'idproveedor' VALUE p_idproveedor,
                'idtipofondo' VALUE p_idtipofondo,
                'valorfondo' VALUE p_valorfondo,
                'fechainiciovigencia' VALUE TO_CHAR(p_fechainiciovigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechafinvigencia' VALUE TO_CHAR(p_fechafinvigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'valorcomprometido' VALUE v_valorcomprometido,
                'valorliquidado' VALUE v_valorliquidado,
                'idusuariomodifica' VALUE p_idusuariomodifica,
                'fechamodifica' VALUE TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'),
                'idestadoregistro' VALUE v_nuevo_estado,
                'estado_anterior' VALUE v_estado_actual,
                'accion' VALUE 'Modificación desde estado NEGADO'
            );

            -- Insertar en LOG
            INSERT INTO apl_tb_log (
                fechahoratrx,
                iduser,
                idopcion,
                idcontrolinterfaz,
                idevento,
                entidad,
                identidad,
                idtipoproceso,
                datos
            ) VALUES (
                SYSTIMESTAMP,
                p_idusuariomodifica,
                p_idopcion,
                v_id_control_interfaz,
                v_idevento,
                v_entidad_fondo,
                p_idfondo,
                v_tipo_modificacion,
                v_datos_json
            );

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

            p_codigo_salida := 0;
            p_mensaje_salida := 'Fondo actualizado correctamente desde estado NEGADO. Log ID: ';
            COMMIT;

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
                idestadoregistro = v_estado_modificado
            WHERE
                idfondo = p_idfondo;

            -- Construir JSON con los datos actualizados
            v_datos_json := JSON_OBJECT(
                'idfondo' VALUE p_idfondo,
                'descripcion' VALUE p_descripcion,
                'idproveedor' VALUE p_idproveedor,
                'idtipofondo' VALUE p_idtipofondo,
                'valorfondo' VALUE p_valorfondo,
                'fechainiciovigencia' VALUE TO_CHAR(p_fechainiciovigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechafinvigencia' VALUE TO_CHAR(p_fechafinvigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'valorcomprometido' VALUE v_valorcomprometido,
                'valorliquidado' VALUE v_valorliquidado,
                'idusuariomodifica' VALUE p_idusuariomodifica,
                'fechamodifica' VALUE TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'),
                'idestadoregistro' VALUE v_nuevo_estado,
                'estado_anterior' VALUE v_estado_actual,
                'accion' VALUE CASE 
                    WHEN v_estado_actual = v_estado_nuevo THEN 'Modificación desde estado NUEVO'
                    ELSE 'Modificación desde estado MODIFICADO'
                END
            );

             -- Insertar en LOG
            INSERT INTO apl_tb_log (
                fechahoratrx,
                iduser,
                idopcion,
                idcontrolinterfaz,
                idevento,
                entidad,
                identidad,
                idtipoproceso,
                datos
            ) VALUES (
                SYSTIMESTAMP,
                p_idusuariomodifica,
                p_idopcion,
                v_id_control_interfaz,
                v_idevento,
                v_entidad_fondo,
                p_idfondo,
                v_tipo_modificacion,
                v_datos_json
            );

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

            --nuevo
            p_codigo_salida := 0;
            p_mensaje_salida := 'Fondo actualizado correctamente. Log ID: ';
            COMMIT;
            RETURN;

        END IF;

        -- Si no cumple ninguna condición
        p_codigo_salida := -20003;
        p_mensaje_salida := 'Estado del fondo no válido para modificación';

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
        p_cursor               OUT SYS_REFCURSOR,
        --p_nombreusuario        IN VARCHAR2, 
        --p_idopcion             IN NUMBER, 
        --p_idcontrolinterfaz    IN VARCHAR2,
        --p_idevento_etiqueta    IN VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
        ) AS
        --v_id_control_interfaz    NUMBER;
        --v_idevento               NUMBER;
        BEGIN

            -- Obtener IDs de catálogo
            --SELECT idcatalogo INTO v_id_control_interfaz FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
            --SELECT idcatalogo INTO v_idevento FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;

            OPEN p_cursor FOR SELECT
                    f.idfondo,
                    f.descripcion,
                    f.idproveedor,
                    COALESCE(
                        arp.nombre,
                        -- Extraer nombre después del guión del campo adicional
                        TRIM(SUBSTR(cat_prov.adicional, INSTR(cat_prov.adicional, '-') + 1))
                    ) AS nombre_proveedor,
                    f.idtipofondo,
                    ca.nombre as nombre_tipo_fondo,
                    f.valorfondo,
                    f.fechainiciovigencia,
                    f.fechafinvigencia,
                    f.valordisponible,
                    f.valorcomprometido,
                    f.valorliquidado,
                    f.idusuarioingreso,
                    f.fechaingreso,
                    f.idusuariomodifica,
                    f.fechamodifica,
                    f.idestadoregistro,
                    f.indicadorcreacion,
                    --
                    c.idcatalogo    AS estado_id,
                    c.nombre        AS estado_nombre,
                    c.idetiqueta    AS estado_etiqueta
            FROM
                    apl_tb_fondo f
                    LEFT JOIN apl_tb_catalogo c ON c.idcatalogo = f.idestadoregistro
                    LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = f.idtipofondo
                    LEFT JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    -- JOIN con catálogo para RUC propio
                    LEFT JOIN apl_tb_catalogo cat_prov 
                        ON cat_prov.adicional LIKE f.idproveedor || '-%'
                        AND cat_prov.idetiqueta = 'RUCPROPIO' 
                        
                    ORDER BY
                    fechaingreso DESC;

        EXCEPTION
            WHEN OTHERS THEN
                p_codigo_salida := -20001;
                p_mensaje_salida := 'Error al listar fondos: ' || sqlerrm;
                RETURN;
    END sp_listar_fondos;


    PROCEDURE sp_inactivacion_fondo (
        p_idfondo               IN NUMBER,
        p_nombreusuarioingreso  IN VARCHAR2,
        --variables log
        p_idopcion              IN NUMBER,
        p_idcontrolinterfaz     IN VARCHAR2,
        p_idevento_etiqueta     IN VARCHAR2,
        p_nombreusuario         IN VARCHAR2,  
        p_codigo_salida         OUT NUMBER,
        p_mensaje               OUT VARCHAR2
    ) AS
        -- Variables catalogo
        v_count_aprobadores     NUMBER;
        v_estado_actual         NUMBER;
        v_row_exists            NUMBER;

        --variables
        v_entidad_fondo           NUMBER;
        v_tipo_proceso_inactivar  NUMBER;
        v_tipo_proceso_aprobador  NUMBER;
        v_estado_activo           NUMBER;
        v_estado_inactivo         NUMBER;
        v_estado_vigente          NUMBER;
        v_estado_aprobado         NUMBER;
        v_estado_nuevo            NUMBER;


        --variable log
        v_datos_json             VARCHAR2(4000);
        v_id_control_interfaz    NUMBER;
        v_idevento               NUMBER;

         --Variable para el lote
        v_numero_lote_aprobacion      NUMBER;
        v_row_exists_lote             NUMBER;

    BEGIN

      --VARIABLES PARA EL LOG
        SELECT idcatalogo INTO v_id_control_interfaz FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
        SELECT idcatalogo INTO v_idevento FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;

        --catalogos
        SELECT idcatalogo INTO v_entidad_fondo FROM apl_tb_catalogo WHERE idetiqueta = 'ENTFONDO';       

        SELECT idcatalogo INTO v_tipo_proceso_inactivar FROM apl_tb_catalogo WHERE idetiqueta = 'TPINACTIVACION';

        SELECT idcatalogo INTO v_tipo_proceso_aprobador FROM apl_tb_catalogo WHERE idetiqueta = 'TPCREACION';

        SELECT idcatalogo INTO v_estado_activo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOACTIVO';   

        SELECT idcatalogo INTO v_estado_inactivo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOINACTIVO';

        SELECT idcatalogo INTO v_estado_vigente  FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOVIGENTE'; 

        SELECT idcatalogo INTO v_estado_aprobado  FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOAPROBADO'; 

        SELECT idcatalogo INTO v_estado_nuevo  FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO'; 


        -- Validar que el fondo existe
         SELECT
            CASE
                WHEN EXISTS (SELECT 1 FROM apl_tb_fondo WHERE idfondo = p_idfondo
                ) THEN
                 1
                ELSE
                 0
            END

            INTO v_row_exists
            FROM
                dual;

            IF v_row_exists = 0  THEN
                p_codigo_salida := -1;
                p_mensaje := 'El fondo con ID ' || p_idfondo || ' no existe';
                RETURN;

            END IF;

        -- Obtener estado actual del fondo    
        SELECT IDESTADOREGISTRO INTO v_estado_actual FROM apl_tb_fondo WHERE IDFONDO = p_idfondo; 

        -- Validar que el fondo no esté ya inactivo
        IF v_estado_actual = v_estado_inactivo THEN
            p_codigo_salida := -2;
            p_mensaje := 'El fondo ya se encuentra inactivo';
            RETURN;
        END IF;

        -- Validar que el fondo solo este 'APROBADO' O 'VIGENTE'
        IF  v_estado_actual NOT IN (v_estado_vigente, v_estado_aprobado) THEN
            p_codigo_salida := -2;
            p_mensaje := 'El fondo debe estar vigente o aprobado';
            RETURN;
        END IF;


        -- ¿Hay aprobadores configurados para ENTFONDO + TPINACTIVACION + ACTIVO?
        SELECT
            COUNT(*)
        INTO v_count_aprobadores
        FROM
            apl_tb_aprobador
        WHERE
                entidad = v_entidad_fondo
            AND idtipoproceso = v_tipo_proceso_inactivar
            AND idestadoregistro = v_estado_activo;


        -- CASO A: NO HAY APROBADORES - Actualizar directamente
        IF v_count_aprobadores = 0 THEN
            UPDATE apl_tb_fondo
            SET 
                IDESTADOREGISTRO = v_estado_inactivo,
                VALORDISPONIBLE = 0.00,
                FECHAMODIFICA = SYSTIMESTAMP,
                IDUSUARIOMODIFICA = p_nombreusuarioingreso,
                MARCAPROCESOAPROBACION = ' '
            WHERE IDFONDO = p_idfondo;

            p_codigo_salida := 0;
            p_mensaje := 'Fondo inactivado directamente (sin aprobadores).';

        --CASO B: Si hay aprobadores, generar filas en APL_TB_APROBACION (una por aprobador activo)
        ELSE
        DBMS_OUTPUT.PUT_LINE('DEBUG - Entrando a CASO B: Con ' || v_count_aprobadores || ' aprobadores');

             -- Validar que el lote exista
             SELECT
                CASE
                    WHEN EXISTS (SELECT 1 FROM apl_tb_lote WHERE entidad = v_entidad_fondo 
                    ) THEN
                     1
                    ELSE
                     0
                END

                INTO v_row_exists_lote
                FROM
                    dual;

             IF v_row_exists_lote = 0  THEN
                    v_numero_lote_aprobacion := 1;
                    INSERT INTO apl_tb_lote (
                        entidad,
                        secuencial
                    )VALUES(
                        v_entidad_fondo,
                        v_numero_lote_aprobacion
                    );
              ELSE 
                    SELECT secuencial INTO v_numero_lote_aprobacion FROM apl_tb_lote WHERE entidad = v_entidad_fondo;
                     v_numero_lote_aprobacion := v_numero_lote_aprobacion + 1;
                     UPDATE apl_tb_lote  
                     SET secuencial = v_numero_lote_aprobacion
                     WHERE entidad = v_entidad_fondo;
              END IF;



            --Insertar solicitudes de aprobación
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
                idestadoregistro,
                numeroloteaprobacion
            )
                SELECT
                    v_entidad_fondo                 AS entidad,         
                    p_idfondo                       AS identidad,       
                    v_tipo_proceso_inactivar        AS idtipoproceso,   
                    p_nombreusuarioingreso          AS idusersolicitud,
                    p_nombreusuarioingreso          AS nombreusersolicitud,
                    systimestamp                    AS fechasolicitud,
                    a.iduseraprobador               AS iduseraprobador,
                    NULL                            AS fechaaprobacion,
                    NULL                            AS comentario,
                    a.nivelaprobacion               AS nivelaprobacion,
                    v_estado_nuevo                  AS idestadoregistro,
                    v_numero_lote_aprobacion
                FROM
                    apl_tb_aprobador a
                WHERE
                        a.entidad = v_entidad_fondo
                    AND a.idtipoproceso = v_tipo_proceso_inactivar
                    AND a.idestadoregistro = v_estado_activo;

              UPDATE apl_tb_fondo  
                     SET numeroloteaprobacion = v_numero_lote_aprobacion
                     WHERE idfondo = p_idfondo;

              p_codigo_salida := 0;
              p_mensaje := 'Solicitud de inactivación generada. Pendiente de aprobación (' || v_count_aprobadores || ' aprobador(es))';
        END IF;

         -- Registrar LOG aquí si lo necesitas
        IF v_count_aprobadores = 0 THEN
		   v_datos_json := JSON_OBJECT(
				'idfondo' VALUE p_idfondo,
				'valorcomprometido' VALUE 0,
				'valorliquidado' VALUE 0,
				'idusuarioingreso' VALUE p_nombreusuarioingreso,
				'fechaingreso' VALUE TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'),
				'idestadoregistro' VALUE v_tipo_proceso_inactivar,
                'numeroloteaprobacion' VALUE 0,
				'comentario' VALUE 'Inactivacion Directa sin aprobadores'
			);

		 ELSE
			 v_datos_json := JSON_OBJECT(
				'idfondo' VALUE p_idfondo,
				'valorcomprometido' VALUE 0,
				'valorliquidado' VALUE 0,
				'idusuarioingreso' VALUE p_nombreusuarioingreso,
				'fechaingreso' VALUE TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'),
				'idestadoregistro' VALUE v_tipo_proceso_inactivar,
                'numeroloteaprobacion' VALUE v_numero_lote_aprobacion,
				'comentario' VALUE 'Solicitud de inactivacion que requiere aprobacion'
			);
		 END IF;

        -- Insertar en la tabla de LOG
        INSERT INTO apl_tb_log (
            fechahoratrx,
            iduser,
            idopcion,
            idcontrolinterfaz,
            idevento,
            entidad,
            identidad,
            idtipoproceso,
            datos
        ) VALUES (
            SYSTIMESTAMP,
            p_nombreusuarioingreso,
            p_idopcion, 
            v_id_control_interfaz,
            v_idevento,
            v_entidad_fondo,
            p_idfondo,
            v_tipo_proceso_inactivar,
            v_datos_json
        );

        COMMIT;



        --END IF;

        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK;
                p_codigo_salida := -99;
                p_mensaje := 'Error al inactivar fondo: ' || SQLERRM;


    END sp_inactivacion_fondo;


    PROCEDURE sp_bandeja_inactivacion (
        p_cursor OUT SYS_REFCURSOR
    ) AS
    --VARIABLES
    v_entidad_fondo          NUMBER;
    v_estado_nuevo           NUMBER;
    v_tipo_proceso_inactivar NUMBER;

    BEGIN

        --CATALOGOS
        SELECT idcatalogo INTO v_entidad_fondo FROM apl_tb_catalogo WHERE idetiqueta = 'ENTFONDO';       

        SELECT idcatalogo INTO v_estado_nuevo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';    

        SELECT idcatalogo INTO v_tipo_proceso_inactivar FROM apl_tb_catalogo WHERE idetiqueta = 'TPINACTIVACION';


        OPEN p_cursor FOR SELECT
                f.idfondo,
                f.descripcion,
                f.idproveedor                                 AS proveedor,
                COALESCE(
                    arp.nombre,
                    -- Extraer nombre después del guión del campo adicional
                    TRIM(SUBSTR(cat_prov.adicional, INSTR(cat_prov.adicional, '-') + 1))
                ) AS nombre_proveedor,
                f.idtipofondo,
                    ca.nombre as nombre_tipo_fondo,
                f.valorfondo                                  AS valor_fondo,
                to_char(f.fechainiciovigencia, 'YYYY-MM-DD')  AS fecha_inicio,
                to_char(f.fechafinvigencia, 'YYYY-MM-DD')     AS fecha_fin,
                f.valordisponible                             AS valor_disponible,
                f.valorcomprometido                           AS valor_comprometido,
                f.valorliquidado                              AS valor_liquidado,
                c.nombre                                     AS estado,
                c.idetiqueta                                 AS estado_etiqeuta
        FROM
                apl_tb_fondo f
                LEFT JOIN apl_tb_catalogo c ON c.idcatalogo = f.idestadoregistro
                LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = f.idtipofondo
                LEFT JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                -- JOIN con catálogo para RUC propio
                LEFT JOIN apl_tb_catalogo cat_prov 
                ON cat_prov.adicional LIKE f.idproveedor || '-%'
                AND cat_prov.idetiqueta = 'RUCPROPIO' 
        WHERE 
                c.idetiqueta IN ('ESTADOAPROBADO', 'ESTADOVIGENTE') AND 
                (SELECT COUNT(*) FROM apl_tb_aprobacion WHERE entidad = v_entidad_fondo AND identidad = f.idfondo AND idtipoproceso = v_tipo_proceso_inactivar AND idestadoregistro = v_estado_nuevo) = 0
        ORDER BY
                f.idfondo;

    END sp_bandeja_inactivacion;


    PROCEDURE sp_obtener_fondo_por_id (
        p_idfondo        IN NUMBER,
        p_cursor         OUT SYS_REFCURSOR,
        p_codigo_salida  OUT NUMBER,
        p_mensaje_salida OUT VARCHAR2
    ) AS
    BEGIN
        OPEN p_cursor FOR SELECT
                    f.idfondo,
                    f.descripcion,
                    f.idproveedor,
                    COALESCE(
                        arp.nombre,
                        -- Extraer nombre después del guión del campo adicional
                        TRIM(SUBSTR(cat_prov.adicional, INSTR(cat_prov.adicional, '-') + 1))
                    ) AS nombre_proveedor,
                    f.idtipofondo,
                    ca.nombre as nombre_tipo_fondo,
                    f.valorfondo,
                    f.fechainiciovigencia,
                    f.fechafinvigencia,
                    f.valordisponible,
                    f.valorcomprometido,
                    f.valorliquidado,
                    f.idusuarioingreso,
                    f.fechaingreso,
                    f.idusuariomodifica,
                    f.fechamodifica,
                    f.idestadoregistro,
                    f.indicadorcreacion,
                    c.idcatalogo    AS estado_id,
                    c.nombre        AS estado_nombre,
                    c.idetiqueta    AS estado_etiqueta
         FROM
                 apl_tb_fondo f
                 LEFT JOIN apl_tb_catalogo c ON c.idcatalogo = f.idestadoregistro
                 LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = f.idtipofondo
                 LEFT JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    -- JOIN con catálogo para RUC propio
                 LEFT JOIN apl_tb_catalogo cat_prov 
                 ON cat_prov.adicional LIKE f.idproveedor || '-%'
                 AND cat_prov.idetiqueta = 'RUCPROPIO'
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
    v_contador_aprobados    NUMBER;
    v_contador_negado       NUMBER;
    v_en_proceso_aprobacion BOOLEAN;
    --catalogos
    v_estado_aprobado       NUMBER;
    v_estado_negado         NUMBER;
    v_estado_nuevo          NUMBER;
    v_tipo_creacion         NUMBER;
    v_entidad_fondo         NUMBER;
    v_contador_registro     NUMBER;
    BEGIN

    v_contador_aprobados    := 0;
    v_contador_negado       := 0;
    v_en_proceso_aprobacion := false;

    SELECT idcatalogo INTO v_estado_aprobado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOAPROBADO';

    SELECT idcatalogo INTO v_estado_negado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONEGADO';

    SELECT idcatalogo INTO v_tipo_creacion FROM apl_tb_catalogo WHERE idetiqueta = 'TPCREACION';     

    SELECT idcatalogo INTO v_entidad_fondo FROM apl_tb_catalogo WHERE idetiqueta = 'ENTFONDO'; 



        OPEN p_cursor FOR 
        SELECT q.* FROM
        (
            SELECT 
                    f.idfondo,
                    f.descripcion,
                    f.idproveedor                                 AS proveedor,
                     COALESCE(
                        arp.nombre,
                        -- Extraer nombre después del guión del campo adicional
                        TRIM(SUBSTR(cat_prov.adicional, INSTR(cat_prov.adicional, '-') + 1))
                    ) AS nombre_proveedor,
                    f.idtipofondo,
                    ca.nombre as nombre_tipo_fondo,
                    f.valorfondo                                  AS valor_fondo,
                    to_char(f.fechainiciovigencia, 'YYYY-MM-DD') AS fecha_inicio,
                    to_char(f.fechafinvigencia, 'YYYY-MM-DD')    AS fecha_fin,
                    f.valordisponible                             AS valor_disponible,
                    f.valorcomprometido                           AS valor_comprometido,
                    f.valorliquidado                              AS valor_liquidado,
                    c.nombre                                     AS estado,
                    c.idetiqueta                                 AS estado_etiqeuta

            FROM
                    apl_tb_fondo f
                    LEFT JOIN apl_tb_catalogo c ON c.idcatalogo = f.idestadoregistro
                    LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = f.idtipofondo
                    LEFT JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    -- JOIN con catálogo para RUC propio
                    LEFT JOIN apl_tb_catalogo cat_prov 
                        ON cat_prov.adicional LIKE f.idproveedor || '-%'
                        AND cat_prov.idetiqueta = 'RUCPROPIO' 
            WHERE  
                    c.idetiqueta IN ('ESTADONUEVO', 'ESTADOMODIFICADO', 'ESTADONEGADO')  AND f.marcaprocesoaprobacion = ' '


        ) q 


        ORDER BY
                q.idfondo;

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
                COALESCE(
                    arp.nombre,
                    -- Extraer nombre después del guión del campo adicional
                    TRIM(SUBSTR(cat_prov.adicional, INSTR(cat_prov.adicional, '-') + 1))
                ) AS nombre_proveedor,
                f.idtipofondo,
                ca.nombre as nombre_tipo_fondo,
                f.valorfondo                                  AS valor_fondo,
                to_char(f.fechainiciovigencia, 'YYYY-MM-DD') AS fecha_inicio,
                to_char(f.fechafinvigencia, 'YYYY-MM-DD')    AS fecha_fin,
                f.valordisponible                             AS valor_disponible,
                f.valorcomprometido                           AS valor_comprometido,
                f.valorliquidado                              AS valor_liquidado,
                c.nombre                                      AS estado
        FROM
            apl_tb_fondo f
                LEFT JOIN apl_tb_catalogo c ON c.idcatalogo = f.idestadoregistro
                LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = f.idtipofondo
                LEFT JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                -- JOIN con catálogo para RUC propio
                LEFT JOIN apl_tb_catalogo cat_prov 
                ON cat_prov.adicional LIKE f.idproveedor || '-%'
                AND cat_prov.idetiqueta = 'RUCPROPIO' 
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


    PROCEDURE sp_bandeja_consulta_aprobacion (
        p_usuarioaprobador IN VARCHAR2,     -- Usuario aprobador (OBLIGATORIO)
        p_cursor           OUT SYS_REFCURSOR -- Cursor de salida
    ) AS
    v_estado_nuevo NUMBER;
    BEGIN

     SELECT
            idcatalogo
        INTO v_estado_nuevo
        FROM
            apl_tb_catalogo
        WHERE
            idetiqueta = 'ESTADONUEVO';

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
                                      nombre_tipo_fondo,
                                      nombre_proveedor,
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
                                              COALESCE(
                                                arp.nombre,
                                                -- Extraer nombre después del guión del campo adicional
                                                TRIM(SUBSTR(cat_prov.adicional, INSTR(cat_prov.adicional, '-') + 1))
                                              ) AS nombre_proveedor,
                                              f.idtipofondo,
                                              ca.nombre as nombre_tipo_fondo,
                                              f.valorfondo                                  AS valor_fondo,
                                              to_char(f.fechainiciovigencia, 'YYYY-MM-DD') AS fecha_inicio,
                                              to_char(f.fechafinvigencia, 'YYYY-MM-DD')    AS fecha_fin,
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
                                              INNER JOIN apl_tb_aprobacion a ON a.identidad = f.idfondo AND a.idestadoregistro = v_estado_nuevo
                                              LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = f.idtipofondo
                                              LEFT JOIN apl_tb_catalogo   cp ON a.idtipoproceso = cp.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   ct ON f.idtipofondo = ct.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   ce ON f.idestadoregistro = ce.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   en ON a.entidad = en.idcatalogo
                                              LEFT JOIN apl_tb_catalogo   ea ON a.idestadoregistro = ea.idcatalogo
                                              INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                                              LEFT JOIN apl_tb_catalogo cat_prov 
                                                  ON cat_prov.adicional LIKE f.idproveedor || '-%'
                                                  AND cat_prov.idetiqueta = 'RUCPROPIO' 
                                          WHERE 
                                              (ce.idetiqueta IN ( 'ESTADONUEVO', 'ESTADOMODIFICADO')
                                              AND en.idetiqueta = 'ENTFONDO'
                                              AND cp.idetiqueta IN ( 'TPCREACION')) OR

                                              --modicacion
                                             ( ce.idetiqueta IN ('ESTADOAPROBADO', 'ESTADOVIGENTE' )
                                              AND en.idetiqueta = 'ENTFONDO'
                                              AND cp.idetiqueta IN ('TPINACTIVACION' ))


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
                    COALESCE(
                        arp.nombre,
                        -- Extraer nombre después del guión del campo adicional
                        TRIM(SUBSTR(cat_prov.adicional, INSTR(cat_prov.adicional, '-') + 1))
                    ) AS nombre_proveedor,
                    f.idtipofondo,
                    ca.nombre as nombre_tipo_fondo,
                    f.valorfondo                                  AS valor_fondo,
                    to_char(f.fechainiciovigencia, 'YYYY-MM-DD') AS fecha_inicio,
                    to_char(f.fechafinvigencia, 'YYYY-MM-DD')    AS fecha_fin,
                    f.valordisponible                             AS valor_disponible,
                    f.valorcomprometido                           AS valor_comprometido,
                    f.valorliquidado                              AS valor_liquidado,
                    f.idestadoregistro                            AS idEstados_fondo,
                    ce.nombre                                     AS nombre_estado_fondo,
                    ce.idetiqueta                                 AS id_etiqueta_estado_fondo,
                    a.nivelaprobacion,
                    a.iduseraprobador                             AS aprobador,
                    a.idaprobacion,
                    a.entidad,
                    en.idetiqueta                                 AS entidad_etiqueta,
                    cp.idetiqueta                                 AS tipo_proceso_etiqueta,
                    ea.idetiqueta                                 AS estado_aprob_etiqueta


                    FROM
                            apl_tb_fondo f
                            INNER JOIN apl_tb_aprobacion a ON a.identidad = p_idfondo
                            LEFT JOIN apl_tb_catalogo ca ON ca.idcatalogo = f.idtipofondo
                            LEFT JOIN apl_tb_catalogo   cp ON a.idtipoproceso = cp.idcatalogo
                            LEFT JOIN apl_tb_catalogo   ct ON f.idtipofondo = ct.idcatalogo
                            LEFT JOIN apl_tb_catalogo   ce ON f.idestadoregistro = ce.idcatalogo
                            LEFT JOIN apl_tb_catalogo   en ON a.entidad = en.idcatalogo
                            LEFT JOIN apl_tb_catalogo   ea ON a.idestadoregistro = ea.idcatalogo
                            INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                            LEFT JOIN apl_tb_catalogo cat_prov 
                                ON cat_prov.adicional LIKE f.idproveedor || '-%'
                                AND cat_prov.idetiqueta = 'RUCPROPIO'
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
        --parametros para el log
        p_idopcion                  IN NUMBER, 
        p_idcontrolinterfaz         IN VARCHAR2,
        p_idevento_etiqueta         IN VARCHAR2,
        p_nombreusuario             IN VARCHAR2,  
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

        -- Variables para LOG
        v_datos_json          VARCHAR2(4000);
        v_idusersolicitud     VARCHAR2(50);
        v_nombreusersolicitud VARCHAR2(100);
        v_fechasolicitud      TIMESTAMP := SYSTIMESTAMP;
        v_idestadoregistro    NUMBER;
        v_nivelaprobacion     NUMBER;
        v_id_control_interfaz NUMBER;
        v_idevento            NUMBER;

    BEGIN

        --VARIABLES PARA EL LOG
        SELECT idcatalogo INTO v_id_control_interfaz FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
        SELECT idcatalogo INTO v_idevento FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;

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

        --activamos la marca cuando el fondo esta en proceso de APROBACION
        UPDATE apl_tb_fondo 
                SET 
                    idusuariomodifica = p_usuarioaprobador,
                    fechamodifica = v_fechasistema,
                    marcaprocesoaprobacion = 'A'
                WHERE 
                    idfondo = p_identidad;

        --Obtener datos de la tabal aprobacion para construir json en el log
        SELECT 
            idusersolicitud,
            nombreusersolicitud,
            fechasolicitud,
            idestadoregistro,
            nivelaprobacion
        INTO 
            v_idusersolicitud,
            v_nombreusersolicitud,
            v_fechasolicitud,
            v_idestadoregistro,
            v_nivelaprobacion
        FROM apl_tb_aprobacion 
        WHERE idaprobacion = p_idaprobacion;

        -- Construir JSON con los datos actualizados
            v_datos_json := JSON_OBJECT(
                'idaprobacion'          VALUE p_idaprobacion ,
                'entidad'               VALUE p_entidad ,
                'identidad'             VALUE p_identidad,
                'idtipoproceso'         VALUE p_idtipoproceso  ,
                'idusersolicitud'       VALUE v_idusersolicitud,
                'nombreusersolicitud'   VALUE v_registros_pendientes_aprobacion,
                'fechasolicitud'        VALUE v_fechasolicitud,
                'iduseraprobador'       VALUE p_usuarioaprobador,
                'fechaaprobacion'       VALUE TO_CHAR(v_fechasistema, 'YYYY-MM-DD HH24:MI:SS'),
                'comentario'            VALUE p_comentario ,
                'nivelaprobacion'       VALUE v_nivelaprobacion,
                'idestadoregistro'      VALUE v_idestadoregistro
            );


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
                    idestadoregistro = v_idestado,
                    marcaprocesoaprobacion = ' '
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
                IF UPPER(p_idetiquetaestado) IN ('ESTADOAPROBADO', 'ESTADOVIGENTE') THEN

                     IF v_registros_pendientes_aprobacion = 0 THEN
                        UPDATE apl_tb_fondo 
                        SET 
                            idusuariomodifica = p_usuarioaprobador,
                            fechamodifica = v_fechasistema,
                            idestadoregistro = v_idestadoinactivo,
                            valordisponible = 0,
                            marcaprocesoaprobacion = ' '
                        WHERE 
                            idfondo = p_identidad;

                        IF SQL%ROWCOUNT = 0 THEN
                            p_mensaje_salida := 'ERROR: No se pudo inactivar el fondo';
                            ROLLBACK;
                            RETURN;
                        END IF;
                     END IF;

                    p_mensaje_salida := 'OK: Fondo inactivado exitosamente';


                ELSE
                    p_mensaje_salida := 'OK: Aprobación rechazada, fondo no inactivado';

                    -- Construir JSON para rechazo de inactivación
                    v_datos_json := JSON_OBJECT(
                        'tipo_proceso' VALUE 'TPINACTIVACION',
                        'tipo_registro' VALUE 'RECHAZO_INACTIVACION',  -- ¿ AGREGADO
                        'razon' VALUE 'Estado de aprobación no es APROBADO',
                        'estado_recibido' VALUE p_idetiquetaestado
                    );
                END IF;

            ELSE
                p_mensaje_salida:= 'ERROR: Tipo de proceso no reconocido: ' || p_idetiquetatipoproceso;
                ROLLBACK;
                RETURN;
            END IF;

        ELSE
            p_mensaje_salida := 'OK: Aprobación registrada. Quedan ' || v_registros_pendientes_aprobacion || ' aprobaciones pendientes';
        END IF;

        -- Insertar en LOG
        INSERT INTO apl_tb_log (
                fechahoratrx,
                iduser,
                idopcion,
                idcontrolinterfaz,
                idevento,
                entidad,
                identidad,
                idtipoproceso,
                datos
            ) VALUES (
                SYSTIMESTAMP,
                p_usuarioaprobador,
                p_idopcion,
                v_id_control_interfaz,
                v_idevento,
                p_identidad,
                p_entidad,
                p_idtipoproceso, 
                v_datos_json
         );

        -- Confirmar transacción
        COMMIT;

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_codigo_salida := -20006;
            p_mensaje_salida := 'Error en proceso de aprobación: ' || SQLERRM;


    END sp_proceso_aprobacion_fondo;


end apl_pkg_fondos;