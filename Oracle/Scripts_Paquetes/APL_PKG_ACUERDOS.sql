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
    
    --Procedimiento para mostrar la bandeja de Aprobacion Acuerdos
    PROCEDURE sp_consulta_bandeja_aprobacion_acuerdos (
        p_usuarioaprobador  IN VARCHAR2,                   -- Usuario aprobador (OBLIGATORIO)
        p_cursor            OUT SYS_REFCURSOR,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    );
    
    --Procedimiento para mostrar la bandeja de Aprobacion Acuerdos Por Id
    PROCEDURE sp_consulta_bandeja_aprobacion_por_id (
        p_idacuerdo               IN NUMBER,
        p_cursor                  OUT SYS_REFCURSOR,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    );
    
    --Procedimiento para aprobar Acuerdo
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
    
    BEGIN
        -- =============================================================
        -- PASO 0: Obtener etiquetas válidas del catálogo
        -- =============================================================
        
        v_etiqueta_recibida := UPPER(TRIM(p_tipo_clase_etiqueta));
        
        --catalogos clase acuerdo
        SELECT idetiqueta INTO v_etiqueta_general FROM apl_tb_catalogo WHERE idetiqueta = 'ACGENERAL';    
        SELECT idetiqueta INTO v_etiqueta_articulos FROM apl_tb_catalogo WHERE idetiqueta = 'ACARTICULO';
        
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
                        v_idfondo                AS identidad,       -- el IdFondo recién creado
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
                        v_idfondo                AS identidad,       
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
    Descripción: Bandeja Consulta  Aprobacion Acuerdo
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
        
       SELECT idcatalogo INTO v_estado_nuevo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
              
        
        -- =========================================================================
        -- PASO 2: Abrir cursor con la consulta principal
        -- =========================================================================
        
        OPEN p_cursor FOR
            SELECT
                cp.nombre                                       AS solicitud,
                ac.idacuerdo,
                ac.descripcion,
                f.idfondo                                       AS id_fondo,
                f.idtipofondo                                   AS id_tipo_fondo,
                tf.nombre                                       AS nombre_tipo_fondo,
                 arp.nombre                                     AS nombre_proveedor,
                ac.idtipoacuerdo                                AS id_tipo_clase_acuerdo,
                ct.nombre                                       AS nombre_clase_acuerdo,
                NVL(art.cantidad_articulos, 0)                  AS cantidad_articulos,
                NVL(acf.valoraporte, 0)                         AS valor_acuerdo,
                TO_CHAR(ac.fechainiciovigencia, 'YYYY-MM-DD')   AS fecha_inicio,
                TO_CHAR(ac.fechafinvigencia, 'YYYY-MM-DD')      AS fecha_fin,
                NVL(acf.valordisponible, 0)                     AS valor_disponible,
                NVL(acf.valorcomprometido, 0)                   AS valor_comprometido,
                NVL(acf.valorliquidado, 0)                      AS valor_liquidado,
                acf.idestadoregistro                            AS idestados_fondo,
                ce.nombre                                       AS nombre_estado_fondo,
                ce.idetiqueta                                   AS id_etiqueta_estado_fondo,
                a.nivelaprobacion,
                a.iduseraprobador                               AS aprobador,
                a.idaprobacion,
                en.idetiqueta                                   AS entidad_etiqueta,
                cp.idetiqueta                                   AS tipo_proceso_etiqueta,
                ea.idetiqueta                                   AS estado_aprob_etiqueta
            FROM 
                apl_tb_acuerdo ac
            -- JOIN con acuerdo fondo
            INNER JOIN apl_tb_acuerdofondo acf ON acf.idacuerdo = ac.idacuerdo
            -- JOIN CORREGIDO: aprobacion se relaciona con IDFONDO
            INNER JOIN apl_tb_aprobacion a ON a.identidad = acf.idfondo AND a.idestadoregistro = v_estado_nuevo
            INNER JOIN apl_tb_fondo f ON  f.idfondo = acf.idfondo
            INNER JOIN apl_tb_artefacta_proveedor arp ON arp.identificacion = f.idproveedor
            LEFT JOIN (SELECT idacuerdo, COUNT(*) AS cantidad_articulos FROM apl_tb_acuerdoarticulo GROUP BY idacuerdo) art ON art.idacuerdo = ac.idacuerdo
            -- JOINs con catálogos
            LEFT JOIN apl_tb_catalogo cp ON a.idtipoproceso = cp.idcatalogo
            LEFT JOIN apl_tb_catalogo ct ON ac.idtipoacuerdo = ct.idcatalogo
            LEFT JOIN apl_tb_catalogo ce ON ac.idestadoregistro = ce.idcatalogo
            LEFT JOIN apl_tb_catalogo en ON a.entidad = en.idcatalogo
            LEFT JOIN apl_tb_catalogo ea ON a.idestadoregistro = ea.idcatalogo
            LEFT JOIN apl_tb_catalogo tf ON f.idtipofondo = tf.idcatalogo
            WHERE
                -- Filtros principales
                (ce.idetiqueta IN ( 'ESTADONUEVO', 'ESTADOMODIFICADO')
                               AND en.idetiqueta = 'ENTACUERDO'
                               AND cp.idetiqueta IN ( 'TPCREACION')) OR
                 --modicacion
                ( ce.idetiqueta IN ('ESTADOAPROBADO', 'ESTADOVIGENTE' )
                               AND en.idetiqueta = 'ENTACUERDO'
                               AND cp.idetiqueta IN ('TPINACTIVACION' ))
            ORDER BY 
                ac.idacuerdo;
    
     EXCEPTION
        WHEN OTHERS THEN
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
   
            
    END sp_consulta_bandeja_aprobacion_acuerdos;
    
    
    /*
    =========================================================
    Descripción: Bandeja Consulta  Aprobacion Acuerdo Por Id
    =========================================================
    */
    PROCEDURE sp_consulta_bandeja_aprobacion_por_id (
        p_idacuerdo               IN NUMBER,
        p_cursor                  OUT SYS_REFCURSOR,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    ) AS
        -- Variables para IDs de catálogo
        v_estado_nuevo          NUMBER;
    
    BEGIN
    -- =========================================================================
    -- Validación de parámetro obligatorio
    -- =========================================================================
    IF p_idacuerdo IS NULL THEN
        p_codigo_salida := 0;
        p_mensaje_salida := 'ERROR: El parámetro p_idacuerdo es obligatorio';
        OPEN p_cursor FOR SELECT NULL FROM DUAL WHERE 1 = 0;
        RETURN;
    END IF;

    -- =========================================================================
    -- Obtener ID de catálogo ESTADONUEVO
    -- =========================================================================
    SELECT idcatalogo INTO v_estado_nuevo FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
   
    
    
    -- =========================================================================
    -- Abrir cursor con la consulta principal
    -- =========================================================================
    
    OPEN p_cursor FOR
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
            acf.idestadoregistro                            AS idestados_fondo,
            ce.nombre                                       AS nombre_estado_fondo,
            ce.idetiqueta                                   AS id_etiqueta_estado_fondo,
            a.nivelaprobacion,
            a.iduseraprobador                               AS aprobador,
            a.idaprobacion,
            en.idetiqueta                                   AS entidad_etiqueta,
            cp.idetiqueta                                   AS tipo_proceso_etiqueta,
            ea.idetiqueta                                   AS estado_aprob_etiqueta
        FROM 
            apl_tb_acuerdo ac
        -- JOIN con acuerdo fondo
        INNER JOIN apl_tb_acuerdofondo acf 
            ON acf.idacuerdo = ac.idacuerdo
        -- JOIN con aprobación (por IDFONDO)
        INNER JOIN apl_tb_aprobacion a 
            ON a.identidad = acf.idfondo 
            AND a.idestadoregistro = v_estado_nuevo
        -- JOIN con fondo
        INNER JOIN apl_tb_fondo f 
            ON f.idfondo = acf.idfondo
        -- JOIN con proveedor
        INNER JOIN apl_tb_artefacta_proveedor arp 
            ON arp.identificacion = f.idproveedor
        -- Subquery para contar artículos
        LEFT JOIN (
            SELECT 
                idacuerdo, 
                COUNT(*) AS cantidad_articulos 
            FROM 
                apl_tb_acuerdoarticulo 
            GROUP BY 
                idacuerdo
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
            -- *** FILTRO POR ID DE ACUERDO ***
            ac.idacuerdo = p_idacuerdo
            -- Condiciones de estado y proceso
            AND (
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
        ORDER BY 
            ac.idacuerdo;

    -- Respuesta exitosa
    p_codigo_salida := 1;
    p_mensaje_salida := 'Consulta ejecutada exitosamente';

    EXCEPTION
        WHEN OTHERS THEN
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
            -- Cursor vacío en caso de error
            IF p_cursor%ISOPEN THEN
                CLOSE p_cursor;
            END IF;
            OPEN p_cursor FOR SELECT NULL FROM DUAL WHERE 1 = 0;
            
    END sp_consulta_bandeja_aprobacion_por_id;
    
       
    /*
    =========================================================
    Descripción: Procesa la aprobación/rechazo de un acuerdo según el tipo de proceso (Creación o Inactivación)
    =========================================================
    */
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
        --v_idestadovigente         NUMBER;
        
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

    BEGIN
        -- Inicializar código de salida
        p_codigo_salida := 1;
        
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
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: No existe la aprobación con ID ' || p_idaprobacion;
            RETURN;
        END IF;
        
        -- Validar que existe el acuerdo
        SELECT COUNT(*) 
        INTO v_existe_acuerdo
        FROM apl_tb_acuerdo 
        WHERE idacuerdo = p_identidad;
        
        IF v_existe_acuerdo = 0 THEN
            p_codigo_salida := 0;
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
            
        -- ID del estado VIGENTE (para acuerdos aprobados)
        --SELECT idcatalogo INTO v_idestadovigente FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOVIGENTE';
            
            
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
            p_codigo_salida := 0;
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
                    p_codigo_salida := 0;
                    p_mensaje_salida := 'ERROR: No se pudo actualizar el acuerdo';
                    ROLLBACK;
                    RETURN;
                END IF;
                
                -- Actualizar estado del acuerdo-fondo asociado
                UPDATE apl_tb_acuerdofondo 
                SET 
                    idestadoregistro = v_idestado
                WHERE 
                    idacuerdo = p_identidad;
                
                p_codigo_salida := 1;
                p_mensaje_salida := 'OK: Acuerdo creado y aprobado exitosamente';
                
            -- -----------------------------------------------------------------
            -- Caso 2: INACTIVACIÓN DE ACUERDO
            -- -----------------------------------------------------------------
            ELSIF UPPER(p_idetiquetatipoproceso) = 'TPINACTIVACION' THEN
                
                -- Solo inactivar si el estado es APROBADO
                IF UPPER(p_idetiquetaestado) = 'ESTADOAPROBADO' THEN
                    
                    -- Actualizar estado del acuerdo a INACTIVO
                    UPDATE apl_tb_acuerdo 
                    SET 
                        idusuariomodifica = p_usuarioaprobador,
                        fechamodifica = v_fechasistema,
                        idestadoregistro = v_idestadoinactivo,
                        marcaprocesoaprobacion = ' '
                    WHERE 
                        idacuerdo = p_identidad;
                        
                    IF SQL%ROWCOUNT = 0 THEN
                        p_codigo_salida := 0;
                        p_mensaje_salida := 'ERROR: No se pudo inactivar el acuerdo';
                        ROLLBACK;
                        RETURN;
                    END IF;
                    
                    -- Actualizar acuerdo-fondo: inactivar y poner valores en 0
                    UPDATE apl_tb_acuerdofondo 
                    SET 
                        idestadoregistro = v_idestadoinactivo,
                        valordisponible = 0
                    WHERE 
                        idacuerdo = p_identidad;
                    
                    p_codigo_salida := 1;
                    p_mensaje_salida := 'OK: Acuerdo inactivado exitosamente';
                    
                ELSE
                    -- Rechazo de inactivación
                    p_codigo_salida := 1;
                    p_mensaje_salida := 'OK: Aprobación rechazada, acuerdo no inactivado';
                    
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
                        'tipo_proceso'      VALUE 'TPINACTIVACION',
                        'tipo_registro'     VALUE 'RECHAZO_INACTIVACION',
                        'razon'             VALUE 'Estado de aprobación no es APROBADO',
                        'estado_recibido'   VALUE p_idetiquetaestado,
                        'idacuerdo'         VALUE p_identidad,
                        'idaprobacion'      VALUE p_idaprobacion
                    );
                END IF;
                
            ELSE
                p_codigo_salida := 0;
                p_mensaje_salida := 'ERROR: Tipo de proceso no reconocido: ' || p_idetiquetatipoproceso;
                ROLLBACK;
                RETURN;
            END IF;
            
        ELSE
            -- Aún hay aprobaciones pendientes
            p_codigo_salida := 1;
            p_mensaje_salida := 'OK: Aprobación registrada. Quedan ' || 
                               v_registros_pendientes_aprobacion || ' aprobaciones pendientes';
        END IF;
        
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
            p_codigo_salida := 0;
            p_mensaje_salida := 'Error en proceso de aprobación de acuerdo: ' || SQLERRM;
            
    END sp_proceso_aprobacion_acuerdo;


    
END APL_PKG_ACUERDOS;