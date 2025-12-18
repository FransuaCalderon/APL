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
        -- Datos del Acuerdo
        p_idacuerdo             IN  NUMBER,
        p_idmotivoacuerdo       IN  NUMBER,
        p_descripcion           IN  VARCHAR2,
        p_fechainiciovigencia   IN  TIMESTAMP,
        p_fechafinvigencia      IN  TIMESTAMP,
        p_idusuariomodifica     IN  VARCHAR2,
        p_nombreusuariomodifica IN  VARCHAR2,
        
        -- Datos del Fondo
        p_idfondo               IN  NUMBER,
        p_valoraporte           IN  NUMBER,
        
        -- Arreglo de Artículos (JSON) - Solo para ACARTICULO
        p_articulos_json        IN  CLOB DEFAULT NULL,
        
        -- Parámetros para el LOG
        p_idopcion              IN  NUMBER,
        p_idcontrolinterfaz     IN  VARCHAR2,
        p_idevento_etiqueta     IN  VARCHAR2,
        
        -- Salida
        p_codigo_salida         OUT NUMBER,
        p_mensaje_salida        OUT VARCHAR2
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
        p_cursor_promociones   OUT SYS_REFCURSOR,
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
        p_cursor_promociones    OUT SYS_REFCURSOR,
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
        p_cursor_promociones   OUT t_cursor,
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
    
    BEGIN
        -- =========================================================================
        -- PASO 1: Obtener IDs de catálogos necesarios
        -- =========================================================================
        
        SELECT idcatalogo 
        INTO v_estado_nuevo 
        FROM apl_tb_catalogo 
        WHERE idetiqueta = 'ESTADONUEVO';
              
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
                                SELECT idacuerdo, COUNT(*) AS cantidad_articulos 
                                FROM apl_tb_acuerdoarticulo 
                                GROUP BY idacuerdo
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
                    -- Cantidad total de artículos
                    (SELECT COUNT(*) 
                     FROM apl_tb_acuerdoarticulo 
                     WHERE idacuerdo = ac.idacuerdo)                AS cantidad_articulos,
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
        
    BEGIN
        -- Inicializar salida exitosa
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        
        -- Obtener catálogos de estados
        SELECT idcatalogo INTO v_estado_negado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONEGADO';
        
        SELECT idcatalogo INTO v_estado_nuevo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
        
        SELECT idcatalogo INTO v_estado_modificado FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOMODIFICADO';
        
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
                    LEFT JOIN (SELECT idacuerdo, COUNT(*) AS cantidad_articulos FROM apl_tb_acuerdoarticulo GROUP BY idacuerdo) art ON art.idacuerdo = a.idacuerdo
                    INNER JOIN apl_tb_fondo f ON f.idfondo = af.idfondo
                    INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
                    LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
                WHERE 
                    ce.idetiqueta IN ('ESTADONUEVO', 'ESTADOMODIFICADO', 'ESTADONEGADO')
                    AND NVL(a.marcaprocesoaprobacion, ' ') = ' '
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
                    ct.idetiqueta                                    AS clase_acuerdo_etiqueta,
                    a.idmotivoacuerdo,
                    cm.nombre                                        AS motivo,
                    a.descripcion,
                    TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
                    TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
                    af.idacuerdofondo,
                    af.idfondo,
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
                    LEFT JOIN (SELECT idacuerdo, COUNT(*) AS cantidad_articulos FROM apl_tb_acuerdoarticulo GROUP BY idacuerdo) art ON art.idacuerdo = a.idacuerdo
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
                    aa.idacuerdo = p_idacuerdo
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
        -- Datos del Acuerdo
        p_idacuerdo             IN  NUMBER,
        p_idmotivoacuerdo       IN  NUMBER,
        p_descripcion           IN  VARCHAR2,
        p_fechainiciovigencia   IN  TIMESTAMP,
        p_fechafinvigencia      IN  TIMESTAMP,
        p_idusuariomodifica     IN  VARCHAR2,
        p_nombreusuariomodifica IN  VARCHAR2,
        
        -- Datos del Fondo
        p_idfondo               IN  NUMBER,
        p_valoraporte           IN  NUMBER,
        
        -- Arreglo de Artículos (JSON) - Solo para ACARTICULO
        p_articulos_json        IN  CLOB DEFAULT NULL,
        
        -- Parámetros para el LOG
        p_idopcion              IN  NUMBER,
        p_idcontrolinterfaz     IN  VARCHAR2,
        p_idevento_etiqueta     IN  VARCHAR2,
        
        -- Salida
        p_codigo_salida         OUT NUMBER,
        p_mensaje_salida        OUT VARCHAR2
    ) AS
        -- =========================================================================
        -- VARIABLES DE CATÁLOGO
        -- =========================================================================
        v_entidad_acuerdo       NUMBER;
        v_tipo_creacion         NUMBER;
        v_tipo_modificacion     NUMBER;
        v_estado_activo         NUMBER;
        v_estado_nuevo          NUMBER;
        v_estado_modificado     NUMBER;
        v_estado_negado         NUMBER;
        v_estado_aprobado       NUMBER;
        v_estado_eliminado      NUMBER;
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulo     VARCHAR2(50);
        
        -- =========================================================================
        -- VARIABLES DE TRABAJO
        -- =========================================================================
        v_estado_actual         NUMBER;
        v_tipo_acuerdo_actual   NUMBER;
        v_etiqueta_tipo_actual  VARCHAR2(50);
        v_nuevo_estado          NUMBER;
        v_tiene_aprobadores     NUMBER;
        v_numero_lote           NUMBER;
        v_idacuerdofondo        NUMBER;
        v_idfondo_actual        NUMBER;
        v_proveedor_actual      VARCHAR2(100);
        v_proveedor_nuevo       VARCHAR2(100);
        v_valorcomprometido     NUMBER;
        v_valorliquidado        NUMBER;
        
        -- Variables para LOG
        v_datos_json            CLOB;
        v_articulos_json_log    CLOB;
        v_id_control_interfaz   NUMBER;
        v_idevento              NUMBER;
        
        -- =========================================================================
        -- CURSOR PARA PROCESAR ARTÍCULOS DESDE JSON
        -- =========================================================================
        CURSOR c_articulos IS
            SELECT 
                jt.accion,
                jt.idacuerdoarticulo,
                jt.codigoarticulo,
                jt.costoactual,
                jt.unidadeslimite,
                jt.preciocontado,
                jt.preciotarjetacredito,
                jt.preciocredito,
                jt.valoraporte,
                jt.margencontado,
                jt.margentarjetacredito
            FROM JSON_TABLE(
                p_articulos_json,
                '$[*]'
                COLUMNS (
                    accion              VARCHAR2(1)   PATH '$.accion',
                    idacuerdoarticulo   NUMBER        PATH '$.idacuerdoarticulo',
                    codigoarticulo      VARCHAR2(20)  PATH '$.codigoarticulo',
                    costoactual         NUMBER        PATH '$.costoactual',
                    unidadeslimite      NUMBER        PATH '$.unidadeslimite',
                    preciocontado       NUMBER        PATH '$.preciocontado',
                    preciotarjetacredito NUMBER       PATH '$.preciotarjetacredito',
                    preciocredito       NUMBER        PATH '$.preciocredito',
                    valoraporte         NUMBER        PATH '$.valoraporte',
                    margencontado       NUMBER        PATH '$.margencontado',
                    margentarjetacredito NUMBER       PATH '$.margentarjetacredito'
                )
            ) jt;
        
    BEGIN
        -- Inicializar salida
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        
        -- =========================================================================
        -- 1) RESOLVER CATÁLOGOS
        -- =========================================================================
        SELECT idcatalogo INTO v_id_control_interfaz 
        FROM apl_tb_catalogo WHERE idetiqueta = p_idcontrolinterfaz;
        
        SELECT idcatalogo INTO v_idevento 
        FROM apl_tb_catalogo WHERE idetiqueta = p_idevento_etiqueta;
        
        SELECT idcatalogo INTO v_entidad_acuerdo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ENTACUERDO';
        
        SELECT idcatalogo INTO v_tipo_creacion 
        FROM apl_tb_catalogo WHERE idetiqueta = 'TPCREACION';
        
        SELECT idcatalogo INTO v_tipo_modificacion 
        FROM apl_tb_catalogo WHERE idetiqueta = 'TPMODIFICACION';
        
        SELECT idcatalogo INTO v_estado_activo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOACTIVO';
        
        SELECT idcatalogo INTO v_estado_nuevo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
        
        SELECT idcatalogo INTO v_estado_modificado 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOMODIFICADO';
        
        SELECT idcatalogo INTO v_estado_negado 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONEGADO';
        
        SELECT idcatalogo INTO v_estado_aprobado 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOAPROBADO';
        
        SELECT idcatalogo INTO v_estado_eliminado 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOELIMINADO';
        
        SELECT idetiqueta INTO v_etiqueta_general 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ACGENERAL';
        
        SELECT idetiqueta INTO v_etiqueta_articulo 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ACARTICULO';
        
        -- =========================================================================
        -- 2) OBTENER DATOS ACTUALES DEL ACUERDO
        -- =========================================================================
        BEGIN
            SELECT 
                a.idestadoregistro,
                a.idtipoacuerdo,
                ct.idetiqueta
            INTO 
                v_estado_actual,
                v_tipo_acuerdo_actual,
                v_etiqueta_tipo_actual
            FROM apl_tb_acuerdo a
            INNER JOIN apl_tb_catalogo ct ON a.idtipoacuerdo = ct.idcatalogo
            WHERE a.idacuerdo = p_idacuerdo;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                p_codigo_salida  := 1;
                p_mensaje_salida := 'El acuerdo con ID ' || p_idacuerdo || ' no existe.';
                RETURN;
        END;
        
        -- Obtener datos del fondo actual
        BEGIN
            SELECT 
                idacuerdofondo,
                idfondo,
                NVL(valorcomprometido, 0),
                NVL(valorliquidado, 0)
            INTO 
                v_idacuerdofondo,
                v_idfondo_actual,
                v_valorcomprometido,
                v_valorliquidado
            FROM apl_tb_acuerdofondo
            WHERE idacuerdo = p_idacuerdo;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                v_valorcomprometido := 0;
                v_valorliquidado := 0;
        END;
        
        -- =========================================================================
        -- 3) VALIDACIÓN: Si el acuerdo está APROBADO, no se puede modificar
        -- =========================================================================
        IF v_estado_actual = v_estado_aprobado THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'El acuerdo ha sido aprobado y no se puede modificar.';
            RETURN;
        END IF;
        
        -- =========================================================================
        -- 4) VALIDACIÓN PARA ACUERDO CON ARTÍCULOS: Fondo del mismo proveedor
        -- =========================================================================
        IF v_etiqueta_tipo_actual = v_etiqueta_articulo AND p_idfondo != v_idfondo_actual THEN
            BEGIN
                SELECT idproveedor INTO v_proveedor_actual 
                FROM apl_tb_fondo WHERE idfondo = v_idfondo_actual;
                
                SELECT idproveedor INTO v_proveedor_nuevo 
                FROM apl_tb_fondo WHERE idfondo = p_idfondo;
                
                IF v_proveedor_actual != v_proveedor_nuevo THEN
                    p_codigo_salida  := 1;
                    p_mensaje_salida := 'El nuevo fondo debe ser del mismo proveedor para acuerdos con artículos.';
                    RETURN;
                END IF;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN
                    p_codigo_salida  := 1;
                    p_mensaje_salida := 'Fondo no encontrado.';
                    RETURN;
            END;
        END IF;
        
        -- =========================================================================
        -- 5) VALIDACIÓN: Si el acuerdo está NEGADO
        -- =========================================================================
        IF v_estado_actual = v_estado_negado THEN
            
            -- Verificar si hay aprobadores configurados
            SELECT COUNT(*) INTO v_tiene_aprobadores
            FROM apl_tb_aprobador
            WHERE entidad = v_entidad_acuerdo
              AND idtipoproceso = v_tipo_creacion
              AND idestadoregistro = v_estado_activo;
            
            -- Determinar el nuevo estado
            IF v_tiene_aprobadores > 0 THEN
                v_nuevo_estado := v_estado_nuevo;
            ELSE
                v_nuevo_estado := v_estado_aprobado;
            END IF;
            
            -- Actualizar el acuerdo
            UPDATE apl_tb_acuerdo
            SET 
                idmotivoacuerdo     = p_idmotivoacuerdo,
                descripcion         = p_descripcion,
                fechainiciovigencia = p_fechainiciovigencia,
                fechafinvigencia    = p_fechafinvigencia,
                fechamodifica       = SYSTIMESTAMP,
                idusuariomodifica   = p_idusuariomodifica,
                idestadoregistro    = v_nuevo_estado,
                marcaprocesoaprobacion = ' '
            WHERE idacuerdo = p_idacuerdo;
            
            -- Actualizar el fondo del acuerdo
            UPDATE apl_tb_acuerdofondo
            SET 
                idfondo         = p_idfondo,
                valoraporte     = p_valoraporte,
                valordisponible = p_valoraporte - v_valorcomprometido - v_valorliquidado
            WHERE idacuerdo = p_idacuerdo;
            
            -- Procesar artículos si es tipo ACARTICULO
            IF v_etiqueta_tipo_actual = v_etiqueta_articulo AND p_articulos_json IS NOT NULL THEN
                FOR r_art IN c_articulos LOOP
                    IF r_art.accion = 'I' THEN
                        -- INSERTAR nuevo artículo
                        INSERT INTO apl_tb_acuerdoarticulo (
                            idacuerdo,
                            codigoarticulo,
                            costoactual,
                            unidadeslimite,
                            preciocontado,
                            preciotarjetacredito,
                            preciocredito,
                            valoraporte,
                            valorcomprometido,
                            margencontado,
                            margentarjetacredito,
                            idestadoregistro
                        ) VALUES (
                            p_idacuerdo,
                            r_art.codigoarticulo,
                            r_art.costoactual,
                            r_art.unidadeslimite,
                            r_art.preciocontado,
                            r_art.preciotarjetacredito,
                            r_art.preciocredito,
                            r_art.valoraporte,
                            0,
                            r_art.margencontado,
                            r_art.margentarjetacredito,
                            v_estado_activo
                        );
                        
                    ELSIF r_art.accion = 'U' THEN
                        -- ACTUALIZAR artículo existente
                        UPDATE apl_tb_acuerdoarticulo
                        SET 
                            unidadeslimite       = r_art.unidadeslimite,
                            preciocontado        = r_art.preciocontado,
                            preciotarjetacredito = r_art.preciotarjetacredito,
                            preciocredito        = r_art.preciocredito,
                            valoraporte          = r_art.valoraporte,
                            margencontado        = r_art.margencontado,
                            margentarjetacredito = r_art.margentarjetacredito
                        WHERE idacuerdoarticulo = r_art.idacuerdoarticulo;
                        
                    ELSIF r_art.accion = 'D' THEN
                        -- ELIMINAR artículo (eliminación lógica)
                        UPDATE apl_tb_acuerdoarticulo
                        SET idestadoregistro = v_estado_eliminado
                        WHERE idacuerdoarticulo = r_art.idacuerdoarticulo;
                    END IF;
                END LOOP;
            END IF;
            
            -- Generar registros de aprobación si hay aprobadores
            IF v_tiene_aprobadores > 0 THEN
                -- Obtener número de lote
                SELECT secuencial + 1 INTO v_numero_lote
                FROM apl_tb_lote
                WHERE entidad = v_entidad_acuerdo
                FOR UPDATE;
                
                -- Actualizar secuencial en lote
                UPDATE apl_tb_lote
                SET secuencial = v_numero_lote
                WHERE entidad = v_entidad_acuerdo;
                
                -- Actualizar lote en acuerdo
                UPDATE apl_tb_acuerdo
                SET numeroloteaprobacion = v_numero_lote
                WHERE idacuerdo = p_idacuerdo;
                
                -- Crear registros de aprobación
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
                    v_entidad_acuerdo,
                    p_idacuerdo,
                    v_tipo_creacion,
                    p_idusuariomodifica,
                    p_nombreusuariomodifica,
                    SYSTIMESTAMP,
                    a.iduseraprobador,
                    NULL,
                    NULL,
                    a.nivelaprobacion,
                    v_estado_nuevo,
                    v_numero_lote
                FROM apl_tb_aprobador a
                WHERE a.entidad = v_entidad_acuerdo
                  AND a.idtipoproceso = v_tipo_creacion
                  AND a.idestadoregistro = v_estado_activo;
            END IF;
            
            -- Construir JSON para LOG (artículos)
            IF v_etiqueta_tipo_actual = v_etiqueta_articulo THEN
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'idacuerdoarticulo' VALUE aa.idacuerdoarticulo,
                        'codigoarticulo' VALUE aa.codigoarticulo,
                        'costoactual' VALUE aa.costoactual,
                        'unidadeslimite' VALUE aa.unidadeslimite,
                        'preciocontado' VALUE aa.preciocontado,
                        'preciotarjetacredito' VALUE aa.preciotarjetacredito,
                        'preciocredito' VALUE aa.preciocredito,
                        'valoraporte' VALUE aa.valoraporte,
                        'margencontado' VALUE aa.margencontado,
                        'margentarjetacredito' VALUE aa.margentarjetacredito
                    )
                ) INTO v_articulos_json_log
                FROM apl_tb_acuerdoarticulo aa
                WHERE aa.idacuerdo = p_idacuerdo
                  AND aa.idestadoregistro != v_estado_eliminado;
            END IF;
            
            -- Construir JSON principal para LOG
            v_datos_json := JSON_OBJECT(
                'idacuerdo' VALUE p_idacuerdo,
                'idmotivoacuerdo' VALUE p_idmotivoacuerdo,
                'descripcion' VALUE p_descripcion,
                'fechainiciovigencia' VALUE TO_CHAR(p_fechainiciovigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechafinvigencia' VALUE TO_CHAR(p_fechafinvigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'idfondo' VALUE p_idfondo,
                'valoraporte' VALUE p_valoraporte,
                'idusuariomodifica' VALUE p_idusuariomodifica,
                'fechamodifica' VALUE TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS'),
                'idestadoregistro' VALUE v_nuevo_estado,
                'estado_anterior' VALUE v_estado_actual,
                'tipo_acuerdo' VALUE v_etiqueta_tipo_actual,
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
                v_entidad_acuerdo,
                p_idacuerdo,
                v_tipo_modificacion,
                v_datos_json
            );
            
            p_codigo_salida  := 0;
            p_mensaje_salida := 'Acuerdo actualizado correctamente desde estado NEGADO.';
            COMMIT;
            RETURN;
        END IF;
        
        -- =========================================================================
        -- 6) VALIDACIÓN: Si el acuerdo está NUEVO o MODIFICADO
        -- =========================================================================
        IF v_estado_actual IN (v_estado_nuevo, v_estado_modificado) THEN
            
            -- Re-verificar estado (por si fue aprobado en este instante)
            SELECT idestadoregistro INTO v_estado_actual
            FROM apl_tb_acuerdo
            WHERE idacuerdo = p_idacuerdo
            FOR UPDATE NOWAIT;
            
            IF v_estado_actual = v_estado_aprobado THEN
                p_codigo_salida  := 1;
                p_mensaje_salida := 'Acuerdo fue aprobado en este momento y no se puede Modificar.';
                RETURN;
            END IF;
            
            IF v_estado_actual = v_estado_negado THEN
                p_codigo_salida  := 1;
                p_mensaje_salida := 'El acuerdo fue negado en este momento. Por favor, intente nuevamente.';
                RETURN;
            END IF;
            
            -- Verificar si hay aprobadores configurados
            SELECT COUNT(*) INTO v_tiene_aprobadores
            FROM apl_tb_aprobador
            WHERE entidad = v_entidad_acuerdo
              AND idtipoproceso = v_tipo_modificacion
              AND idestadoregistro = v_estado_activo;
            
            -- Determinar el nuevo estado
            IF v_tiene_aprobadores > 0 THEN
                v_nuevo_estado := v_estado_modificado;
            ELSE
                v_nuevo_estado := v_estado_aprobado;
            END IF;
            
            -- Actualizar el acuerdo
            UPDATE apl_tb_acuerdo
            SET 
                idmotivoacuerdo     = p_idmotivoacuerdo,
                descripcion         = p_descripcion,
                fechainiciovigencia = p_fechainiciovigencia,
                fechafinvigencia    = p_fechafinvigencia,
                fechamodifica       = SYSTIMESTAMP,
                idusuariomodifica   = p_idusuariomodifica,
                idestadoregistro    = v_nuevo_estado
            WHERE idacuerdo = p_idacuerdo;
            
            -- Actualizar el fondo del acuerdo
            UPDATE apl_tb_acuerdofondo
            SET 
                idfondo         = p_idfondo,
                valoraporte     = p_valoraporte,
                valordisponible = p_valoraporte - v_valorcomprometido - v_valorliquidado
            WHERE idacuerdo = p_idacuerdo;
            
            -- Procesar artículos si es tipo ACARTICULO
            IF v_etiqueta_tipo_actual = v_etiqueta_articulo AND p_articulos_json IS NOT NULL THEN
                FOR r_art IN c_articulos LOOP
                    IF r_art.accion = 'I' THEN
                        INSERT INTO apl_tb_acuerdoarticulo (
                            idacuerdo,
                            codigoarticulo,
                            costoactual,
                            unidadeslimite,
                            preciocontado,
                            preciotarjetacredito,
                            preciocredito,
                            valoraporte,
                            valorcomprometido,
                            margencontado,
                            margentarjetacredito,
                            idestadoregistro
                        ) VALUES (
                            p_idacuerdo,
                            r_art.codigoarticulo,
                            r_art.costoactual,
                            r_art.unidadeslimite,
                            r_art.preciocontado,
                            r_art.preciotarjetacredito,
                            r_art.preciocredito,
                            r_art.valoraporte,
                            0,
                            r_art.margencontado,
                            r_art.margentarjetacredito,
                            v_estado_activo
                        );
                        
                    ELSIF r_art.accion = 'U' THEN
                        UPDATE apl_tb_acuerdoarticulo
                        SET 
                            unidadeslimite       = r_art.unidadeslimite,
                            preciocontado        = r_art.preciocontado,
                            preciotarjetacredito = r_art.preciotarjetacredito,
                            preciocredito        = r_art.preciocredito,
                            valoraporte          = r_art.valoraporte,
                            margencontado        = r_art.margencontado,
                            margentarjetacredito = r_art.margentarjetacredito
                        WHERE idacuerdoarticulo = r_art.idacuerdoarticulo;
                        
                    ELSIF r_art.accion = 'D' THEN
                        UPDATE apl_tb_acuerdoarticulo
                        SET idestadoregistro = v_estado_eliminado
                        WHERE idacuerdoarticulo = r_art.idacuerdoarticulo;
                    END IF;
                END LOOP;
            END IF;
            
            -- Construir JSON para LOG (artículos)
            IF v_etiqueta_tipo_actual = v_etiqueta_articulo THEN
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'idacuerdoarticulo' VALUE aa.idacuerdoarticulo,
                        'codigoarticulo' VALUE aa.codigoarticulo,
                        'costoactual' VALUE aa.costoactual,
                        'unidadeslimite' VALUE aa.unidadeslimite,
                        'preciocontado' VALUE aa.preciocontado,
                        'preciotarjetacredito' VALUE aa.preciotarjetacredito,
                        'preciocredito' VALUE aa.preciocredito,
                        'valoraporte' VALUE aa.valoraporte,
                        'margencontado' VALUE aa.margencontado,
                        'margentarjetacredito' VALUE aa.margentarjetacredito
                    )
                ) INTO v_articulos_json_log
                FROM apl_tb_acuerdoarticulo aa
                WHERE aa.idacuerdo = p_idacuerdo
                  AND aa.idestadoregistro != v_estado_eliminado;
            END IF;
            
            -- Construir JSON principal para LOG
            v_datos_json := JSON_OBJECT(
                'idacuerdo' VALUE p_idacuerdo,
                'idmotivoacuerdo' VALUE p_idmotivoacuerdo,
                'descripcion' VALUE p_descripcion,
                'fechainiciovigencia' VALUE TO_CHAR(p_fechainiciovigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'fechafinvigencia' VALUE TO_CHAR(p_fechafinvigencia, 'YYYY-MM-DD HH24:MI:SS'),
                'idfondo' VALUE p_idfondo,
                'valoraporte' VALUE p_valoraporte,
                'idusuariomodifica' VALUE p_idusuariomodifica,
                'fechamodifica' VALUE TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS'),
                'idestadoregistro' VALUE v_nuevo_estado,
                'estado_anterior' VALUE v_estado_actual,
                'tipo_acuerdo' VALUE v_etiqueta_tipo_actual,
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
                v_entidad_acuerdo,
                p_idacuerdo,
                v_tipo_modificacion,
                v_datos_json
            );
            
            -- Gestionar aprobaciones
            IF v_tiene_aprobadores > 0 THEN
                IF v_estado_actual = v_estado_nuevo THEN
                    UPDATE apl_tb_aprobacion
                    SET idestadoregistro = v_estado_modificado,
                        fechasolicitud = SYSTIMESTAMP
                    WHERE entidad = v_entidad_acuerdo
                      AND identidad = p_idacuerdo
                      AND idtipoproceso = v_tipo_creacion
                      AND idestadoregistro = v_estado_nuevo;
                ELSE
                    UPDATE apl_tb_aprobacion
                    SET fechasolicitud = SYSTIMESTAMP
                    WHERE entidad = v_entidad_acuerdo
                      AND identidad = p_idacuerdo
                      AND idestadoregistro = v_estado_modificado;
                END IF;
            END IF;
            
            p_codigo_salida  := 0;
            p_mensaje_salida := 'Acuerdo actualizado correctamente.';
            COMMIT;
            RETURN;
        END IF;
        
        -- Si no cumple ninguna condición
        p_codigo_salida  := 1;
        p_mensaje_salida := 'Estado del acuerdo no válido para modificación.';
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            ROLLBACK;
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Falta configurar etiquetas en APL_TB_CATALOGO.';
            
        WHEN OTHERS THEN
            ROLLBACK;
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error al modificar acuerdo: ' || SQLERRM;
            
    END sp_modificar_acuerdo;

    /*
    =========================================================
    Descripción: Bandeja Consulta / Inactivacion Acuerdo 
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_inactivacion_acuerdo (
        p_cursor OUT SYS_REFCURSOR
    ) AS
        
    BEGIN
        
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
                LEFT JOIN (SELECT idacuerdo, COUNT(*) AS cantidad_articulos FROM apl_tb_acuerdoarticulo GROUP BY idacuerdo) art ON art.idacuerdo = a.idacuerdo
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
        p_cursor_promociones   OUT SYS_REFCURSOR,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    ) AS
        -- Variables
        v_etiqueta_tipo         VARCHAR2(50);
        v_contador_registro     NUMBER;
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulos    VARCHAR2(50);
        
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
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- Obtener etiquetas de catálogo
        SELECT idetiqueta INTO v_etiqueta_general 
        FROM apl_tb_catalogo WHERE idetiqueta = 'CLAGENERAL';
        
        SELECT idetiqueta INTO v_etiqueta_articulos 
        FROM apl_tb_catalogo WHERE idetiqueta = 'CLAARTICULO';
        
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
                        SELECT idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo 
                        GROUP BY idacuerdo
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
                    aa.idacuerdo = p_idacuerdo
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
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- =====================================================
        -- CURSOR PROMOCIONES (APLICA PARA AMBOS CASOS)
        -- =====================================================
        OPEN p_cursor_promociones FOR
            SELECT 
                p.idpromocion,
                p.descripcion,
                p.motivo                                             AS id_motivo,
                cm.nombre                                            AS motivo_nombre,
                p.clasepromocion                                     AS id_clase_promocion,
                cp.nombre                                            AS clase_acuerdo,
                NVL(pa.valorcomprometido, 0)                         AS valor_comprometido,
                TO_CHAR(p.fechahorainicio, 'YYYY-MM-DD')             AS fecha_inicio,
                TO_CHAR(p.fechahorafin, 'YYYY-MM-DD')                AS fecha_fin,
                p.marcaregalo                                        AS marca_regalo,
                p.estadoregistro                                     AS id_estado,
                ce.nombre                                            AS estado,
                ce.idetiqueta                                        AS estado_etiqueta
            FROM 
                apl_tb_promocion p
                INNER JOIN apl_tb_promocionacuerdo pa ON p.idpromocion = pa.idpromocion
                LEFT JOIN apl_tb_catalogo cm ON p.motivo = cm.idcatalogo
                LEFT JOIN apl_tb_catalogo cp ON p.clasepromocion = cp.idcatalogo
                LEFT JOIN apl_tb_catalogo ce ON p.estadoregistro = ce.idcatalogo
            WHERE 
                pa.idacuerdo = p_idacuerdo
            ORDER BY 
                p.idpromocion;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontró información para el acuerdo ID: ' || p_idacuerdo;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            
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
        p_cursor_promociones    OUT SYS_REFCURSOR,
        p_codigo_salida         OUT NUMBER,
        p_mensaje               OUT VARCHAR2
    ) AS
        -- Variables catálogo
        v_count_aprobadores       NUMBER;
        v_count_promociones       NUMBER;
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
        v_estado_modificado       NUMBER;
        
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
        
        SELECT idcatalogo INTO v_estado_modificado 
        FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOMODIFICADO';
        
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
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
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
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- Validar que el acuerdo solo esté 'APROBADO' O 'VIGENTE'
        IF v_estado_actual NOT IN (v_estado_vigente, v_estado_aprobado) THEN
            p_codigo_salida := -2;
            p_mensaje := 'El acuerdo debe estar vigente o aprobado';
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- =========================================================
        -- VERIFICAR PROMOCIONES ACTIVAS
        -- =========================================================
        SELECT COUNT(*) INTO v_count_promociones
        FROM apl_tb_promocion p
        INNER JOIN apl_tb_promocionacuerdo pa ON p.idpromocion = pa.idpromocion
        WHERE pa.idacuerdo = p_idacuerdo
          AND p.estadoregistro IN (v_estado_nuevo, v_estado_modificado, v_estado_aprobado, v_estado_vigente);
        
        IF v_count_promociones > 0 THEN
            p_codigo_salida := -3;
            p_mensaje := 'El acuerdo tiene ' || v_count_promociones || ' promoción(es) activa(s). Debe inactivar las promociones primero.';
            
            OPEN p_cursor_promociones FOR
                SELECT 
                    p.idpromocion,
                    p.descripcion,
                    p.motivo                                   AS id_motivo,
                    cm.nombre                                  AS motivo_nombre,
                    p.clasepromocion                           AS id_clase_promocion,
                    cp.nombre                                  AS clase_promocion,
                    NVL(pa.valorcomprometido, 0)               AS valor_comprometido,
                    TO_CHAR(p.fechahorainicio, 'YYYY-MM-DD')   AS fecha_inicio,
                    TO_CHAR(p.fechahorafin, 'YYYY-MM-DD')      AS fecha_fin,
                    p.marcaregalo                              AS marca_regalo,
                    p.estadoregistro                           AS id_estado,
                    ce.nombre                                  AS estado,
                    ce.idetiqueta                              AS estado_etiqueta
                FROM 
                    apl_tb_promocion p
                    INNER JOIN apl_tb_promocionacuerdo pa ON p.idpromocion = pa.idpromocion
                    LEFT JOIN apl_tb_catalogo cm ON p.motivo = cm.idcatalogo
                    LEFT JOIN apl_tb_catalogo cp ON p.clasepromocion = cp.idcatalogo
                    LEFT JOIN apl_tb_catalogo ce ON p.estadoregistro = ce.idcatalogo
                WHERE 
                    pa.idacuerdo = p_idacuerdo
                    AND p.estadoregistro IN (v_estado_nuevo, v_estado_modificado, v_estado_aprobado, v_estado_vigente)
                ORDER BY 
                    p.idpromocion;
            RETURN;
        END IF;
        
        -- No tiene promociones, cursor vacío
        OPEN p_cursor_promociones FOR 
            SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
        
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
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            
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
        
    BEGIN
        p_codigo_salida  := 0;
        p_mensaje_salida := 'OK';
        
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
                        SELECT idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo 
                        GROUP BY idacuerdo
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
        p_cursor_promociones   OUT t_cursor,
        p_tipo_acuerdo         OUT VARCHAR2,
        p_codigo_salida        OUT NUMBER,
        p_mensaje_salida       OUT VARCHAR2
    ) AS
        -- Variables
        v_etiqueta_tipo         VARCHAR2(50);
        v_contador_registro     NUMBER;
        v_etiqueta_general      VARCHAR2(50);
        v_etiqueta_articulos    VARCHAR2(50);
        
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
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- Obtener etiquetas de catálogo
        SELECT idetiqueta INTO v_etiqueta_general 
        FROM apl_tb_catalogo WHERE idetiqueta = 'CLAGENERAL';
        
        SELECT idetiqueta INTO v_etiqueta_articulos 
        FROM apl_tb_catalogo WHERE idetiqueta = 'CLAARTICULO';
        
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
                        SELECT idacuerdo, COUNT(*) AS cantidad_articulos 
                        FROM apl_tb_acuerdoarticulo 
                        GROUP BY idacuerdo
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
                    --NVL(aa.margencredito, 0)                         AS margen_credito,
                    aa.idestadoregistro
                FROM 
                    apl_tb_acuerdoarticulo aa
                WHERE 
                    aa.idacuerdo = p_idacuerdo
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
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            RETURN;
        END IF;
        
        -- =====================================================
        -- CURSOR PROMOCIONES (APLICA PARA AMBOS CASOS)
        -- =====================================================
        OPEN p_cursor_promociones FOR
            SELECT 
                p.idpromocion,
                p.descripcion,
                p.motivo                                             AS id_motivo,
                cm.nombre                                            AS motivo_nombre,
                p.clasepromocion                                     AS id_clase_promocion,
                cp.nombre                                            AS clase_acuerdo,
                NVL(pa.valorcomprometido, 0)                         AS valor_comprometido,
                TO_CHAR(p.fechahorainicio, 'YYYY-MM-DD')             AS fecha_inicio,
                TO_CHAR(p.fechahorafin, 'YYYY-MM-DD')                AS fecha_fin,
                p.marcaregalo                                        AS marca_regalo,
                p.estadoregistro                                     AS id_estado,
                ce.nombre                                            AS estado,
                ce.idetiqueta                                        AS estado_etiqueta
            FROM 
                apl_tb_promocion p
                INNER JOIN apl_tb_promocionacuerdo pa ON p.idpromocion = pa.idpromocion
                LEFT JOIN apl_tb_catalogo cm ON p.motivo = cm.idcatalogo
                LEFT JOIN apl_tb_catalogo cp ON p.clasepromocion = cp.idcatalogo
                LEFT JOIN apl_tb_catalogo ce ON p.estadoregistro = ce.idcatalogo
            WHERE 
                pa.idacuerdo = p_idacuerdo
            ORDER BY 
                p.idpromocion;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: No se encontró información para el acuerdo ID: ' || p_idacuerdo;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
                
        WHEN OTHERS THEN
            p_codigo_salida  := 1;
            p_mensaje_salida := 'Error: ' || SQLCODE || ' - ' || SQLERRM;
            OPEN p_cursor_cabecera FOR 
                SELECT NULL AS idacuerdo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_articulos FOR 
                SELECT NULL AS idacuerdoarticulo FROM DUAL WHERE 1 = 0;
            OPEN p_cursor_promociones FOR 
                SELECT NULL AS idpromocion FROM DUAL WHERE 1 = 0;
            
    END sp_bandeja_consulta_acuerdo_por_id;
    

    
END APL_PKG_ACUERDOS;