
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

create or replace PACKAGE BODY APL_PKG_ACUERDOS AS
    /*
    =========================================================
    Descripción: Lista los fondos con estado VIGENTE y valor disponible mayor a 0
    =========================================================
    */
    PROCEDURE sp_listar_consulta_fondo(
        p_cursor    OUT t_cursor,
        p_codigo    OUT NUMBER,
        p_mensaje   OUT VARCHAR2
    )AS
    
    --Variables
    
    v_estado_registro NUMBER;
    
    BEGIN
        
        --Catalogo 
        SELECT idcatalogo INTO v_estado_registro FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOVIGENTE';
        
        OPEN p_cursor FOR
            SELECT 
                f.IDFONDO,
                f.DESCRIPCION,
                f.IDPROVEEDOR,
                arp.nombre,
                f.IDTIPOFONDO,
                c.NOMBRE AS nombre_tipo_fondo,
                f.VALORFONDO,
                f.FECHAINICIOVIGENCIA,
                f.FECHAFINVIGENCIA,
                f.VALORDISPONIBLE,
                f.VALORCOMPROMETIDO,
                f.VALORLIQUIDADO,
                f.IDESTADOREGISTRO,
                f.INDICADORCREACION,
                f.MARCAPROCESOAPROBACION
            FROM 
                APL_TB_FONDO f 
                INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                INNER JOIN apl_tb_catalogo c ON c.idcatalogo = f.idtipofondo
            WHERE
                IDESTADOREGISTRO = v_estado_registro
                AND VALORDISPONIBLE > 0;
                
        --Respuesta exitosa
        p_codigo  := 0;
        p_mensaje := 'Consulta ejecutada exitosamente';
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo  := 1;
            p_mensaje := 'No se encontraron fondos vigentes con valor disponible';
        WHEN OTHERS THEN
            p_codigo  := SQLCODE;
            p_mensaje := 'Error: ' || SQLERRM;
                
    END sp_listar_consulta_fondo;
    
    /*
    =========================================================
    Descripción: Crear Acuerdo - General - Por Articulo
    =========================================================
    */
    PROCEDURE sp_crear_acuerdo(
        p_tipo_clase_etiqueta     IN  VARCHAR2,
        p_json_cabecera           IN  CLOB,
        p_json_fondo              IN  CLOB DEFAULT NULL,
        p_json_articulos          IN  CLOB DEFAULT NULL,
        p_idacuerdo_out           OUT NUMBER,
        --parametros para el log
        p_idopcion                IN NUMBER,
        p_idcontrolinterfaz       IN VARCHAR2,
        p_idevento_etiqueta       IN VARCHAR2,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    ) IS
        -- Variables para cabecera
        v_idacuerdo             NUMBER;
        v_idtipoacuerdo         NUMBER;
        v_idmotivoacuerdo       NUMBER;
        v_descripcion           VARCHAR2(100);
        v_fechainiciovigencia   TIMESTAMP;
        v_fechafinvigencia      TIMESTAMP;
        v_idusuarioingreso      VARCHAR2(50);
        v_marcaproceso          CHAR(1); --
        v_fechaingreso          TIMESTAMP := SYSTIMESTAMP;
        
        -- Variables para fondo
        v_idfondo               NUMBER;
        v_valoraporte           NUMBER;
        v_valordisponible       NUMBER;
        v_valorcomprometido     NUMBER;
        v_valorliquidado        NUMBER;
        
        -- Contadores
        v_count_articulos       NUMBER := 0;
        
        -- Variables para catálogo
        v_etiqueta_recibida     VARCHAR2(50);
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulos    VARCHAR2(50);
        
         --variables aprobadores
        v_tiene_aprobadores       NUMBER;
        v_entidad_acuerdo         NUMBER;
        v_tipo_creacion           NUMBER;
        v_estado_activo           NUMBER;
        
        --variables no hay aprobadores
        v_estado_nuevo            NUMBER;
        v_estado_registro         NUMBER;
        v_estado_aprobado         NUMBER;
        
        --variables lote
        v_numero_lote_aprobacion  NUMBER;
        v_row_exists              NUMBER;
        
         -- Variables para LOG
        v_json_log               CLOB;
        v_json_acuerdo           CLOB;
        v_json_fondo_log         CLOB;
        v_json_articulos_log     CLOB;
        v_id_control_interfaz    NUMBER;
        v_idevento               NUMBER;
        
        v_fondo_disponible       NUMBER;
    
    BEGIN
        -- =============================================================
        -- PASO 0: Obtener etiquetas válidas del catálogo
        -- =============================================================
        
        v_etiqueta_recibida := UPPER(TRIM(p_tipo_clase_etiqueta));
        
        --catalogos clase acuerdo
        SELECT idetiqueta INTO v_etiqueta_general FROM apl_tb_catalogo WHERE idetiqueta = 'CLAGENERAL';    
        SELECT idetiqueta INTO v_etiqueta_articulos FROM apl_tb_catalogo WHERE idetiqueta = 'CLAARTICULO';
        
        --catalogos
        SELECT idcatalogo INTO v_entidad_acuerdo FROM apl_tb_catalogo WHERE idetiqueta = 'ENTACUERDO';
        SELECT idcatalogo INTO v_tipo_creacion FROM apl_tb_catalogo WHERE idetiqueta = 'TPCREACION';  
        SELECT idcatalogo INTO v_estado_activo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOACTIVO';
        SELECT idcatalogo INTO v_estado_nuevo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
        SELECT idcatalogo INTO v_estado_aprobado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOAPROBADO';
        
         --VARIABLES PARA EL LOG
        SELECT idcatalogo INTO v_id_control_interfaz FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
        SELECT idcatalogo INTO v_idevento FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;
           
        
        -- =============================================================
        -- PASO 1: Extraer datos de la CABECERA desde JSON
        -- =============================================================
        SELECT 
            JSON_VALUE(p_json_cabecera, '$.idTipoAcuerdo' RETURNING NUMBER),
            JSON_VALUE(p_json_cabecera, '$.idMotivoAcuerdo' RETURNING NUMBER),
            JSON_VALUE(p_json_cabecera, '$.descripcion'),
            TO_TIMESTAMP(JSON_VALUE(p_json_cabecera, '$.fechaInicioVigencia'), 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
            TO_TIMESTAMP(JSON_VALUE(p_json_cabecera, '$.fechaFinVigencia'), 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
            JSON_VALUE(p_json_cabecera, '$.idUsuarioIngreso'),
            NVL(JSON_VALUE(p_json_cabecera, '$.marcaProcesoAprobacion'), ' ')
        INTO 
            v_idtipoacuerdo,
            v_idmotivoacuerdo,
            v_descripcion,
            v_fechainiciovigencia,
            v_fechafinvigencia,
            v_idusuarioingreso,
            v_marcaproceso
        FROM DUAL;
        
        
       
        -- ---------------------------------------------------------
        -- CASO: GENERAL (2 tablas: acuerdo + fondo)
        -- ---------------------------------------------------------
        IF v_etiqueta_recibida = v_etiqueta_general THEN
        
            -- Valida si existen aprobadores
            SELECT
                    COUNT(*)
                INTO v_tiene_aprobadores
                FROM
                    apl_tb_aprobador
                WHERE
                    entidad = v_entidad_acuerdo
                    AND idtipoproceso = v_tipo_creacion
                    AND idestadoregistro = v_estado_activo;
                    
            -- Si no existen aprobadores realiza esta logica
            IF v_tiene_aprobadores > 0 THEN
                    v_estado_registro := v_estado_nuevo;     -- NUEVO
                     
                     -- Validar que el fondo existe
                     SELECT
                        CASE
                            WHEN EXISTS (SELECT 1 FROM apl_tb_lote WHERE entidad = v_entidad_acuerdo
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
                                v_entidad_acuerdo,
                                v_numero_lote_aprobacion
                            );
                    ELSE 
                        SELECT secuencial INTO v_numero_lote_aprobacion FROM apl_tb_lote WHERE entidad = v_entidad_acuerdo;
                         v_numero_lote_aprobacion := v_numero_lote_aprobacion + 1;
                         UPDATE apl_tb_lote  
                         SET secuencial = v_numero_lote_aprobacion
                         WHERE entidad = v_entidad_acuerdo;
                    END IF;
                ELSE
                    v_estado_registro := v_estado_aprobado;  
                END IF;
            
            -- Validar JSON fondo
            IF p_json_fondo IS NULL OR LENGTH(p_json_fondo) < 3 THEN
                 p_codigo_salida := 0;
                 p_mensaje_salida := 'ERROR: Para clase "General" debe enviar información del fondo';
                RETURN;
            END IF;
            
            -- Extraer datos del FONDO
            SELECT 
                JSON_VALUE(p_json_fondo, '$.idFondo' RETURNING NUMBER),
                JSON_VALUE(p_json_fondo, '$.valorAporte' RETURNING NUMBER),
                NVL(JSON_VALUE(p_json_fondo, '$.valorDisponible' RETURNING NUMBER), 
                    JSON_VALUE(p_json_fondo, '$.valorAporte' RETURNING NUMBER)),
                NVL(JSON_VALUE(p_json_fondo, '$.valorComprometido' RETURNING NUMBER), 0),
                NVL(JSON_VALUE(p_json_fondo, '$.valorLiquidado' RETURNING NUMBER), 0)
            INTO 
                v_idfondo,
                v_valoraporte,
                v_valordisponible,
                v_valorcomprometido,
                v_valorliquidado
            FROM DUAL;
            
            -- ----------------------------------------------------------
            -- Validar si el fondo no existe
            -- ----------------------------------------------------------
             SELECT
                CASE
                    WHEN EXISTS (SELECT 1 FROM apl_tb_fondo  WHERE idfondo = v_idfondo
                    ) THEN
                     1
                    ELSE
                     0
                END
                
                INTO v_row_exists
                FROM
                    dual;
            
                IF v_row_exists = 0  THEN
                    p_codigo_salida := 1;
                    p_mensaje_salida := 'Error Fondo no existe ' ||  v_idfondo;
                
                    RETURN;
                ELSE 
                    -- ----------------------------------------------------------
                    -- Validar si el fondo tiene disponible para crear el acuerdo
                    -- ----------------------------------------------------------
                    SELECT valordisponible INTO v_fondo_disponible FROM apl_tb_fondo WHERE idfondo = v_idfondo;
                    IF  v_valoraporte > v_fondo_disponible THEN
                    
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'Error Fondo disponible ' ||  v_fondo_disponible || ' menor al valor del acuerdo' || v_valoraporte;
                        
                      RETURN;
                    END IF;
                END IF;
       
            

            -- INSERT 1: APL_TB_ACUERDO
            INSERT INTO apl_tb_acuerdo (
                idtipoacuerdo,
                idmotivoacuerdo,
                descripcion,
                fechainiciovigencia,
                fechafinvigencia,
                fechaingreso,
                idusuarioingreso,
                fechamodifica,
                idusuariomodifica,
                idestadoregistro,
                marcaprocesoaprobacion,
                numeroloteaprobacion
            ) VALUES (
                v_idtipoacuerdo,
                v_idmotivoacuerdo,
                v_descripcion,
                v_fechainiciovigencia,
                v_fechafinvigencia,
                v_fechaingreso,
                v_idusuarioingreso,
                NULL,
                NULL,
                v_estado_registro,
                v_marcaproceso,
                v_numero_lote_aprobacion
            );
            
            -- Obtener ID generado
            SELECT MAX(idacuerdo) INTO v_idacuerdo 
            FROM apl_tb_acuerdo 
            WHERE idusuarioingreso = v_idusuarioingreso
              AND fechaingreso = v_fechaingreso;
            
            -- INSERT 2: APL_TB_ACUERDOFONDO
            INSERT INTO apl_tb_acuerdofondo (
                idacuerdo,
                idfondo,
                valoraporte,
                valordisponible,
                valorcomprometido,
                valorliquidado,
                idestadoregistro
            ) VALUES (
                v_idacuerdo,
                v_idfondo,
                v_valoraporte,
                v_valordisponible,
                v_valorcomprometido,
                v_valorliquidado,
                1
            );
            
            -- =============================================================
            -- CONSTRUIR JSON PARA LOG (GENERAL: acuerdo + fondo)
            -- =============================================================
            
            -- JSON del acuerdo
            SELECT JSON_OBJECT(
                'idacuerdo'             VALUE a.idacuerdo,
                'idtipoacuerdo'         VALUE a.idtipoacuerdo,
                'idmotivoacuerdo'       VALUE a.idmotivoacuerdo,
                'descripcion'           VALUE a.descripcion,
                'fechainiciovigencia'   VALUE TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechafinvigencia'      VALUE TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechaingreso'          VALUE TO_CHAR(a.fechaingreso, 'YYYY-MM-DD HH24:MI:SS'),
                'idusuarioingreso'      VALUE a.idusuarioingreso
                --'idestadoregistro'      VALUE a.idestadoregistro
            ) INTO v_json_acuerdo
            FROM apl_tb_acuerdo a
            WHERE a.idacuerdo = v_idacuerdo;
            
            -- JSON del fondo
            SELECT JSON_OBJECT(
                'idacuerdo'         VALUE f.idacuerdo,
                'idfondo'           VALUE f.idfondo,
                'valoraporte'       VALUE f.valoraporte,
                'valordisponible'   VALUE f.valordisponible,
                'valorcomprometido' VALUE f.valorcomprometido,
                'valorliquidado'    VALUE f.valorliquidado
                --'idestadoregistro'  VALUE f.idestadoregistro
            ) INTO v_json_fondo_log
            FROM apl_tb_acuerdofondo f
            WHERE f.idacuerdo = v_idacuerdo;
            
            -- JSON completo para el log (GENERAL)
            v_json_log := JSON_OBJECT(
                'tipoAcuerdo'   VALUE 'GENERAL',
                'acuerdo'       VALUE JSON(v_json_acuerdo),
                'fondo'         VALUE JSON(v_json_fondo_log)
            );
            
             -- INSERT en APL_TB_LOG
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
                v_idusuarioingreso,
                p_idopcion,                  
                v_id_control_interfaz,                      
                v_idevento,                      
                v_entidad_acuerdo,                      
                v_idacuerdo,
                v_tipo_creacion,                      
                v_json_log
            );
        
            p_codigo_salida := 1;
            p_mensaje_salida := 'OK - Acuerdo General #' || v_idacuerdo || ' creado con Fondo #' || v_idfondo;
            
            -- Si hay aprobadores, generar filas en APL_TB_APROBACION (una por aprobador activo)
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
                        v_entidad_acuerdo        AS entidad,         -- SIEMPRE el catálogo ENTFONDO
                        v_idacuerdo              AS identidad,       -- el IdFondo recién creado
                        v_tipo_creacion          AS idtipoproceso,   -- TPCREACION
                        v_idusuarioingreso       AS idusersolicitud,
                        v_idusuarioingreso       AS nombreusersolicitud,
                        systimestamp             AS fechasolicitud,
                        a.iduseraprobador        AS iduseraprobador,
                        NULL                     AS fechaaprobacion,
                        NULL                     AS comentario,
                        a.nivelaprobacion        AS nivelaprobacion,
                        v_estado_nuevo           AS idestadoregistro,
                        v_numero_lote_aprobacion
                    FROM
                        apl_tb_aprobador a
                    WHERE
                            a.entidad = v_entidad_acuerdo
                        AND a.idtipoproceso = v_tipo_creacion
                        AND a.idestadoregistro = v_estado_activo;

            END IF;
            
        
        -- ---------------------------------------------------------
        -- CASO: CON ARTICULOS (3 tablas: acuerdo + fondo + articulos)
        -- ---------------------------------------------------------
        ELSIF v_etiqueta_recibida = v_etiqueta_articulos THEN
        
            -- Valida si existen aprobadores
            SELECT
                    COUNT(*)
                INTO v_tiene_aprobadores
                FROM
                    apl_tb_aprobador
                WHERE
                    entidad = v_entidad_acuerdo
                    AND idtipoproceso = v_tipo_creacion
                    AND idestadoregistro = v_estado_activo;
                    
            -- Si no existen aprobadores realiza esta logica
            IF v_tiene_aprobadores > 0 THEN
                    v_estado_registro := v_estado_nuevo;     -- NUEVO
                     
                     -- Validar que el fondo existe
                     SELECT
                        CASE
                            WHEN EXISTS (SELECT 1 FROM apl_tb_lote WHERE entidad = v_entidad_acuerdo
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
                                v_entidad_acuerdo,
                                v_numero_lote_aprobacion
                            );
                    ELSE 
                        SELECT secuencial INTO v_numero_lote_aprobacion FROM apl_tb_lote WHERE entidad = v_entidad_acuerdo;
                         v_numero_lote_aprobacion := v_numero_lote_aprobacion + 1;
                         UPDATE apl_tb_lote  
                         SET secuencial = v_numero_lote_aprobacion
                         WHERE entidad = v_entidad_acuerdo;
                    END IF;
                ELSE
                    v_estado_registro := v_estado_aprobado;  
                END IF;
                    
            
            -- Validar JSON fondo
            IF p_json_fondo IS NULL OR LENGTH(p_json_fondo) < 3 THEN
                p_codigo_salida := 0;
                p_mensaje_salida := 'ERROR: Para clase "Con Articulos" debe enviar información del fondo';
                RETURN;
            END IF;
            
            -- Validar JSON artículos
            IF p_json_articulos IS NULL OR LENGTH(p_json_articulos) < 3 THEN
                p_codigo_salida := 0;
                p_mensaje_salida := 'ERROR: Para clase "Con Articulos" debe enviar artículos';
                RETURN;
            END IF;
            
            -- Extraer datos del FONDO
            SELECT 
                JSON_VALUE(p_json_fondo, '$.idFondo' RETURNING NUMBER),
                JSON_VALUE(p_json_fondo, '$.valorAporte' RETURNING NUMBER),
                NVL(JSON_VALUE(p_json_fondo, '$.valorDisponible' RETURNING NUMBER), 
                    JSON_VALUE(p_json_fondo, '$.valorAporte' RETURNING NUMBER)),
                NVL(JSON_VALUE(p_json_fondo, '$.valorComprometido' RETURNING NUMBER), 0),
                NVL(JSON_VALUE(p_json_fondo, '$.valorLiquidado' RETURNING NUMBER), 0)
            INTO 
                v_idfondo,
                v_valoraporte,
                v_valordisponible,
                v_valorcomprometido,
                v_valorliquidado
            FROM DUAL;
            
            -- ----------------------------------------------------------
            -- Validar si el fondo no existe
            -- ----------------------------------------------------------
            SELECT
                CASE
                    WHEN EXISTS (SELECT 1 FROM apl_tb_fondo  WHERE idfondo = v_idfondo
                    ) THEN
                     1
                    ELSE
                     0
                END
                
                INTO v_row_exists
                FROM
                    dual;
            
                IF v_row_exists = 0  THEN
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'Error Fondo no existe ' ||  v_idfondo;
                    
                        RETURN;
                    ELSE 
                        -- ----------------------------------------------------------
                        -- Validar si el fondo tiene disponible para crear el acuerdo
                        -- ----------------------------------------------------------
                        SELECT valordisponible INTO v_fondo_disponible FROM apl_tb_fondo WHERE idfondo = v_idfondo;
                        IF  v_valoraporte > v_fondo_disponible THEN
                        
                            p_codigo_salida := 1;
                            p_mensaje_salida := 'Error Fondo disponible ' ||  v_fondo_disponible || ' menor al valor del acuerdo' || v_valoraporte;
                            
                          RETURN;
                        END IF;
                END IF;
            
            -- INSERT 1: APL_TB_ACUERDO
            INSERT INTO apl_tb_acuerdo (
                idtipoacuerdo,
                idmotivoacuerdo,
                descripcion,
                fechainiciovigencia,
                fechafinvigencia,
                fechaingreso,
                idusuarioingreso,
                fechamodifica,
                idusuariomodifica,
                idestadoregistro,
                marcaprocesoaprobacion,
                numeroloteaprobacion
            ) VALUES (
                v_idtipoacuerdo,
                v_idmotivoacuerdo,
                v_descripcion,
                v_fechainiciovigencia,
                v_fechafinvigencia,
                v_fechaingreso,
                v_idusuarioingreso,
                NULL,
                NULL,
                v_estado_registro,
                v_marcaproceso,
                v_numero_lote_aprobacion
            );
            
            -- Obtener ID generado
            SELECT MAX(idacuerdo) INTO v_idacuerdo 
            FROM apl_tb_acuerdo 
            WHERE idusuarioingreso = v_idusuarioingreso
              AND fechaingreso = v_fechaingreso;
            
            -- INSERT 2: APL_TB_ACUERDOFONDO
            INSERT INTO apl_tb_acuerdofondo (
                idacuerdo,
                idfondo,
                valoraporte,
                valordisponible,
                valorcomprometido,
                valorliquidado,
                idestadoregistro
            ) VALUES (
                v_idacuerdo,
                v_idfondo,
                v_valoraporte,
                v_valordisponible,
                v_valorcomprometido,
                v_valorliquidado,
                1
            );
            
            -- INSERT 3: APL_TB_ACUERDOARTICULO (múltiples filas)
            INSERT INTO apl_tb_acuerdoarticulo (
                idacuerdo,
                codigoarticulo,
                costoactual,
                unidadeslimite,
                preciocontado,
                preciotarjetacredito,
                preciocredito,
                margencontado,
                margentarjetacredito,
                valoraporte,
                valorcomprometido,
                idestadoregistro
            )
            SELECT 
                v_idacuerdo,
                jt.codigo_articulo,
                jt.costo_actual,
                jt.unidades_limite,
                jt.precio_contado,
                jt.precio_tc,
                jt.precio_credito,
                jt.margen_contado,
                jt.margen_tc,
                jt.valor_aporte,
                jt.valor_comprometido,
                1
            FROM JSON_TABLE(
                p_json_articulos,
                '$[*]'
                COLUMNS (
                    codigo_articulo     VARCHAR2(20)  PATH '$.codigoArticulo',
                    costo_actual        NUMBER(18,2)  PATH '$.costoActual',
                    unidades_limite     NUMBER(10)    PATH '$.unidadesLimite',
                    precio_contado      NUMBER(18,2)  PATH '$.precioContado',
                    precio_tc           NUMBER(18,2)  PATH '$.precioTarjetaCredito',
                    precio_credito      NUMBER(18,2)  PATH '$.precioCredito',
                    margen_contado      NUMBER(18,2)  PATH '$.margenContado',
                    margen_tc           NUMBER(18,2)  PATH '$.margenTarjetaCredito',
                    valor_aporte        NUMBER(18,2)  PATH '$.valorAporte',
                    valor_comprometido  NUMBER(18,2)  PATH '$.valorComprometido'
                )
            ) jt;
            
            v_count_articulos := SQL%ROWCOUNT;
            
            -- =============================================================
            -- CONSTRUIR JSON PARA LOG (ARTICULO: acuerdo + fondo + articulos)
            -- =============================================================
            
            -- JSON del acuerdo
            SELECT JSON_OBJECT(
                'idacuerdo'             VALUE a.idacuerdo,
                'idtipoacuerdo'         VALUE a.idtipoacuerdo,
                'idmotivoacuerdo'       VALUE a.idmotivoacuerdo,
                'descripcion'           VALUE a.descripcion,
                'fechainiciovigencia'   VALUE TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechafinvigencia'      VALUE TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechaingreso'          VALUE TO_CHAR(a.fechaingreso, 'YYYY-MM-DD HH24:MI:SS'),
                'idusuarioingreso'      VALUE a.idusuarioingreso,
                'idestadoregistro'      VALUE a.idestadoregistro
            ) INTO v_json_acuerdo
            FROM apl_tb_acuerdo a
            WHERE a.idacuerdo = v_idacuerdo;
            
            -- JSON del fondo
            SELECT JSON_OBJECT(
                'idacuerdo'         VALUE f.idacuerdo,
                'idfondo'           VALUE f.idfondo,
                'valoraporte'       VALUE f.valoraporte,
                'valordisponible'   VALUE f.valordisponible,
                'valorcomprometido' VALUE f.valorcomprometido,
                'valorliquidado'    VALUE f.valorliquidado,
                'idestadoregistro'  VALUE f.idestadoregistro
            ) INTO v_json_fondo_log
            FROM apl_tb_acuerdofondo f
            WHERE f.idacuerdo = v_idacuerdo;
            
            -- JSON array de artículos
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'idacuerdo'             VALUE art.idacuerdo,
                    'codigoarticulo'        VALUE art.codigoarticulo,
                    'costoactual'           VALUE art.costoactual,
                    'unidadeslimite'        VALUE art.unidadeslimite,
                    'preciocontado'         VALUE art.preciocontado,
                    'preciotarjetacredito'  VALUE art.preciotarjetacredito,
                    'preciocredito'         VALUE art.preciocredito,
                    'margencontado'         VALUE art.margencontado,
                    'margentarjetacredito'  VALUE art.margentarjetacredito,
                    'valoraporte'           VALUE art.valoraporte,
                    'valorcomprometido'     VALUE art.valorcomprometido,
                    'idestadoregistro'      VALUE art.idestadoregistro
                )
            ) INTO v_json_articulos_log
            FROM apl_tb_acuerdoarticulo art
            WHERE art.idacuerdo = v_idacuerdo;
            
            -- JSON completo para el log (ARTICULO)
            v_json_log := JSON_OBJECT(
                'tipoAcuerdo'   VALUE 'ARTICULO',
                'acuerdo'       VALUE JSON(v_json_acuerdo),
                'fondo'         VALUE JSON(v_json_fondo_log),
                'articulos'     VALUE JSON(v_json_articulos_log)
            );
            
            -- INSERT en APL_TB_LOG
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
                v_idusuarioingreso,
                p_idopcion,                  
                v_id_control_interfaz,                      
                v_idevento,                      
                v_entidad_acuerdo,                      
                v_idacuerdo,
                v_tipo_creacion,                      
                v_json_log
             );
        
            -- Si hay aprobadores, generar filas en APL_TB_APROBACION (una por aprobador activo)
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
                        v_entidad_acuerdo        AS entidad,         
                        v_idacuerdo              AS identidad,       
                        v_tipo_creacion          AS idtipoproceso,   -- TPCREACION
                        v_idusuarioingreso       AS idusersolicitud,
                        v_idusuarioingreso       AS nombreusersolicitud,
                        systimestamp             AS fechasolicitud,
                        a.iduseraprobador        AS iduseraprobador,
                        NULL                     AS fechaaprobacion,
                        NULL                     AS comentario,
                        a.nivelaprobacion        AS nivelaprobacion,
                        v_estado_nuevo           AS idestadoregistro,
                        v_numero_lote_aprobacion
                    FROM
                        apl_tb_aprobador a
                    WHERE
                            a.entidad = v_entidad_acuerdo
                        AND a.idtipoproceso = v_tipo_creacion
                        AND a.idestadoregistro = v_estado_activo;

                 END IF;
            
        
            p_codigo_salida := 1;
            p_mensaje_salida := 'OK - Acuerdo #' || v_idacuerdo || ' creado con Fondo #' || v_idfondo || ' y ' || v_count_articulos || ' artículos';
        
        ELSE
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: Clase de acuerdo no válida: ' || p_tipo_clase_etiqueta;
            RETURN;
            
        END IF;
        
       
        
        
        COMMIT;
        p_idacuerdo_out := v_idacuerdo;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_idacuerdo_out := NULL;
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END sp_crear_acuerdo;
    
    /*
    =========================================================
    Descripción: Bandeja Consulta / Aprobacion Acuerdo
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_aprobacion_acuerdos (
        p_usuarioaprobador        IN VARCHAR2,
        p_cursor                  OUT SYS_REFCURSOR,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    ) AS
        -- Variables para IDs de catálogo
        v_estado_nuevo          NUMBER;
        v_id_eliminado          NUMBER;
    
    BEGIN
        -- =========================================================================
        -- PASO 1: Obtener IDs de catálogos necesarios
        -- =========================================================================
        
        SELECT idcatalogo 
        INTO v_estado_nuevo 
        FROM apl_tb_catalogo 
        WHERE idetiqueta = 'ESTADONUEVO';
        
        SELECT idcatalogo INTO v_id_eliminado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
              
        -- =========================================================================
        -- PASO 2: Abrir cursor con la consulta principal
        -- =========================================================================
        
        OPEN p_cursor FOR 
            SELECT
                x.*
            FROM
                (
                    SELECT
                        solicitud,
                        idacuerdo,
                        descripcion,
                        id_fondo,
                        id_tipo_fondo,
                        nombre_tipo_fondo,
                        nombre_proveedor,
                        id_tipo_clase_acuerdo,
                        nombre_clase_acuerdo,
                        cantidad_articulos,
                        valor_acuerdo,
                        fecha_inicio,
                        fecha_fin,
                        valor_disponible,
                        valor_comprometido,
                        valor_liquidado,
                        idestados_acuerdo,
                        nombre_estado_acuerdo,
                        id_etiqueta_estado_acuerdo,
                        nivelaprobacion,
                        aprobador,
                        idaprobacion,
                        entidad_etiqueta,
                        tipo_proceso_etiqueta,
                        estado_aprob_etiqueta
                    FROM
                        (
                            SELECT
                                cp.nombre                                       AS solicitud,
                                ac.idacuerdo,
                                ac.descripcion,
                                f.idfondo                                       AS id_fondo,
                                f.idtipofondo                                   AS id_tipo_fondo,
                                tf.nombre                                       AS nombre_tipo_fondo,
                                arp.nombre                                      AS nombre_proveedor,
                                ac.idtipoacuerdo                                AS id_tipo_clase_acuerdo,
                                ct.nombre                                       AS nombre_clase_acuerdo,
                                NVL(art.cantidad_articulos, 0)                  AS cantidad_articulos,
                                NVL(acf.valoraporte, 0)                         AS valor_acuerdo,
                                TO_CHAR(ac.fechainiciovigencia, 'YYYY-MM-DD')   AS fecha_inicio,
                                TO_CHAR(ac.fechafinvigencia, 'YYYY-MM-DD')      AS fecha_fin,
                                NVL(acf.valordisponible, 0)                     AS valor_disponible,
                                NVL(acf.valorcomprometido, 0)                   AS valor_comprometido,
                                NVL(acf.valorliquidado, 0)                      AS valor_liquidado,
                                ac.idestadoregistro                             AS idestados_acuerdo,
                                ce.nombre                                       AS nombre_estado_acuerdo,
                                ce.idetiqueta                                   AS id_etiqueta_estado_acuerdo,
                                a.nivelaprobacion,
                                a.iduseraprobador                               AS aprobador,
                                a.idaprobacion,
                                en.idetiqueta                                   AS entidad_etiqueta,
                                cp.idetiqueta                                   AS tipo_proceso_etiqueta,
                                ea.idetiqueta                                   AS estado_aprob_etiqueta,
                                ROW_NUMBER() OVER (
                                    PARTITION BY a.entidad, a.identidad, a.idtipoproceso
                                    ORDER BY a.entidad, a.identidad, a.idtipoproceso, a.nivelaprobacion ASC
                                )                                               AS rn
                            FROM
                                apl_tb_acuerdo ac
                            -- JOIN con acuerdo fondo
                            INNER JOIN apl_tb_acuerdofondo acf 
                                ON acf.idacuerdo = ac.idacuerdo
                            -- *** CAMBIO: JOIN con aprobación por IDACUERDO (no IDFONDO) ***
                            INNER JOIN apl_tb_aprobacion a 
                                ON a.identidad = ac.idacuerdo   -- << CAMBIADO
                                AND a.idestadoregistro = v_estado_nuevo
                            -- JOIN con fondo
                            INNER JOIN apl_tb_fondo f 
                                ON f.idfondo = acf.idfondo
                            -- JOIN con proveedor
                            INNER JOIN apl_tb_artefacta_proveedor arp 
                                ON arp.identificacion = f.idproveedor
                            -- Subquery para contar artículos
                            LEFT JOIN (
                                SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                                FROM apl_tb_acuerdoarticulo aa
                                WHERE aa.idestadoregistro != v_id_eliminado
                                GROUP BY aa.idacuerdo
                            ) art ON art.idacuerdo = ac.idacuerdo
                            -- JOINs con catálogos
                            LEFT JOIN apl_tb_catalogo cp 
                                ON a.idtipoproceso = cp.idcatalogo
                            LEFT JOIN apl_tb_catalogo ct 
                                ON ac.idtipoacuerdo = ct.idcatalogo
                            LEFT JOIN apl_tb_catalogo ce 
                                ON ac.idestadoregistro = ce.idcatalogo
                            LEFT JOIN apl_tb_catalogo en 
                                ON a.entidad = en.idcatalogo
                            LEFT JOIN apl_tb_catalogo ea 
                                ON a.idestadoregistro = ea.idcatalogo
                            LEFT JOIN apl_tb_catalogo tf 
                                ON f.idtipofondo = tf.idcatalogo
                            WHERE
                                -- Creación: Estados NUEVO o MODIFICADO
                                (
                                    ce.idetiqueta IN ('ESTADONUEVO', 'ESTADOMODIFICADO')
                                    AND en.idetiqueta = 'ENTACUERDO'
                                    AND cp.idetiqueta = 'TPCREACION'
                                ) 
                                OR
                                -- Inactivación: Estados APROBADO o VIGENTE
                                (
                                    ce.idetiqueta IN ('ESTADOAPROBADO', 'ESTADOVIGENTE')
                                    AND en.idetiqueta = 'ENTACUERDO'
                                    AND cp.idetiqueta = 'TPINACTIVACION'
                                )
                        )
                    WHERE
                        rn = 1
                ) x
            WHERE
                x.aprobador = p_usuarioaprobador
            ORDER BY
                x.idacuerdo;
        
        -- Respuesta exitosa
        p_codigo_salida := 0;
        p_mensaje_salida := 'OK';
    
    EXCEPTION
        WHEN OTHERS THEN
            p_codigo_salida := 1;
            p_mensaje_salida := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
            
    END sp_consulta_bandeja_aprobacion_acuerdos;
    

    PROCEDURE sp_consulta_bandeja_aprobacion_por_id (
        p_idacuerdo            IN  NUMBER,
        p_idaprobacion         IN  NUMBER,
        p_cursor_cabecera      OUT SYS_REFCURSOR,
        p_cursor_articulos     OUT SYS_REFCURSOR,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    ) AS
        -- Variables para catálogos
        v_estado_nuevo          NUMBER;
        v_etiqueta_tipo         VARCHAR2(50);
        v_contador_registro     NUMBER;
        
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulos    VARCHAR2(50);
        v_id_eliminado          NUMBER;
    
    BEGIN
        -- Inicializar salida exitosa
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        p_tipo_acuerdo   := NULL;
    
        -- =========================================================================
        -- Validación de parámetro obligatorio
        -- =========================================================================
        IF p_idacuerdo IS NULL THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'ERROR: El parámetro p_idacuerdo es obligatorio';
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
    
        -- Validar que el acuerdo exista
        SELECT COUNT(*) INTO v_contador_registro
        FROM apl_tb_acuerdo
        WHERE idacuerdo = p_idacuerdo;
        
        IF v_contador_registro = 0 THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'No se encontró el acuerdo con ID: ' || p_idacuerdo;
            
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
    
        -- =========================================================================
        -- Obtener IDs de catálogo necesarios
        -- =========================================================================
        SELECT idcatalogo 
        INTO v_estado_nuevo 
        FROM apl_tb_catalogo 
        WHERE idetiqueta = 'ESTADONUEVO';
        
        SELECT idetiqueta INTO v_etiqueta_general 
        FROM apl_tb_catalogo 
        WHERE idetiqueta = 'CLAGENERAL';
        
        SELECT idetiqueta INTO v_etiqueta_articulos 
        FROM apl_tb_catalogo 
        WHERE idetiqueta = 'CLAARTICULO';
        
        SELECT idcatalogo INTO v_id_eliminado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
    
        -- =========================================================================
        -- Obtener el tipo de acuerdo del registro consultado
        -- =========================================================================
        SELECT ct.idetiqueta INTO v_etiqueta_tipo
        FROM apl_tb_acuerdo a
        INNER JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
        WHERE a.idacuerdo = p_idacuerdo;
        
        -- Asignar al parámetro de salida
        p_tipo_acuerdo := v_etiqueta_tipo;
    
        -- =========================================================================
        -- CASO 1: ACUERDO GENERAL (CLAGENERAL)
        -- =========================================================================
        IF v_etiqueta_tipo = v_etiqueta_general THEN
            
            -- Cursor cabecera para GENERAL
            OPEN p_cursor_cabecera FOR
                SELECT
                    cp.nombre                                       AS solicitud,
                    ac.idacuerdo,
                    ac.descripcion,
                    f.idfondo                                       AS id_fondo,
                    f.idtipofondo                                   AS id_tipo_fondo,
                    tf.nombre                                       AS nombre_tipo_fondo,
                    arp.nombre                                      AS nombre_proveedor,
                    ac.idtipoacuerdo                                AS id_tipo_clase_acuerdo,
                    ct.nombre                                       AS nombre_clase_acuerdo,
                    ct.idetiqueta                                   AS etiqueta_clase_acuerdo,
                    NVL(acf.valoraporte, 0)                         AS valor_acuerdo,
                    TO_CHAR(ac.fechainiciovigencia, 'YYYY-MM-DD')   AS fecha_inicio,
                    TO_CHAR(ac.fechafinvigencia, 'YYYY-MM-DD')      AS fecha_fin,
                    NVL(acf.valordisponible, 0)                     AS valor_disponible,
                    NVL(acf.valorcomprometido, 0)                   AS valor_comprometido,
                    NVL(acf.valorliquidado, 0)                      AS valor_liquidado,
                    ac.idestadoregistro                             AS idestados_acuerdo,
                    ce.nombre                                       AS nombre_estado_acuerdo,
                    ce.idetiqueta                                   AS id_etiqueta_estado_acuerdo,
                    a.nivelaprobacion,
                    a.iduseraprobador                               AS aprobador,
                    a.idaprobacion,
                    a.entidad                                       AS id_entidad,
                    en.idetiqueta                                   AS entidad_etiqueta,
                    cp.idcatalogo                                   AS id_tipo_proceso, 
                    cp.idetiqueta                                   AS tipo_proceso_etiqueta,
                    ea.idetiqueta                                   AS estado_aprob_etiqueta
                FROM 
                    apl_tb_acuerdo ac
                INNER JOIN apl_tb_acuerdofondo acf 
                    ON acf.idacuerdo = ac.idacuerdo
                INNER JOIN apl_tb_aprobacion a 
                    ON a.identidad = ac.idacuerdo
                    AND a.idestadoregistro = v_estado_nuevo
                INNER JOIN apl_tb_fondo f 
                    ON f.idfondo = acf.idfondo
                INNER JOIN apl_tb_artefacta_proveedor arp 
                    ON arp.identificacion = f.idproveedor
                LEFT JOIN apl_tb_catalogo cp 
                    ON a.idtipoproceso = cp.idcatalogo
                LEFT JOIN apl_tb_catalogo ct 
                    ON ac.idtipoacuerdo = ct.idcatalogo
                LEFT JOIN apl_tb_catalogo ce 
                    ON ac.idestadoregistro = ce.idcatalogo
                LEFT JOIN apl_tb_catalogo en 
                    ON a.entidad = en.idcatalogo
                LEFT JOIN apl_tb_catalogo ea 
                    ON a.idestadoregistro = ea.idcatalogo
                LEFT JOIN apl_tb_catalogo tf 
                    ON f.idtipofondo = tf.idcatalogo
                WHERE
                    ac.idacuerdo = p_idacuerdo 
                    AND a.idaprobacion = p_idaprobacion;
            
            -- Cursor artículos vacío (no aplica para GENERAL)
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
    
        -- =========================================================================
        -- CASO 2: ACUERDO CON ARTÍCULOS (CLAARTICULO)
        -- =========================================================================
        ELSIF v_etiqueta_tipo = v_etiqueta_articulos THEN
            
            -- Cursor cabecera para ARTÍCULO
            OPEN p_cursor_cabecera FOR
                SELECT
                    cp.nombre                                       AS solicitud,
                    ac.idacuerdo,
                    ac.descripcion,
                    f.idfondo                                       AS id_fondo,
                    f.idtipofondo                                   AS id_tipo_fondo,
                    tf.nombre                                       AS nombre_tipo_fondo,
                    arp.nombre                                      AS nombre_proveedor,
                    ac.idtipoacuerdo                                AS id_tipo_clase_acuerdo,
                    ct.nombre                                       AS nombre_clase_acuerdo,
                    ct.idetiqueta                                   AS etiqueta_clase_acuerdo,
                    NVL(art.cantidad_articulos, 0)                  AS cantidad_articulos,
                    NVL(acf.valoraporte, 0)                         AS valor_acuerdo,
                    TO_CHAR(ac.fechainiciovigencia, 'YYYY-MM-DD')   AS fecha_inicio,
                    TO_CHAR(ac.fechafinvigencia, 'YYYY-MM-DD')      AS fecha_fin,
                    NVL(acf.valordisponible, 0)                     AS valor_disponible,
                    NVL(acf.valorcomprometido, 0)                   AS valor_comprometido,
                    NVL(acf.valorliquidado, 0)                      AS valor_liquidado,
                    ac.idestadoregistro                             AS idestados_acuerdo,
                    ce.nombre                                       AS nombre_estado_acuerdo,
                    ce.idetiqueta                                   AS id_etiqueta_estado_acuerdo,
                    a.nivelaprobacion,
                    a.iduseraprobador                               AS aprobador,
                    a.idaprobacion,
                    a.entidad                                       AS id_entidad,
                    en.idetiqueta                                   AS entidad_etiqueta,
                    cp.idcatalogo                                   AS id_tipo_proceso, 
                    cp.idetiqueta                                   AS tipo_proceso_etiqueta,
                    ea.idetiqueta                                   AS estado_aprob_etiqueta
                FROM 
                    apl_tb_acuerdo ac
                INNER JOIN apl_tb_acuerdofondo acf 
                    ON acf.idacuerdo = ac.idacuerdo
                INNER JOIN apl_tb_aprobacion a 
                    ON a.identidad = ac.idacuerdo
                    AND a.idestadoregistro = v_estado_nuevo
                INNER JOIN apl_tb_fondo f 
                    ON f.idfondo = acf.idfondo
                INNER JOIN apl_tb_artefacta_proveedor arp 
                    ON arp.identificacion = f.idproveedor
                LEFT JOIN apl_tb_catalogo cp 
                    ON a.idtipoproceso = cp.idcatalogo
                LEFT JOIN apl_tb_catalogo ct 
                    ON ac.idtipoacuerdo = ct.idcatalogo
                LEFT JOIN apl_tb_catalogo ce 
                    ON ac.idestadoregistro = ce.idcatalogo
                LEFT JOIN apl_tb_catalogo en 
                    ON a.entidad = en.idcatalogo
                LEFT JOIN apl_tb_catalogo ea 
                    ON a.idestadoregistro = ea.idcatalogo
                LEFT JOIN apl_tb_catalogo tf 
                    ON f.idtipofondo = tf.idcatalogo
                LEFT JOIN (
                    SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                    FROM apl_tb_acuerdoarticulo aa
                    WHERE aa.idestadoregistro != v_id_eliminado
                    GROUP BY aa.idacuerdo
                ) art ON art.idacuerdo = ac.idacuerdo
                WHERE
                    ac.idacuerdo = p_idacuerdo 
                    AND a.idaprobacion = p_idaprobacion;
            
            -- Cursor artículos con detalle
            OPEN p_cursor_articulos FOR
                SELECT 
                    aa.idacuerdoarticulo,
                    aa.idacuerdo,
                    aa.codigoarticulo,
                    aa.costoactual,
                    aa.unidadeslimite,
                    aa.preciocontado,
                    aa.preciotarjetacredito,
                    aa.preciocredito,
                    aa.margencontado,
                    aa.margentarjetacredito,
                    aa.valoraporte,
                    aa.valorcomprometido,
                    aa.idestadoregistro
                FROM 
                    apl_tb_acuerdoarticulo aa
                WHERE 
                    aa.idacuerdo = p_idacuerdo
                    AND aa.idestadoregistro != v_id_eliminado
                ORDER BY 
                    aa.idacuerdoarticulo;
    
        -- =========================================================================
        -- CASO 3: TIPO NO RECONOCIDO
        -- =========================================================================
        ELSE
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Tipo de acuerdo no reconocido: ' || v_etiqueta_tipo;
            
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
        END IF;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontró información para el acuerdo ID: ' || p_idacuerdo;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            
    END sp_consulta_bandeja_aprobacion_por_id;
    
       
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
    ) AS
        -- Variables para IDs de catálogo
        v_idestado                NUMBER;
        v_estadonuevo             NUMBER;
        v_idestadoinactivo        NUMBER;
        
        -- Contador de registros pendientes
        v_registros_pendientes_aprobacion NUMBER := 0;
        
        -- Fecha del sistema
        v_fechasistema            TIMESTAMP := SYSTIMESTAMP;
        
        -- Variables para validación
        v_existe_aprobacion       NUMBER := 0;
        v_existe_acuerdo          NUMBER := 0;
        
        -- Variables para LOG
        v_datos_json              VARCHAR2(4000);
        v_idusersolicitud         VARCHAR2(50);
        v_nombreusersolicitud     VARCHAR2(100);
        v_fechasolicitud          TIMESTAMP := SYSTIMESTAMP;
        v_idestadoregistro        NUMBER;
        v_nivelaprobacion         NUMBER;
        v_id_control_interfaz     NUMBER;
        v_idevento                NUMBER;
        
        -- actualizacion de fondos (Nueva Logica)
        v_idfondo                  NUMBER;
        v_valor_acuerdo            NUMBER := 0;
        v_valor_disponible_fondo   NUMBER := 0;
        --inactivacion (Nueva Logica)
        v_valor_disponible_acuerdo    NUMBER := 0;
        v_valor_comprometido_fondo    NUMBER := 0;

    BEGIN
        
        -- =========================================================================
        -- VARIABLES PARA EL LOG
        -- =========================================================================
        SELECT idcatalogo INTO v_id_control_interfaz FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
            
        SELECT idcatalogo INTO v_idevento FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;
       
     
        -- =========================================================================
        -- VALIDACIONES INICIALES
        -- =========================================================================
        
        -- Validar que existe la aprobación
        SELECT COUNT(*) 
        INTO v_existe_aprobacion
        FROM apl_tb_aprobacion 
        WHERE idaprobacion = p_idaprobacion;
        
        IF v_existe_aprobacion = 0 THEN
            p_codigo_salida := 1;
            p_mensaje_salida := 'ERROR: No existe la aprobación con ID ' || p_idaprobacion;
            RETURN;
        END IF;
        
        -- Validar que existe el acuerdo
        SELECT COUNT(*) 
        INTO v_existe_acuerdo
        FROM apl_tb_acuerdo 
        WHERE idacuerdo = p_identidad;
        
        IF v_existe_acuerdo = 0 THEN
            p_codigo_salida := 1;
            p_mensaje_salida := 'ERROR: No existe el acuerdo con ID ' || p_identidad;
            RETURN;
        END IF;
        
        -- =========================================================================
        -- OBTENER IDS DE CATÁLOGO
        -- =========================================================================
        
        -- ID del estado destino según etiqueta
        SELECT idcatalogo INTO v_idestado FROM apl_tb_catalogo WHERE idetiqueta = p_idetiquetaestado;
                
        -- ID del estado NUEVO
        SELECT idcatalogo INTO v_estadonuevo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
             
        -- ID del estado INACTIVO
        SELECT idcatalogo INTO v_idestadoinactivo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOINACTIVO';
                 
        -- =========================================================================
        -- PASO 1: ACTUALIZAR APROBACIÓN
        -- =========================================================================
        
        UPDATE apl_tb_aprobacion 
        SET 
            fechaaprobacion = v_fechasistema,
            comentario = p_comentario,
            idestadoregistro = v_idestado
        WHERE 
            idaprobacion = p_idaprobacion;
        
        IF SQL%ROWCOUNT = 0 THEN
            p_codigo_salida := 1;
            p_mensaje_salida := 'ERROR: No se pudo actualizar la aprobación';
            ROLLBACK;
            RETURN;
        END IF;
        
        -- =========================================================================
        -- ACTIVAR MARCA DE PROCESO DE APROBACIÓN EN EL ACUERDO
        -- =========================================================================
        
        UPDATE apl_tb_acuerdo 
        SET 
            idusuariomodifica = p_usuarioaprobador,
            fechamodifica = v_fechasistema,
            marcaprocesoaprobacion = 'A'
        WHERE 
            idacuerdo = p_identidad;
        
        -- =========================================================================
        -- OBTENER DATOS DE APROBACIÓN PARA EL LOG
        -- =========================================================================
        
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
            'idaprobacion'          VALUE p_idaprobacion,
            'entidad'               VALUE p_entidad,
            'identidad'             VALUE p_identidad,
            'idtipoproceso'         VALUE p_idtipoproceso,
            'idusersolicitud'       VALUE v_idusersolicitud,
            'nombreusersolicitud'   VALUE v_nombreusersolicitud,
            'fechasolicitud'        VALUE TO_CHAR(v_fechasolicitud, 'YYYY-MM-DD HH24:MI:SS'),
            'iduseraprobador'       VALUE p_usuarioaprobador,
            'fechaaprobacion'       VALUE TO_CHAR(v_fechasistema, 'YYYY-MM-DD HH24:MI:SS'),
            'comentario'            VALUE p_comentario,
            'nivelaprobacion'       VALUE v_nivelaprobacion,
            'idestadoregistro'      VALUE v_idestadoregistro
        );
        
        -- =========================================================================
        -- PASO 2: VERIFICAR APROBACIONES PENDIENTES
        -- =========================================================================
        
        SELECT COUNT(*) 
        INTO v_registros_pendientes_aprobacion
        FROM apl_tb_aprobacion 
        WHERE 
            entidad = p_entidad
            AND identidad = p_identidad
            AND idtipoproceso = p_idtipoproceso
            AND idestadoregistro = v_estadonuevo;
            
        -- =========================================================================
        -- PASO 3: ACTUALIZAR ACUERDO SI NO HAY PENDIENTES
        -- =========================================================================
        
        IF v_registros_pendientes_aprobacion = 0 THEN
            
            -- -----------------------------------------------------------------
            -- Caso 1: CREACIÓN DE ACUERDO
            -- -----------------------------------------------------------------
            IF UPPER(p_idetiquetatipoproceso) = 'TPCREACION' THEN
            
                -- =============================================================
                -- NUEVA LÓGICA: OBTENER DATOS DEL ACUERDO-FONDO
                -- =============================================================
                BEGIN
                    SELECT 
                        acf.idfondo,
                        NVL(acf.valoraporte, 0)
                    INTO 
                        v_idfondo,
                        v_valor_acuerdo
                    FROM 
                        apl_tb_acuerdofondo acf
                    WHERE 
                        acf.idacuerdo = p_identidad
                    AND ROWNUM = 1;
                EXCEPTION
                    WHEN NO_DATA_FOUND THEN
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'ERROR: No se encontró el acuerdo-fondo para el acuerdo ' || p_identidad;
                        ROLLBACK;
                        RETURN;
                END;
                
                -- =============================================================
                -- VALIDAR QUE EL FONDO TIENE SALDO DISPONIBLE SUFICIENTE
                -- =============================================================
                BEGIN
                    SELECT NVL(valordisponible, 0)
                    INTO v_valor_disponible_fondo
                    FROM apl_tb_fondo
                    WHERE idfondo = v_idfondo;
                    
                    IF v_valor_disponible_fondo < v_valor_acuerdo THEN
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'ERROR: El fondo no tiene saldo disponible suficiente. ' ||
                                           'Disponible: ' || v_valor_disponible_fondo || 
                                           ', Requerido: ' || v_valor_acuerdo;
                        ROLLBACK;
                        RETURN;
                    END IF;
                EXCEPTION
                    WHEN NO_DATA_FOUND THEN
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'ERROR: No se encontró el fondo con ID ' || v_idfondo;
                        ROLLBACK;
                        RETURN;
                END;
                
                -- =============================================================
                -- ACTUALIZAR APL_TB_FONDO: COMPROMETIDO Y DISPONIBLE
                -- Incrementar VALORCOMPROMETIDO con el valor del acuerdo
                -- Decrementar VALORDISPONIBLE con el valor del acuerdo
                -- =============================================================
                UPDATE apl_tb_fondo 
                SET 
                    valorcomprometido = NVL(valorcomprometido, 0) + v_valor_acuerdo,
                    valordisponible = NVL(valordisponible, 0) - v_valor_acuerdo,
                    idusuariomodifica = p_usuarioaprobador,
                    fechamodifica = v_fechasistema
                WHERE 
                    idfondo = v_idfondo;
                    
                IF SQL%ROWCOUNT = 0 THEN
                    p_codigo_salida := 1;
                    p_mensaje_salida := 'ERROR: No se pudo actualizar el fondo';
                    ROLLBACK;
                    RETURN;
                END IF;
                
                -- Actualizar estado del acuerdo
                UPDATE apl_tb_acuerdo 
                SET 
                    idusuariomodifica = p_usuarioaprobador,
                    fechamodifica = v_fechasistema,
                    idestadoregistro = v_idestado,
                    marcaprocesoaprobacion = ' '
                WHERE 
                    idacuerdo = p_identidad;
                    
                IF SQL%ROWCOUNT = 0 THEN
                    p_codigo_salida := 1;
                    p_mensaje_salida := 'ERROR: No se pudo actualizar el acuerdo';
                    ROLLBACK;
                    RETURN;
                END IF;
                
                -- Actualizar estado del acuerdo-fondo asociado
                UPDATE apl_tb_acuerdofondo 
                SET 
                    idestadoregistro = 1
                WHERE 
                    idacuerdo = p_identidad;
                
                -- Agregar información del fondo al JSON del LOG
                v_datos_json := JSON_OBJECT(
                    'idaprobacion'             VALUE p_idaprobacion,
                    'entidad'                  VALUE p_entidad,
                    'identidad'                VALUE p_identidad,
                    'idtipoproceso'            VALUE p_idtipoproceso,
                    'tipo_proceso'             VALUE 'TPCREACION',
                    'idfondo'                  VALUE v_idfondo,
                    'valor_acuerdo'            VALUE v_valor_acuerdo,
                    'valor_comprometido_antes' VALUE (v_valor_disponible_fondo + v_valor_acuerdo - v_valor_disponible_fondo),
                    'valor_disponible_antes'   VALUE v_valor_disponible_fondo,
                    'valor_disponible_despues' VALUE (v_valor_disponible_fondo - v_valor_acuerdo),
                    'iduseraprobador'          VALUE p_usuarioaprobador,
                    'fechaaprobacion'          VALUE TO_CHAR(v_fechasistema, 'YYYY-MM-DD HH24:MI:SS'),
                    'comentario'               VALUE p_comentario
                );
                
                p_codigo_salida := 0;
                p_mensaje_salida := 'OK: Acuerdo creado y aprobado exitosamente. ' ||
                                   'Fondo actualizado - Comprometido +' || v_valor_acuerdo || 
                                   ', Disponible -' || v_valor_acuerdo;
                
            -- -----------------------------------------------------------------
            -- Caso 2: INACTIVACIÓN DE ACUERDO
            -- -----------------------------------------------------------------
            ELSIF UPPER(p_idetiquetatipoproceso) = 'TPINACTIVACION' THEN
                
                -- Solo inactivar si el estado es APROBADO
                IF UPPER(p_idetiquetaestado) IN ('ESTADOAPROBADO', 'ESTADOVIGENTE') THEN
                    
                    -- =============================================================
                    -- PASO 1: OBTENER DATOS DEL ACUERDO-FONDO PARA REVERTIR
                    -- Usamos VALORDISPONIBLE del acuerdo (no valoraporte)
                    -- =============================================================
                    BEGIN
                        SELECT 
                            acf.idfondo,
                            NVL(acf.valordisponible, 0)
                        INTO 
                            v_idfondo,
                            v_valor_disponible_acuerdo
                        FROM 
                            apl_tb_acuerdofondo acf
                        WHERE 
                            acf.idacuerdo = p_identidad
                        AND ROWNUM = 1;
                    EXCEPTION
                        WHEN NO_DATA_FOUND THEN
                            p_codigo_salida := 1;
                            p_mensaje_salida := 'ERROR: No se encontró el acuerdo-fondo para el acuerdo ' || p_identidad;
                            ROLLBACK;
                            RETURN;
                    END;
                    
                    -- =============================================================
                    -- PASO 2: OBTENER VALORES ACTUALES DEL FONDO PARA LOG
                    -- =============================================================
                    BEGIN
                        SELECT 
                            NVL(valordisponible, 0),
                            NVL(valorcomprometido, 0)
                        INTO 
                            v_valor_disponible_fondo,
                            v_valor_comprometido_fondo
                        FROM apl_tb_fondo
                        WHERE idfondo = v_idfondo;
                    EXCEPTION
                        WHEN NO_DATA_FOUND THEN
                            p_codigo_salida := 1;
                            p_mensaje_salida := 'ERROR: No se encontró el fondo con ID ' || v_idfondo;
                            ROLLBACK;
                            RETURN;
                    END;
                    
                    -- =============================================================
                    -- PASO 3: ACTUALIZAR APL_TB_FONDO (PRIMERO)
                    -- Decrementar VALORCOMPROMETIDO con el valor disponible del acuerdo
                    -- Incrementar VALORDISPONIBLE con el valor disponible del acuerdo
                    -- =============================================================
                    UPDATE apl_tb_fondo 
                    SET 
                        valorcomprometido = NVL(valorcomprometido, 0) - v_valor_disponible_acuerdo,
                        valordisponible = NVL(valordisponible, 0) + v_valor_disponible_acuerdo,
                        idusuariomodifica = p_usuarioaprobador,
                        fechamodifica = v_fechasistema
                    WHERE 
                        idfondo = v_idfondo;
                        
                    IF SQL%ROWCOUNT = 0 THEN
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'ERROR: No se pudo actualizar el fondo durante inactivación';
                        ROLLBACK;
                        RETURN;
                    END IF;
                    
                    -- =============================================================
                    -- PASO 4: ACTUALIZAR APL_TB_ACUERDOFONDO (SEGUNDO)
                    -- Inactivar y poner valores en 0
                    -- =============================================================
                    UPDATE apl_tb_acuerdofondo 
                    SET 
                        idestadoregistro = 1,
                        valordisponible = 0
                    WHERE 
                        idacuerdo = p_identidad;
                        
                    IF SQL%ROWCOUNT = 0 THEN
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'ERROR: No se pudo actualizar el acuerdo-fondo';
                        ROLLBACK;
                        RETURN;
                    END IF;
                    
                    -- =============================================================
                    -- PASO 5: ACTUALIZAR APL_TB_ACUERDO (TERCERO)
                    -- Actualizar estado del acuerdo a INACTIVO
                    -- =============================================================
                    UPDATE apl_tb_acuerdo 
                    SET 
                        idusuariomodifica = p_usuarioaprobador,
                        fechamodifica = v_fechasistema,
                        idestadoregistro = v_idestadoinactivo,
                        marcaprocesoaprobacion = ' '
                    WHERE 
                        idacuerdo = p_identidad;
                        
                    IF SQL%ROWCOUNT = 0 THEN
                        p_codigo_salida := 1;
                        p_mensaje_salida := 'ERROR: No se pudo inactivar el acuerdo';
                        ROLLBACK;
                        RETURN;
                    END IF;
                    
                    -- =============================================================
                    -- PASO 6: CONSTRUIR JSON PARA LOG
                    -- =============================================================
                    v_datos_json := JSON_OBJECT(
                        'idaprobacion'               VALUE p_idaprobacion,
                        'entidad'                    VALUE p_entidad,
                        'identidad'                  VALUE p_identidad,
                        'idtipoproceso'              VALUE p_idtipoproceso,
                        'tipo_proceso'               VALUE 'TPINACTIVACION',
                        'tipo_operacion'             VALUE 'APROBACION_INACTIVACION',
                        'idfondo'                    VALUE v_idfondo,
                        'valor_disponible_acuerdo'   VALUE v_valor_disponible_acuerdo,
                        'fondo_comprometido_antes'   VALUE v_valor_comprometido_fondo,
                        'fondo_comprometido_despues' VALUE (v_valor_comprometido_fondo - v_valor_disponible_acuerdo),
                        'fondo_disponible_antes'     VALUE v_valor_disponible_fondo,
                        'fondo_disponible_despues'   VALUE (v_valor_disponible_fondo + v_valor_disponible_acuerdo),
                        'iduseraprobador'            VALUE p_usuarioaprobador,
                        'fechaaprobacion'            VALUE TO_CHAR(v_fechasistema, 'YYYY-MM-DD HH24:MI:SS'),
                        'comentario'                 VALUE p_comentario
                    );
                    
                    p_codigo_salida := 0;
                    p_mensaje_salida := 'OK: Acuerdo inactivado exitosamente. ' ||
                                       'Fondo actualizado - Comprometido -' || v_valor_disponible_acuerdo || 
                                       ', Disponible +' || v_valor_disponible_acuerdo;
                    
                ELSE
                    -- Rechazo de inactivación
                    p_codigo_salida := 0;
                    p_mensaje_salida := 'OK: Inactivación rechazada, acuerdo permanece vigente';
                    
                    -- Quitar marca de proceso de aprobación
                    UPDATE apl_tb_acuerdo 
                    SET 
                        idusuariomodifica = p_usuarioaprobador,
                        fechamodifica = v_fechasistema,
                        marcaprocesoaprobacion = ' '
                    WHERE 
                        idacuerdo = p_identidad;
                    
                    -- Construir JSON para rechazo de inactivación
                    v_datos_json := JSON_OBJECT(
                        'tipo_proceso'    VALUE 'TPINACTIVACION',
                        'tipo_operacion'  VALUE 'RECHAZO_INACTIVACION',
                        'razon'           VALUE 'Estado de aprobación no es APROBADO',
                        'estado_recibido' VALUE p_idetiquetaestado,
                        'idacuerdo'       VALUE p_identidad,
                        'idaprobacion'    VALUE p_idaprobacion
                    );
                    
                END IF; -- Fin IF ESTADOAPROBADO
                
            ELSE
                -- Tipo de proceso no reconocido
                p_codigo_salida := 1;
                p_mensaje_salida := 'ERROR: Tipo de proceso no reconocido: ' || p_idetiquetatipoproceso;
                ROLLBACK;
                RETURN;
                
            END IF; -- Fin IF TPCREACION / ELSIF TPINACTIVACION
            
        ELSE
            -- Aún hay aprobaciones pendientes
            p_codigo_salida := 0;
            p_mensaje_salida := 'OK: Aprobación registrada. Quedan ' || 
                               v_registros_pendientes_aprobacion || ' aprobaciones pendientes';
                               
        END IF; -- Fin IF v_registros_pendientes_aprobacion = 0
        

        
        -- =========================================================================
        -- PASO 4: INSERTAR EN LOG
        -- =========================================================================
        
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
            p_entidad,
            p_identidad,
            p_idtipoproceso, 
            v_datos_json
        );
        
        -- =========================================================================
        -- CONFIRMAR TRANSACCIÓN
        -- =========================================================================
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_codigo_salida := 1;
            p_mensaje_salida := 'Error en proceso de aprobación de acuerdo: ' || SQLERRM;
            
    END sp_proceso_aprobacion_acuerdo;

    /*
    =========================================================
    Descripción: Bandeja Consulta / Modificacion Acuerdo 
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_modificacion (
        p_cursor          OUT t_cursor, 
        p_codigo_salida   OUT NUMBER,
        p_mensaje_salida  OUT VARCHAR2
    ) AS
        -- Variables para catálogos
        v_estado_negado      NUMBER;
        v_estado_nuevo       NUMBER;
        v_estado_modificado  NUMBER;
        v_contador_registro  NUMBER;
        v_id_eliminado       NUMBER;
        
    BEGIN
        -- Inicializar salida exitosa
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        
        -- Obtener catálogos de estados
        SELECT idcatalogo INTO v_estado_negado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONEGADO';
        
        SELECT idcatalogo INTO v_estado_nuevo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
        
        SELECT idcatalogo INTO v_estado_modificado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOMODIFICADO';
        
        SELECT idcatalogo INTO v_id_eliminado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
        
        -- Validar que existan registros
        SELECT COUNT(*) INTO v_contador_registro
        FROM apl_tb_acuerdo a
        INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
        LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
        WHERE ce.idetiqueta IN ('ESTADONUEVO', 'ESTADOMODIFICADO', 'ESTADONEGADO')
          AND NVL(a.marcaprocesoaprobacion, ' ') = ' ';
        
        IF v_contador_registro = 0 THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'No se encontraron registros en la bandeja de modificación.';
        END IF;
        
        -- Abrir cursor con la consulta
        OPEN p_cursor FOR
            SELECT q.* FROM (
                SELECT 
                    a.idacuerdo,
                    a.descripcion,
                    af.idfondo,
                    tf.nombre                                        AS nombre_tipo_fondo,
                    arp.nombre                                       AS nombre_proveedor,
                    ct.nombre                                        AS clase_acuerdo,
                    NVL(art.cantidad_articulos, 0)                   AS cantidad_articulos,
                    af.valoraporte                                   AS valor_acuerdo,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    af.valordisponible                               AS valor_disponible,
                    af.valorcomprometido                             AS valor_comprometido,
                    af.valorliquidado                                AS valor_liquidado,
                    ce.nombre                                        AS estado,
                    ce.idetiqueta                                    AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    LEFT JOIN (
                        SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo aa
                        WHERE aa.idestadoregistro != v_id_eliminado
                        GROUP BY aa.idacuerdo
                    ) art ON art.idacuerdo = a.idacuerdo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    ce.idetiqueta IN ('ESTADONUEVO', 'ESTADOMODIFICADO', 'ESTADONEGADO')
                    
            ) q
            ORDER BY q.idacuerdo;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontraron los catálogos necesarios para la consulta.';
            OPEN p_cursor FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            
    END sp_consulta_bandeja_modificacion;


    PROCEDURE sp_consulta_bandeja_modificacion_por_id (
        p_idacuerdo            IN  NUMBER,
        p_cursor_cabecera      OUT SYS_REFCURSOR,
        p_cursor_articulos     OUT SYS_REFCURSOR,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    ) AS
        -- Variables para catálogos
        v_etiqueta_tipo         VARCHAR2(50);
        v_contador_registro     NUMBER;
        
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulos    VARCHAR2(50);
        v_id_eliminado          NUMBER;
        
    BEGIN
        -- Inicializar salida exitosa
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        p_tipo_acuerdo   := NULL;
        
        -- Validar que el acuerdo exista
        SELECT COUNT(*) INTO v_contador_registro
        FROM apl_tb_acuerdo
        WHERE idacuerdo = p_idacuerdo;
        
        IF v_contador_registro = 0 THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'No se encontró el acuerdo con ID: ' || p_idacuerdo;
            
            -- Abrir cursores vacíos
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- Obtener etiquetas de catálogo
        SELECT idetiqueta INTO v_etiqueta_general 
        FROM apl_tb_catalogo 
        WHERE idetiqueta = 'CLAGENERAL';
        
        SELECT idetiqueta INTO v_etiqueta_articulos 
        FROM apl_tb_catalogo 
        WHERE idetiqueta = 'CLAARTICULO';
        
        SELECT idcatalogo INTO v_id_eliminado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
        
        -- =====================================================
        -- OBTENER EL TIPO DE ACUERDO DEL REGISTRO CONSULTADO
        -- =====================================================
        SELECT ct.idetiqueta INTO v_etiqueta_tipo
        FROM apl_tb_acuerdo a
        INNER JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
        WHERE a.idacuerdo = p_idacuerdo;
        
        -- Asignar al parámetro de salida
        p_tipo_acuerdo := v_etiqueta_tipo;
        
        -- =====================================================
        -- CASO 1: ACUERDO GENERAL (ACGENERAL)
        -- =====================================================
        IF v_etiqueta_tipo = v_etiqueta_general THEN
            
            -- Cursor cabecera para GENERAL
            OPEN p_cursor_cabecera FOR
                SELECT 
                    a.idacuerdo,
                    a.idtipoacuerdo,
                    ct.nombre                                        AS clase_acuerdo,
                    NVL(art.cantidad_articulos, 0)                   AS cantidad_articulos,
                    ct.idetiqueta                                    AS clase_acuerdo_etiqueta,
                    a.idmotivoacuerdo,
                    cm.nombre                                        AS motivo,
                    a.descripcion,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    af.idacuerdofondo,
                    af.idfondo,
                    tf.nombre || ' - ' || arp.nombre                 AS fondo_proveedor,
                    af.valoraporte                                   AS valor_total,
                    af.valordisponible                               AS valor_disponible,
                    af.valorcomprometido                             AS valor_comprometido,
                    af.valorliquidado                                AS valor_liquidado,
                    a.idestadoregistro,
                    ce.nombre                                        AS estado,
                    ce.idetiqueta                                    AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo cm ON a.idmotivoacuerdo = cm.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    LEFT JOIN (
                        SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo aa
                        WHERE aa.idestadoregistro != v_id_eliminado
                        GROUP BY aa.idacuerdo
                    ) art ON art.idacuerdo = a.idacuerdo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    a.idacuerdo = p_idacuerdo;
            
            -- Cursor artículos vacío (no aplica para GENERAL)
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
        
        -- =====================================================
        -- CASO 2: ACUERDO CON ARTÍCULOS (ACARTICULO)
        -- =====================================================
        ELSIF v_etiqueta_tipo = v_etiqueta_articulos THEN
            
            -- Cursor cabecera para ARTÍCULO
            OPEN p_cursor_cabecera FOR
                SELECT 
                    a.idacuerdo,
                    a.idtipoacuerdo,
                    ct.nombre                                        AS clase_acuerdo,
                    NVL(art.cantidad_articulos, 0)                   AS cantidad_articulos,
                    ct.idetiqueta                                    AS clase_acuerdo_etiqueta,
                    a.idmotivoacuerdo,
                    cm.nombre                                        AS motivo,
                    a.descripcion,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    af.idacuerdofondo,
                    af.idfondo,
                    tf.nombre || ' - ' || arp.nombre                 AS fondo_proveedor,
                    af.valoraporte                                   AS valor_total,
                    af.valordisponible                               AS valor_disponible,
                    af.valorcomprometido                             AS valor_comprometido,
                    af.valorliquidado                                AS valor_liquidado,
                    a.idestadoregistro,
                    ce.nombre                                        AS estado,
                    ce.idetiqueta                                    AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo cm ON a.idmotivoacuerdo = cm.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    LEFT JOIN (
                        SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo aa
                        WHERE aa.idestadoregistro != v_id_eliminado
                        GROUP BY aa.idacuerdo
                    ) art ON art.idacuerdo = a.idacuerdo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    a.idacuerdo = p_idacuerdo;
            
            -- Cursor artículos con detalle
            OPEN p_cursor_articulos FOR
                SELECT 
                    aa.idacuerdoarticulo,
                    aa.idacuerdo,
                    aa.codigoarticulo                                AS articulo,
                    aa.costoactual                                   AS costo,
                    aa.unidadeslimite                                AS unidades_limite,
                    aa.preciocontado                                 AS precio_contado,
                    aa.preciotarjetacredito                          AS precio_tc,
                    aa.preciocredito                                 AS precio_credito,
                    aa.valoraporte                                   AS aporte_unidad_proveedor,
                    aa.valorcomprometido                             AS comprometido_proveedor,
                    aa.margencontado                                 AS margen_contado,
                    aa.margentarjetacredito                          AS margen_tc,
                    aa.idestadoregistro
                FROM 
                    apl_tb_acuerdoarticulo aa
                WHERE 
                    aa.idacuerdo = p_idacuerdo AND aa.idestadoregistro != v_id_eliminado
                ORDER BY 
                    aa.idacuerdoarticulo;
        
        -- =====================================================
        -- CASO 3: TIPO NO RECONOCIDO
        -- =====================================================
        ELSE
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Tipo de acuerdo no reconocido: ' || v_etiqueta_tipo;
            
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
        END IF;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontró información para el acuerdo ID: ' || p_idacuerdo;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            
    END sp_consulta_bandeja_modificacion_por_id;
    
    
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
        
        -- Parámetros para el LOG
        p_idopcion              IN NUMBER,
        p_idcontrolinterfaz     IN VARCHAR2,
        p_idevento_etiqueta     IN VARCHAR2,
        
        -- Parámetros de salida
        p_codigo_salida         OUT NUMBER,
        p_mensaje_salida        OUT VARCHAR2
    )
    AS
        -- Variables para etiquetas de clase
        v_etiqueta_recibida         VARCHAR2(50);
        v_etiqueta_general          VARCHAR2(50);
        v_etiqueta_articulos        VARCHAR2(50);
        
        -- Variables para estados (IDs del catálogo)
        v_estado_activo             NUMBER;
        v_estado_nuevo              NUMBER;
        v_estado_aprobado           NUMBER;
        v_estado_negado             NUMBER;
        v_estado_modificado         NUMBER;
        v_estado_eliminado          NUMBER;
        
        -- Variable para entidad
        v_entidad_acuerdo           NUMBER;
        
        -- Variables de control
        v_estado_actual_acuerdo     NUMBER;
        v_idacuerdofondo            NUMBER;
        v_secuencial_lote           NUMBER;
        v_count_aprobadores         NUMBER;
        v_idtipoacuerdo             NUMBER;
        
        -- Variables para LOG
        v_json_log                  CLOB;
        v_id_controlinterfaz        NUMBER;
        v_id_evento                 NUMBER;
        
    BEGIN
        -- ========================================================================
        -- PASO 0: Obtener etiquetas y estados desde el catálogo
        -- ========================================================================
        
        -- Normalizar la etiqueta recibida
        v_etiqueta_recibida := UPPER(TRIM(p_claseacuerdo));
        
        -- Etiquetas de clase de acuerdo
        SELECT IDETIQUETA INTO v_etiqueta_general FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'CLAGENERAL';
        SELECT IDETIQUETA INTO v_etiqueta_articulos FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'CLAARTICULO';
        
        -- Estados
        SELECT IDCATALOGO INTO v_estado_activo FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'ESTADOACTIVO';
        SELECT IDCATALOGO INTO v_estado_nuevo FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'ESTADONUEVO';
        SELECT IDCATALOGO INTO v_estado_aprobado FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'ESTADOAPROBADO';
        SELECT IDCATALOGO INTO v_estado_negado FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'ESTADONEGADO';
        SELECT IDCATALOGO INTO v_estado_modificado FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'ESTADOMODIFICADO';
        SELECT IDCATALOGO INTO v_estado_eliminado FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'ESTADOELIMINADO';
        
        -- Entidad
        SELECT IDCATALOGO INTO v_entidad_acuerdo FROM APL_TB_CATALOGO WHERE IDETIQUETA = 'ENTACUERDO';
        
        -- Para el LOG (convertir etiquetas a IDs)
        SELECT IDCATALOGO INTO v_id_controlinterfaz FROM APL_TB_CATALOGO WHERE IDETIQUETA = p_idcontrolinterfaz;
        SELECT IDCATALOGO INTO v_id_evento FROM APL_TB_CATALOGO WHERE IDETIQUETA = p_idevento_etiqueta;
    
        -- ========================================================================
        -- VALIDACIONES
        -- ========================================================================
        
        -- Validar clase de acuerdo
        IF v_etiqueta_recibida NOT IN (v_etiqueta_general, v_etiqueta_articulos) THEN
            p_codigo_salida := -2;
            p_mensaje_salida := 'Error: La clase de acuerdo debe ser CLAGENERAL o CLAARTICULO. Recibido: ' || v_etiqueta_recibida;
            RETURN;
        END IF;
        
        -- Validar que el acuerdo exista
        BEGIN
            SELECT IDESTADOREGISTRO, IDTIPOACUERDO 
            INTO v_estado_actual_acuerdo, v_idtipoacuerdo
            FROM APL_TB_ACUERDO 
            WHERE IDACUERDO = p_idacuerdo;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                p_codigo_salida := -3;
                p_mensaje_salida := 'Error: El acuerdo con ID ' || p_idacuerdo || ' no existe.';
                RETURN;
        END;
        
        -- Validar que el fondo exista
        BEGIN
            SELECT IDACUERDOFONDO INTO v_idacuerdofondo
            FROM APL_TB_ACUERDOFONDO
            WHERE IDACUERDO = p_idacuerdo AND IDFONDO = p_idfondo AND ROWNUM = 1;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                p_codigo_salida := -4;
                p_mensaje_salida := 'Error: No existe fondo con ID ' || p_idfondo || ' para el acuerdo ' || p_idacuerdo;
                RETURN;
        END;
    
        -- ========================================================================
        -- PROCESAR SEGÚN CLASE DE ACUERDO
        -- ========================================================================
        
        IF v_etiqueta_recibida = v_etiqueta_general THEN
            -- ==================================================================
            -- CLASE GENERAL: Modifica APL_TB_ACUERDO + APL_TB_ACUERDOFONDO
            -- ==================================================================
            
            -- Modificar APL_TB_ACUERDO
            UPDATE APL_TB_ACUERDO
            SET IDMOTIVOACUERDO     = p_idmotivoacuerdo,
                DESCRIPCION         = p_descripcion,
                FECHAINICIOVIGENCIA = p_fechainiciovigencia,
                FECHAFINVIGENCIA    = p_fechafinvigencia,
                FECHAMODIFICA       = SYSTIMESTAMP,
                IDUSUARIOMODIFICA   = p_idusuariomodifica,
                IDESTADOREGISTRO    = v_estado_modificado
            WHERE IDACUERDO = p_idacuerdo;
            
            -- Modificar APL_TB_ACUERDOFONDO
            UPDATE APL_TB_ACUERDOFONDO
            SET VALORAPORTE       = p_valoraporte,
                VALORDISPONIBLE   = p_valordisponible,
                VALORCOMPROMETIDO = NVL(p_valorcomprometido, VALORCOMPROMETIDO),
                VALORLIQUIDADO    = NVL(p_valorliquidado, VALORLIQUIDADO)
            WHERE IDACUERDOFONDO = v_idacuerdofondo;
            
        ELSIF v_etiqueta_recibida = v_etiqueta_articulos THEN
            -- ==================================================================
            -- CLASE ARTÍCULO: Modifica APL_TB_ACUERDO + APL_TB_ACUERDOFONDO + APL_TB_ACUERDOARTICULO
            -- ==================================================================
            
            -- Modificar APL_TB_ACUERDO
            UPDATE APL_TB_ACUERDO
            SET IDMOTIVOACUERDO     = p_idmotivoacuerdo,
                DESCRIPCION         = p_descripcion,
                FECHAINICIOVIGENCIA = p_fechainiciovigencia,
                FECHAFINVIGENCIA    = p_fechafinvigencia,
                FECHAMODIFICA       = SYSTIMESTAMP,
                IDUSUARIOMODIFICA   = p_idusuariomodifica,
                IDESTADOREGISTRO    = v_estado_modificado
            WHERE IDACUERDO = p_idacuerdo;
            
            -- Modificar APL_TB_ACUERDOFONDO
            UPDATE APL_TB_ACUERDOFONDO
            SET VALORAPORTE       = p_valoraporte,
                VALORDISPONIBLE   = p_valordisponible,
                VALORCOMPROMETIDO = NVL(p_valorcomprometido, VALORCOMPROMETIDO),
                VALORLIQUIDADO    = NVL(p_valorliquidado, VALORLIQUIDADO)
            WHERE IDACUERDOFONDO = v_idacuerdofondo;
            
            -- Procesar artículos desde JSON
            IF p_json_articulos IS NOT NULL AND LENGTH(p_json_articulos) > 2 THEN
                
                -- =============================================================
                -- INSERTAR artículos nuevos (accion = 'I')
                -- =============================================================
                FOR r IN (
                    SELECT *
                    FROM JSON_TABLE(p_json_articulos, '$[*]' 
                        COLUMNS (
                            accion               VARCHAR2(1)   PATH '$.accion',
                            codigoArticulo       VARCHAR2(20)  PATH '$.codigoArticulo',
                            costoActual          NUMBER(18,2)  PATH '$.costoActual',
                            unidadesLimite       NUMBER(10)    PATH '$.unidadesLimite',
                            precioContado        NUMBER(18,2)  PATH '$.precioContado',
                            precioTarjetaCredito NUMBER(18,2)  PATH '$.precioTarjetaCredito',
                            precioCredito        NUMBER(18,2)  PATH '$.precioCredito',
                            valorAporte          NUMBER(18,2)  PATH '$.valorAporte',
                            margenContado        NUMBER(18,2)  PATH '$.margenContado',
                            margenTarjetaCredito NUMBER(18,2)  PATH '$.margenTarjetaCredito'
                        )
                    )
                    WHERE accion = 'I'
                ) LOOP
                    INSERT INTO APL_TB_ACUERDOARTICULO (
                        IDACUERDO, CODIGOARTICULO, COSTOACTUAL, 
                        UNIDADESLIMITE, PRECIOCONTADO, PRECIOTARJETACREDITO, PRECIOCREDITO,
                        MARGENCONTADO, MARGENTARJETACREDITO, VALORAPORTE, VALORCOMPROMETIDO, IDESTADOREGISTRO
                    ) VALUES (
                        p_idacuerdo, r.codigoArticulo, r.costoActual,
                        r.unidadesLimite, r.precioContado, r.precioTarjetaCredito, 
                        r.precioCredito, r.margenContado, r.margenTarjetaCredito, 
                        r.valorAporte, 0, v_estado_activo
                    );
                END LOOP;
    
                -- =============================================================
                -- ACTUALIZAR artículos existentes (accion = 'U')
                -- =============================================================
                FOR r IN (
                    SELECT *
                    FROM JSON_TABLE(p_json_articulos, '$[*]' 
                        COLUMNS (
                            accion               VARCHAR2(1)   PATH '$.accion',
                            idAcuerdoArticulo    NUMBER(18)    PATH '$.idAcuerdoArticulo',
                            codigoArticulo       VARCHAR2(20)  PATH '$.codigoArticulo',
                            costoActual          NUMBER(18,2)  PATH '$.costoActual',
                            unidadesLimite       NUMBER(10)    PATH '$.unidadesLimite',
                            precioContado        NUMBER(18,2)  PATH '$.precioContado',
                            precioTarjetaCredito NUMBER(18,2)  PATH '$.precioTarjetaCredito',
                            precioCredito        NUMBER(18,2)  PATH '$.precioCredito',
                            valorAporte          NUMBER(18,2)  PATH '$.valorAporte',
                            margenContado        NUMBER(18,2)  PATH '$.margenContado',
                            margenTarjetaCredito NUMBER(18,2)  PATH '$.margenTarjetaCredito'
                        )
                    )
                    WHERE accion = 'U'
                ) LOOP
                    UPDATE APL_TB_ACUERDOARTICULO
                    SET CODIGOARTICULO       = r.codigoArticulo,
                        COSTOACTUAL          = r.costoActual,
                        UNIDADESLIMITE       = r.unidadesLimite,
                        PRECIOCONTADO        = r.precioContado,
                        PRECIOTARJETACREDITO = r.precioTarjetaCredito,
                        PRECIOCREDITO        = r.precioCredito,
                        VALORAPORTE          = r.valorAporte,
                        MARGENCONTADO        = r.margenContado,
                        MARGENTARJETACREDITO = r.margenTarjetaCredito
                    WHERE IDACUERDOARTICULO = r.idAcuerdoArticulo 
                      AND IDACUERDO = p_idacuerdo;
                END LOOP;
    
                -- =============================================================
                -- ELIMINAR artículos (accion = 'D') - Eliminación lógica
                -- =============================================================
                FOR r IN (
                    SELECT *
                    FROM JSON_TABLE(p_json_articulos, '$[*]' 
                        COLUMNS (
                            accion            VARCHAR2(1) PATH '$.accion',
                            idAcuerdoArticulo NUMBER(18)  PATH '$.idAcuerdoArticulo'
                        )
                    )
                    WHERE accion = 'D'
                ) LOOP
                    UPDATE APL_TB_ACUERDOARTICULO
                    SET IDESTADOREGISTRO = v_estado_eliminado
                    WHERE IDACUERDOARTICULO = r.idAcuerdoArticulo 
                      AND IDACUERDO = p_idacuerdo;
                END LOOP;
                
            END IF;
            
        END IF;
    
        -- ========================================================================
        -- PASO 4: Si estaba NEGADO, crear proceso de aprobación
        -- ========================================================================
        IF v_estado_actual_acuerdo = v_estado_negado THEN
            
            -- Contar aprobadores asignados a esta entidad y tipo de proceso
            SELECT COUNT(*) INTO v_count_aprobadores
            FROM APL_TB_APROBADOR
            WHERE ENTIDAD = v_entidad_acuerdo
              AND IDTIPOPROCESO = p_idtipoproceso
              AND IDESTADOREGISTRO = v_estado_activo;
            
            IF v_count_aprobadores > 0 THEN
                -- ============================================================
                -- SI EXISTEN APROBADORES: Crear registros de aprobación
                -- ============================================================
                
                -- Obtener y actualizar el secuencial del lote
                SELECT SECUENCIAL + 1 INTO v_secuencial_lote 
                FROM APL_TB_LOTE 
                WHERE ENTIDAD = v_entidad_acuerdo
                FOR UPDATE;
                
                -- Actualizar secuencial en tabla de lote
                UPDATE APL_TB_LOTE 
                SET SECUENCIAL = v_secuencial_lote 
                WHERE ENTIDAD = v_entidad_acuerdo;
                
                -- Actualizar acuerdo con el número de lote y estado nuevo
                UPDATE APL_TB_ACUERDO
                SET NUMEROLOTEAPROBACION = v_secuencial_lote,
                    MARCAPROCESOAPROBACION = 'S',
                    IDESTADOREGISTRO = v_estado_nuevo
                WHERE IDACUERDO = p_idacuerdo;
                
                -- Crear un registro de aprobación por cada aprobador encontrado
                FOR r_aprobador IN (
                    SELECT IDAPROBADOR, IDUSERAPROBADOR, NIVELAPROBACION
                    FROM APL_TB_APROBADOR
                    WHERE ENTIDAD = v_entidad_acuerdo
                      AND IDTIPOPROCESO = p_idtipoproceso
                      AND IDESTADOREGISTRO = v_estado_activo
                    ORDER BY NIVELAPROBACION
                ) LOOP
                    
                    INSERT INTO APL_TB_APROBACION (
                        ENTIDAD,
                        IDENTIDAD,
                        IDTIPOPROCESO,
                        IDUSERSOLICITUD,
                        FECHASOLICITUD,
                        IDUSERAPROBADOR,
                        NIVELAPROBACION,
                        IDESTADOREGISTRO,
                        NUMEROLOTEAPROBACION
                    ) VALUES (
                        v_entidad_acuerdo,
                        p_idacuerdo,
                        p_idtipoproceso,
                        p_idusuariomodifica,
                        SYSTIMESTAMP,
                        r_aprobador.IDUSERAPROBADOR,
                        r_aprobador.NIVELAPROBACION,
                        v_estado_nuevo,
                        v_secuencial_lote
                    );
                    
                END LOOP;
                
            ELSE
                -- ============================================================
                -- NO EXISTEN APROBADORES: El acuerdo nace aprobado
                -- ============================================================
                UPDATE APL_TB_ACUERDO
                SET IDESTADOREGISTRO = v_estado_aprobado,
                    MARCAPROCESOAPROBACION = 'N'
                WHERE IDACUERDO = p_idacuerdo;
                
            END IF;
            
        END IF;
    
        -- ========================================================================
        -- PASO 5: Crear registro en APL_TB_LOG
        -- ========================================================================
        
        -- Construir JSON de datos según la clase de acuerdo
        IF v_etiqueta_recibida = v_etiqueta_general THEN
            -- JSON para CLAGENERAL (sin artículos)
            SELECT JSON_OBJECT(
                'acuerdo' VALUE (
                    SELECT JSON_OBJECT(
                        'idAcuerdo' VALUE IDACUERDO,
                        'idTipoAcuerdo' VALUE IDTIPOACUERDO,
                        'idMotivoAcuerdo' VALUE IDMOTIVOACUERDO,
                        'descripcion' VALUE DESCRIPCION,
                        'fechaInicioVigencia' VALUE TO_CHAR(FECHAINICIOVIGENCIA, 'YYYY-MM-DD HH24:MI:SS'),
                        'fechaFinVigencia' VALUE TO_CHAR(FECHAFINVIGENCIA, 'YYYY-MM-DD HH24:MI:SS'),
                        'idEstadoRegistro' VALUE IDESTADOREGISTRO,
                        'marcaProcesoAprobacion' VALUE MARCAPROCESOAPROBACION,
                        'numeroLoteAprobacion' VALUE NUMEROLOTEAPROBACION
                    ) FROM APL_TB_ACUERDO WHERE IDACUERDO = p_idacuerdo
                ),
                'fondo' VALUE (
                    SELECT JSON_OBJECT(
                        'idAcuerdoFondo' VALUE IDACUERDOFONDO,
                        'idFondo' VALUE IDFONDO,
                        'valorAporte' VALUE VALORAPORTE,
                        'valorDisponible' VALUE VALORDISPONIBLE,
                        'valorComprometido' VALUE VALORCOMPROMETIDO,
                        'valorLiquidado' VALUE VALORLIQUIDADO
                    ) FROM APL_TB_ACUERDOFONDO WHERE IDACUERDOFONDO = v_idacuerdofondo
                )
            ) INTO v_json_log FROM DUAL;
            
        ELSIF v_etiqueta_recibida = v_etiqueta_articulos THEN
            -- JSON para CLAARTICULO (con artículos)
            SELECT JSON_OBJECT(
                'acuerdo' VALUE (
                    SELECT JSON_OBJECT(
                        'idAcuerdo' VALUE IDACUERDO,
                        'idTipoAcuerdo' VALUE IDTIPOACUERDO,
                        'idMotivoAcuerdo' VALUE IDMOTIVOACUERDO,
                        'descripcion' VALUE DESCRIPCION,
                        'fechaInicioVigencia' VALUE TO_CHAR(FECHAINICIOVIGENCIA, 'YYYY-MM-DD HH24:MI:SS'),
                        'fechaFinVigencia' VALUE TO_CHAR(FECHAFINVIGENCIA, 'YYYY-MM-DD HH24:MI:SS'),
                        'idEstadoRegistro' VALUE IDESTADOREGISTRO,
                        'marcaProcesoAprobacion' VALUE MARCAPROCESOAPROBACION,
                        'numeroLoteAprobacion' VALUE NUMEROLOTEAPROBACION
                    ) FROM APL_TB_ACUERDO WHERE IDACUERDO = p_idacuerdo
                ),
                'fondo' VALUE (
                    SELECT JSON_OBJECT(
                        'idAcuerdoFondo' VALUE IDACUERDOFONDO,
                        'idFondo' VALUE IDFONDO,
                        'valorAporte' VALUE VALORAPORTE,
                        'valorDisponible' VALUE VALORDISPONIBLE,
                        'valorComprometido' VALUE VALORCOMPROMETIDO,
                        'valorLiquidado' VALUE VALORLIQUIDADO
                    ) FROM APL_TB_ACUERDOFONDO WHERE IDACUERDOFONDO = v_idacuerdofondo
                ),
                'articulos' VALUE (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'idAcuerdoArticulo' VALUE IDACUERDOARTICULO,
                            'codigoArticulo' VALUE CODIGOARTICULO,
                            'costoActual' VALUE COSTOACTUAL,
                            'unidadesLimite' VALUE UNIDADESLIMITE,
                            'precioContado' VALUE PRECIOCONTADO,
                            'precioTarjetaCredito' VALUE PRECIOTARJETACREDITO,
                            'precioCredito' VALUE PRECIOCREDITO,
                            'margenContado' VALUE MARGENCONTADO,
                            'margenTarjetaCredito' VALUE MARGENTARJETACREDITO,
                            'valorAporte' VALUE VALORAPORTE,
                            'valorComprometido' VALUE VALORCOMPROMETIDO
                        )
                    ) FROM APL_TB_ACUERDOARTICULO 
                    WHERE IDACUERDO = p_idacuerdo 
                      AND IDESTADOREGISTRO <> v_estado_eliminado
                )
            ) INTO v_json_log FROM DUAL;
            
        END IF;
    
        -- Insertar registro en APL_TB_LOG
        INSERT INTO APL_TB_LOG (
            FECHAHORATRX,
            IDUSER,
            IDOPCION,
            IDCONTROLINTERFAZ,
            IDEVENTO,
            ENTIDAD,
            IDENTIDAD,
            IDTIPOPROCESO,
            DATOS
        ) VALUES (
            SYSTIMESTAMP,
            p_idusuariomodifica,
            p_idopcion,
            v_id_controlinterfaz,
            v_id_evento,
            v_entidad_acuerdo,
            p_idacuerdo,
            p_idtipoproceso,
            v_json_log
        );
    
        -- ========================================================================
        -- COMMIT y resultado exitoso
        -- ========================================================================
        COMMIT;
        p_codigo_salida := 0;
        p_mensaje_salida := 'Acuerdo modificado exitosamente. ID: ' || p_idacuerdo;
    
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_codigo_salida := -99;
            p_mensaje_salida := 'Error inesperado: ' || SQLERRM;
    END sp_modificar_acuerdo;
 
    /*
    =========================================================
    Descripción: Bandeja Consulta / Inactivacion Acuerdo 
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_inactivacion_acuerdo (
        p_cursor OUT SYS_REFCURSOR
    ) AS
        v_id_eliminado NUMBER;
    BEGIN
    
        -- Obtener el ID del estado eliminado
        SELECT idcatalogo INTO v_id_eliminado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
        
        OPEN p_cursor FOR 
            SELECT
                a.idacuerdo,
                a.descripcion,
                -- Información del Fondo
                f.idfondo                                        AS id_fondo,
                tf.nombre                                        AS nombre_tipo_fondo,
                arp.nombre                                       AS nombre_proveedor,
                cta.nombre                                       AS clase_acuerdo,
                NVL(art.cantidad_articulos, 0)                   AS cantidad_articulos,
                NVL(SUM(af.valoraporte), 0)                      AS valor_acuerdo,
                TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                NVL(SUM(af.valordisponible), 0)                  AS valor_disponible,
                NVL(SUM(af.valorcomprometido), 0)                AS valor_comprometido,
                NVL(SUM(af.valorliquidado), 0)                   AS valor_liquidado,
                ce.nombre                                        AS estado
            FROM
                apl_tb_acuerdo a
                LEFT JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                LEFT JOIN apl_tb_fondo f ON af.idfondo = f.idfondo
                LEFT JOIN apl_tb_catalogo cta ON a.idtipoacuerdo = cta.idcatalogo
                LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                LEFT JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                LEFT JOIN (
                    SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                    FROM apl_tb_acuerdoarticulo aa
                    WHERE aa.idestadoregistro != (
                        SELECT idcatalogo 
                        FROM apl_tb_catalogo 
                        WHERE idetiqueta = 'ESTADOELIMINADO'
                    )
                    GROUP BY aa.idacuerdo
                ) art ON art.idacuerdo = a.idacuerdo
            WHERE 
                ce.idetiqueta IN ('ESTADOAPROBADO', 'ESTADOVIGENTE')
            GROUP BY
                a.idacuerdo,
                a.descripcion,
                f.idfondo,
                tf.nombre,
                arp.nombre,
                cta.nombre,
                art.cantidad_articulos,
                a.fechainiciovigencia,
                a.fechafinvigencia,
                ce.nombre
            ORDER BY
                a.idacuerdo;
    
    END sp_consulta_bandeja_inactivacion_acuerdo;

    
    PROCEDURE sp_consulta_bandeja_inactivacion_acuerdo_por_id (
        p_idacuerdo            IN  NUMBER,
        p_cursor_cabecera      OUT SYS_REFCURSOR,
        p_cursor_articulos     OUT SYS_REFCURSOR,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    ) AS
        -- Variables
        v_etiqueta_tipo         VARCHAR2(50);
        v_contador_registro     NUMBER;
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulos    VARCHAR2(50);
        v_id_eliminado          NUMBER;
        
    BEGIN
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        p_tipo_acuerdo   := NULL;
        
        -- Validar que el acuerdo exista
        SELECT COUNT(*) INTO v_contador_registro
        FROM apl_tb_acuerdo
        WHERE idacuerdo = p_idacuerdo;
        
        IF v_contador_registro = 0 THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'No se encontró el acuerdo con ID: ' || p_idacuerdo;
            
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- Obtener etiquetas de catálogo
        SELECT idetiqueta INTO v_etiqueta_general FROM apl_tb_catalogo WHERE idetiqueta = 'CLAGENERAL';
        
        SELECT idetiqueta INTO v_etiqueta_articulos FROM apl_tb_catalogo WHERE idetiqueta = 'CLAARTICULO';
        
        SELECT idcatalogo INTO v_id_eliminado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
        
        -- Obtener tipo de acuerdo
        SELECT ct.idetiqueta INTO v_etiqueta_tipo
        FROM apl_tb_acuerdo a
        INNER JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
        WHERE a.idacuerdo = p_idacuerdo;
        
        p_tipo_acuerdo := v_etiqueta_tipo;
        
        -- =====================================================
        -- CASO 1: ACUERDO GENERAL
        -- =====================================================
        IF v_etiqueta_tipo = v_etiqueta_general THEN
            
            -- Cursor cabecera GENERAL
            OPEN p_cursor_cabecera FOR
                SELECT 
                    a.idacuerdo,
                    a.idtipoacuerdo,
                    ct.nombre                                        AS clase_acuerdo,
                    ct.idetiqueta                                    AS clase_acuerdo_etiqueta,
                    af.idfondo,
                    tf.nombre || ' - ' || arp.nombre                 AS fondo_proveedor,
                    a.idmotivoacuerdo,
                    cm.nombre                                        AS motivo,
                    a.descripcion,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    NVL(af.valoraporte, 0)                           AS valor_total,
                    NVL(af.valordisponible, 0)                       AS valor_disponible,
                    NVL(af.valorcomprometido, 0)                     AS valor_comprometido,
                    NVL(af.valorliquidado, 0)                        AS valor_liquidado,
                    a.idestadoregistro,
                    ce.nombre                                        AS estado,
                    ce.idetiqueta                                    AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo cm ON a.idmotivoacuerdo = cm.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    a.idacuerdo = p_idacuerdo;
            
            -- Cursor artículos vacío (no aplica para GENERAL)
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
        
        -- =====================================================
        -- CASO 2: ACUERDO CON ARTÍCULOS
        -- =====================================================
        ELSIF v_etiqueta_tipo = v_etiqueta_articulos THEN
            
            -- Cursor cabecera ARTÍCULO
            OPEN p_cursor_cabecera FOR
                SELECT 
                    a.idacuerdo,
                    a.idtipoacuerdo,
                    ct.nombre                                        AS clase_acuerdo,
                    ct.idetiqueta                                    AS clase_acuerdo_etiqueta,
                    a.idmotivoacuerdo,
                    cm.nombre                                        AS motivo,
                    a.descripcion,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    af.idfondo,
                    arp.nombre                                       AS proveedor_nombre,
                    NVL(af.valoraporte, 0)                           AS valor_total,
                    NVL(af.valordisponible, 0)                       AS valor_disponible,
                    NVL(af.valorcomprometido, 0)                     AS valor_comprometido,
                    NVL(af.valorliquidado, 0)                        AS valor_liquidado,
                    NVL(art.cantidad_articulos, 0)                   AS cantidad_articulos,
                    a.idestadoregistro,
                    ce.nombre                                        AS estado,
                    ce.idetiqueta                                    AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo cm ON a.idmotivoacuerdo = cm.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    LEFT JOIN (
                        SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo aa
                        WHERE aa.idestadoregistro != (
                            SELECT idcatalogo 
                            FROM apl_tb_catalogo 
                            WHERE idetiqueta = 'ESTADOELIMINADO'
                        )
                        GROUP BY aa.idacuerdo
                    ) art ON art.idacuerdo = a.idacuerdo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    a.idacuerdo = p_idacuerdo;
            
            -- Cursor artículos con detalle
            OPEN p_cursor_articulos FOR
                SELECT 
                    aa.idacuerdoarticulo,
                    aa.idacuerdo,
                    aa.codigoarticulo                                AS articulo,
                    NVL(aa.costoactual, 0)                           AS costo,
                    NVL(aa.unidadeslimite, 0)                        AS unidades_limite,
                    NVL(aa.preciocontado, 0)                         AS precio_contado,
                    NVL(aa.preciotarjetacredito, 0)                  AS precio_tc,
                    NVL(aa.preciocredito, 0)                         AS precio_credito,
                    NVL(aa.valoraporte, 0)                           AS aporte_unidad_proveedor,
                    NVL(aa.valorcomprometido, 0)                     AS comprometido_proveedor,
                    NVL(aa.margencontado, 0)                         AS margen_contado,
                    NVL(aa.margentarjetacredito, 0)                  AS margen_tc,
                    aa.idestadoregistro
                FROM 
                    apl_tb_acuerdoarticulo aa
                WHERE 
                    aa.idacuerdo = p_idacuerdo AND aa.idestadoregistro != v_id_eliminado
                ORDER BY 
                    aa.idacuerdoarticulo;
        
        -- =====================================================
        -- CASO 3: TIPO NO RECONOCIDO
        -- =====================================================
        ELSE
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Tipo de acuerdo no reconocido: ' || v_etiqueta_tipo;
            
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontró información para el acuerdo ID: ' || p_idacuerdo;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            
    END sp_consulta_bandeja_inactivacion_acuerdo_por_id;


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
    ) AS
        -- Variables catálogo
        v_count_aprobadores       NUMBER;
        v_estado_actual           NUMBER;
        v_row_exists              NUMBER;
        
        -- Variables
        v_entidad_acuerdo         NUMBER;
        v_tipo_proceso_inactivar  NUMBER;
        v_tipo_proceso_aprobador  NUMBER;
        v_estado_activo           NUMBER;
        v_estado_inactivo         NUMBER;
        v_estado_vigente          NUMBER;
        v_estado_aprobado         NUMBER;
        v_estado_nuevo            NUMBER;
        
        -- Variable log
        v_datos_json              VARCHAR2(4000);
        v_id_control_interfaz     NUMBER;
        v_idevento                NUMBER;
        
        -- Variable para el lote
        v_numero_lote_aprobacion  NUMBER;
        v_row_exists_lote         NUMBER;
        
        -- Cursor para recorrer fondos del acuerdo
        CURSOR c_fondos_acuerdo IS
            SELECT 
                idacuerdofondo,
                idfondo,
                NVL(valordisponible, 0) AS valordisponible
            FROM apl_tb_acuerdofondo
            WHERE idacuerdo = p_idacuerdo;
        
    BEGIN
    
        -- =========================================================
        -- VARIABLES PARA EL LOG
        -- =========================================================
        SELECT idcatalogo INTO v_id_control_interfaz 
        FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
        
        SELECT idcatalogo INTO v_idevento 
        FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;
    
        -- =========================================================
        -- CATÁLOGOS
        -- =========================================================
        SELECT idcatalogo INTO v_entidad_acuerdo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ENTACUERDO';       
            
        SELECT idcatalogo INTO v_tipo_proceso_inactivar 
        FROM apl_tb_catalogo WHERE idetiqueta = 'TPINACTIVACION';
        
        SELECT idcatalogo INTO v_tipo_proceso_aprobador 
        FROM apl_tb_catalogo WHERE idetiqueta = 'TPCREACION';
            
        SELECT idcatalogo INTO v_estado_activo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOACTIVO';   
            
        SELECT idcatalogo INTO v_estado_inactivo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOINACTIVO';
        
        SELECT idcatalogo INTO v_estado_vigente 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOVIGENTE'; 
        
        SELECT idcatalogo INTO v_estado_aprobado 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOAPROBADO'; 
        
        SELECT idcatalogo INTO v_estado_nuevo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
        
        -- =========================================================
        -- VALIDAR QUE EL ACUERDO EXISTA
        -- =========================================================
        SELECT
            CASE
                WHEN EXISTS (SELECT 1 FROM apl_tb_acuerdo WHERE idacuerdo = p_idacuerdo) THEN 1
                ELSE 0
            END
        INTO v_row_exists
        FROM dual;
        
        IF v_row_exists = 0 THEN
            p_codigo_salida := -1;
            p_mensaje := 'El acuerdo con ID ' || p_idacuerdo || ' no existe';
            RETURN;
        END IF;
        
        -- =========================================================
        -- OBTENER ESTADO ACTUAL DEL ACUERDO
        -- =========================================================
        SELECT idestadoregistro INTO v_estado_actual 
        FROM apl_tb_acuerdo 
        WHERE idacuerdo = p_idacuerdo; 
        
        -- Validar que el acuerdo no esté ya inactivo
        IF v_estado_actual = v_estado_inactivo THEN
            p_codigo_salida := -2;
            p_mensaje := 'El acuerdo ya se encuentra inactivo';
            RETURN;
        END IF;
        
        -- Validar que el acuerdo solo esté 'APROBADO' O 'VIGENTE'
        IF v_estado_actual NOT IN (v_estado_vigente, v_estado_aprobado) THEN
            p_codigo_salida := -3;
            p_mensaje := 'El acuerdo debe estar vigente o aprobado';
            RETURN;
        END IF;
        
        -- =========================================================
        -- ¿HAY APROBADORES CONFIGURADOS?
        -- ENTACUERDO + TPINACTIVACION + ACTIVO
        -- =========================================================
        SELECT COUNT(*) INTO v_count_aprobadores
        FROM apl_tb_aprobador
        WHERE entidad = v_entidad_acuerdo
          AND idtipoproceso = v_tipo_proceso_inactivar
          AND idestadoregistro = v_estado_activo;
        
        -- =========================================================
        -- CASO A: NO HAY APROBADORES - Inactivar directamente
        -- =========================================================
        IF v_count_aprobadores = 0 THEN
            
            -- Recorrer cada fondo del acuerdo y actualizar saldos
            FOR r_fondo IN c_fondos_acuerdo LOOP
                
                -- Actualizar saldos en Apl_Tb_Fondo
                UPDATE apl_tb_fondo
                SET valorcomprometido = NVL(valorcomprometido, 0) - r_fondo.valordisponible,
                    valordisponible   = NVL(valordisponible, 0) + r_fondo.valordisponible,
                    fechamodifica     = SYSTIMESTAMP,
                    idusuariomodifica = p_nombreusuarioingreso
                WHERE idfondo = r_fondo.idfondo;
                
                -- Actualizar AcuerdoFondo: valor disponible = 0 e inactivar
                UPDATE apl_tb_acuerdofondo
                SET valordisponible  = 0,
                    idestadoregistro = v_estado_inactivo
                WHERE idacuerdofondo = r_fondo.idacuerdofondo;
                
            END LOOP;
            
            -- Inactivar el acuerdo
            UPDATE apl_tb_acuerdo
            SET idestadoregistro       = v_estado_inactivo,
                fechamodifica          = SYSTIMESTAMP,
                idusuariomodifica      = p_nombreusuarioingreso,
                marcaprocesoaprobacion = ' '
            WHERE idacuerdo = p_idacuerdo;
            
            p_codigo_salida := 0;
            p_mensaje := 'Acuerdo inactivado directamente (sin aprobadores).';
        
        -- =========================================================
        -- CASO B: HAY APROBADORES - Generar registros de aprobación
        -- =========================================================
        ELSE
            DBMS_OUTPUT.PUT_LINE('DEBUG - Entrando a CASO B: Con ' || v_count_aprobadores || ' aprobadores');
            
            -- Validar que el lote exista
            SELECT
                CASE
                    WHEN EXISTS (SELECT 1 FROM apl_tb_lote WHERE entidad = v_entidad_acuerdo) THEN 1
                    ELSE 0
                END
            INTO v_row_exists_lote
            FROM dual;
            
            IF v_row_exists_lote = 0 THEN
                v_numero_lote_aprobacion := 1;
                INSERT INTO apl_tb_lote (
                    entidad,
                    secuencial
                ) VALUES (
                    v_entidad_acuerdo,
                    v_numero_lote_aprobacion
                );
            ELSE 
                SELECT secuencial INTO v_numero_lote_aprobacion 
                FROM apl_tb_lote 
                WHERE entidad = v_entidad_acuerdo;
                
                v_numero_lote_aprobacion := v_numero_lote_aprobacion + 1;
                
                UPDATE apl_tb_lote  
                SET secuencial = v_numero_lote_aprobacion
                WHERE entidad = v_entidad_acuerdo;
            END IF;
            
            -- Insertar solicitudes de aprobación
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
                v_entidad_acuerdo            AS entidad,         
                p_idacuerdo                  AS identidad,       
                v_tipo_proceso_inactivar     AS idtipoproceso,   
                p_nombreusuarioingreso       AS idusersolicitud,
                p_nombreusuarioingreso       AS nombreusersolicitud,
                SYSTIMESTAMP                 AS fechasolicitud,
                a.iduseraprobador            AS iduseraprobador,
                NULL                         AS fechaaprobacion,
                NULL                         AS comentario,
                a.nivelaprobacion            AS nivelaprobacion,
                v_estado_nuevo               AS idestadoregistro,
                v_numero_lote_aprobacion
            FROM
                apl_tb_aprobador a
            WHERE
                a.entidad = v_entidad_acuerdo
                AND a.idtipoproceso = v_tipo_proceso_inactivar
                AND a.idestadoregistro = v_estado_activo;
            
            -- Actualizar número de lote en el acuerdo
            UPDATE apl_tb_acuerdo  
            SET numeroloteaprobacion = v_numero_lote_aprobacion
            WHERE idacuerdo = p_idacuerdo;
            
            p_codigo_salida := 0;
            p_mensaje := 'Solicitud de inactivación generada. Pendiente de aprobación (' || v_count_aprobadores || ' aprobador(es))';
            
        END IF;
        
        -- =========================================================
        -- REGISTRAR LOG
        -- =========================================================
        IF v_count_aprobadores = 0 THEN
            v_datos_json := JSON_OBJECT(
                'idacuerdo'            VALUE p_idacuerdo,
                'valorcomprometido'    VALUE 0,
                'valorliquidado'       VALUE 0,
                'idusuarioingreso'     VALUE p_nombreusuarioingreso,
                'fechaingreso'         VALUE TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'),
                'idestadoregistro'     VALUE v_estado_inactivo,
                'numeroloteaprobacion' VALUE 0,
                'comentario'           VALUE 'Inactivacion Directa sin aprobadores'
            );
        ELSE
            v_datos_json := JSON_OBJECT(
                'idacuerdo'            VALUE p_idacuerdo,
                'valorcomprometido'    VALUE 0,
                'valorliquidado'       VALUE 0,
                'idusuarioingreso'     VALUE p_nombreusuarioingreso,
                'fechaingreso'         VALUE TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS'),
                'idestadoregistro'     VALUE v_tipo_proceso_inactivar,
                'numeroloteaprobacion' VALUE v_numero_lote_aprobacion,
                'comentario'           VALUE 'Solicitud de inactivacion que requiere aprobacion'
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
            v_entidad_acuerdo,
            p_idacuerdo,
            v_tipo_proceso_inactivar,
            v_datos_json
        );
            
        COMMIT;
    
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_codigo_salida := -99;
            p_mensaje := 'Error al inactivar acuerdo: ' || SQLERRM;
            
    END sp_proceso_inactivacion_acuerdo;


    /*
    =========================================================
    Descripción: Bandeja Consulta /  Acuerdo 
    =========================================================
    */
    PROCEDURE sp_bandeja_consulta_acuerdo (
        p_cursor            OUT t_cursor,
        p_codigo_salida     OUT NUMBER,
        p_mensaje_salida    OUT VARCHAR2
    ) AS
    
        v_contador_registro NUMBER;
        v_id_eliminado      NUMBER;
        
    BEGIN
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        
        --Catalogo
        SELECT idcatalogo INTO v_id_eliminado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
        
        -- Validar que existan registros
        SELECT COUNT(*) INTO v_contador_registro
        FROM apl_tb_acuerdo a
        INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo;
        
        IF v_contador_registro = 0 THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'No se encontraron registros en la bandeja de acuerdos.';
        END IF;
        
        -- Abrir cursor con la consulta
        OPEN p_cursor FOR
            SELECT q.* FROM (
                SELECT 
                    a.idacuerdo,
                    a.descripcion,
                    af.idfondo,
                    tf.nombre                                                       AS nombre_tipo_fondo,
                    arp.nombre                                                      AS nombre_proveedor,
                    ct.nombre                                                       AS clase_acuerdo,
                    NVL(art.cantidad_articulos, 0)                                  AS cantidad_articulos,
                    NVL(af.valoraporte, 0)                                          AS valor_acuerdo,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')                    AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')                       AS fecha_fin,
                    NVL(af.valordisponible, 0)                                      AS valor_disponible,
                    NVL(af.valorcomprometido, 0)                                    AS valor_comprometido,
                    NVL(af.valorliquidado, 0)                                       AS valor_liquidado,
                    ce.nombre                                                       AS estado,
                    ce.idetiqueta                                                   AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    LEFT JOIN (
                        SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo aa
                        WHERE aa.idestadoregistro != (
                            SELECT idcatalogo 
                            FROM apl_tb_catalogo 
                            WHERE idetiqueta = 'ESTADOELIMINADO'
                        )
                        GROUP BY aa.idacuerdo
                    ) art ON art.idacuerdo = a.idacuerdo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
            ) q
            ORDER BY q.idacuerdo;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontraron los catálogos necesarios para la consulta.';
            OPEN p_cursor FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            
    END sp_bandeja_consulta_acuerdo;
    
    
    PROCEDURE sp_bandeja_consulta_acuerdo_por_id (
        p_idacuerdo            IN  NUMBER,
        p_cursor_cabecera      OUT t_cursor,
        p_cursor_articulos     OUT t_cursor,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    ) AS
        -- Variables
        v_etiqueta_tipo         VARCHAR2(50);
        v_contador_registro     NUMBER;
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulos    VARCHAR2(50);
        v_etiqueta_eliminado    NUMBER;
        
    BEGIN
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        p_tipo_acuerdo   := NULL;
        
        -- Validar que el acuerdo exista
        SELECT COUNT(*) INTO v_contador_registro
        FROM apl_tb_acuerdo
        WHERE idacuerdo = p_idacuerdo;
        
        IF v_contador_registro = 0 THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'No se encontró el acuerdo con ID: ' || p_idacuerdo;
            
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- Obtener etiquetas de catálogo
        SELECT idetiqueta INTO v_etiqueta_general 
        FROM apl_tb_catalogo WHERE idetiqueta = 'CLAGENERAL';
        
        SELECT idetiqueta INTO v_etiqueta_articulos 
        FROM apl_tb_catalogo WHERE idetiqueta = 'CLAARTICULO';
        
        SELECT idcatalogo INTO v_etiqueta_eliminado 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
        
        -- Obtener tipo de acuerdo
        SELECT ct.idetiqueta INTO v_etiqueta_tipo
        FROM apl_tb_acuerdo a
        INNER JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
        WHERE a.idacuerdo = p_idacuerdo;
        
        p_tipo_acuerdo := v_etiqueta_tipo;
        
        -- =====================================================
        -- CASO 1: ACUERDO GENERAL
        -- =====================================================
        IF v_etiqueta_tipo = v_etiqueta_general THEN
            
            -- Cursor cabecera GENERAL
            OPEN p_cursor_cabecera FOR
                SELECT 
                    a.idacuerdo,
                    a.idtipoacuerdo,
                    ct.nombre                                        AS clase_acuerdo,
                    ct.idetiqueta                                    AS clase_acuerdo_etiqueta,
                    a.idmotivoacuerdo,
                    cm.nombre                                        AS motivo,
                    a.descripcion,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    af.idacuerdofondo,
                    af.idfondo,
                    tf.nombre || ' - ' || arp.nombre                 AS fondo_proveedor,
                    NVL(af.valoraporte, 0)                           AS valor_total,
                    NVL(af.valordisponible, 0)                       AS valor_disponible,
                    NVL(af.valorcomprometido, 0)                     AS valor_comprometido,
                    NVL(af.valorliquidado, 0)                        AS valor_liquidado,
                    a.idestadoregistro,
                    ce.nombre                                        AS estado,
                    ce.idetiqueta                                    AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo cm ON a.idmotivoacuerdo = cm.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    a.idacuerdo = p_idacuerdo;
            
            -- Cursor artículos vacío (no aplica para GENERAL)
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
        
        -- =====================================================
        -- CASO 2: ACUERDO CON ARTÍCULOS
        -- =====================================================
        ELSIF v_etiqueta_tipo = v_etiqueta_articulos THEN
              
            -- Cursor cabecera ARTÍCULO
            OPEN p_cursor_cabecera FOR
                SELECT 
                    a.idacuerdo,
                    a.idtipoacuerdo,
                    ct.nombre                                        AS clase_acuerdo,
                    ct.idetiqueta                                    AS clase_acuerdo_etiqueta,
                    NVL(art.cantidad_articulos, 0)                   AS cantidad_articulos,
                    a.idmotivoacuerdo,
                    cm.nombre                                        AS motivo,
                    a.descripcion,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    af.idacuerdofondo,
                    af.idfondo,
                    tf.nombre || ' - ' || arp.nombre                 AS fondo_proveedor,
                    NVL(af.valoraporte, 0)                           AS valor_total,
                    NVL(af.valordisponible, 0)                       AS valor_disponible,
                    NVL(af.valorcomprometido, 0)                     AS valor_comprometido,
                    NVL(af.valorliquidado, 0)                        AS valor_liquidado,
                    a.idestadoregistro,
                    ce.nombre                                        AS estado,
                    ce.idetiqueta                                    AS estado_etiqueta
                FROM 
                    apl_tb_acuerdo a
                    INNER JOIN apl_tb_acuerdofondo af ON a.idacuerdo = af.idacuerdo
                    LEFT JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
                    LEFT JOIN apl_tb_catalogo cm ON a.idmotivoacuerdo = cm.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON a.idestadoregistro = ce.idcatalogo
                    LEFT JOIN (
                            SELECT aa.idacuerdo, COUNT(*) AS cantidad_articulos 
                            FROM apl_tb_acuerdoarticulo aa
                            WHERE aa.idestadoregistro != (
                                SELECT idcatalogo 
                                FROM apl_tb_catalogo 
                                WHERE idetiqueta = 'ESTADOELIMINADO'
                            )
                            GROUP BY aa.idacuerdo
                    ) art ON art.idacuerdo = a.idacuerdo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    a.idacuerdo = p_idacuerdo;
            
            -- Cursor artículos con detalle
            OPEN p_cursor_articulos FOR
                SELECT 
                    aa.idacuerdoarticulo,
                    aa.idacuerdo,
                    aa.codigoarticulo                                AS articulo,
                    NVL(aa.costoactual, 0)                           AS costo,
                    NVL(aa.unidadeslimite, 0)                        AS unidades_limite,
                    NVL(aa.preciocontado, 0)                         AS precio_contado,
                    NVL(aa.preciotarjetacredito, 0)                  AS precio_tc,
                    NVL(aa.preciocredito, 0)                         AS precio_credito,
                    NVL(aa.valoraporte, 0)                           AS aporte_unidad_proveedor,
                    NVL(aa.valorcomprometido, 0)                     AS comprometido_proveedor,
                    NVL(aa.margencontado, 0)                         AS margen_contado,
                    NVL(aa.margentarjetacredito, 0)                  AS margen_tc,
                    aa.idestadoregistro
                FROM 
                    apl_tb_acuerdoarticulo aa
                WHERE 
                    aa.idacuerdo = p_idacuerdo AND aa.idestadoregistro != v_etiqueta_eliminado
                ORDER BY 
                    aa.idacuerdoarticulo;
        
        -- =====================================================
        -- CASO 3: TIPO NO RECONOCIDO
        -- =====================================================
        ELSE
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Tipo de acuerdo no reconocido: ' || v_etiqueta_tipo;
            
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
        END IF;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontró información para el acuerdo ID: ' || p_idacuerdo;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            
    END sp_bandeja_consulta_acuerdo_por_id;
    

    
END APL_PKG_ACUERDOS;