create or replace PACKAGE APL_PKG_ACUERDOS AS  
    -- Declaración de tipos públicos
    TYPE t_cursor IS REF CURSOR;


    -- Declaración de procedimientos públicos
    PROCEDURE listar_consulta_fondo(
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

END APL_PKG_ACUERDOS;


------------------------------------------body----
create or replace PACKAGE BODY APL_PKG_ACUERDOS AS
    /*
    =========================================================
    Descripción: Lista los fondos con estado VIGENTE y valor disponible mayor a 0
    =========================================================
    */
    PROCEDURE listar_consulta_fondo(
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
                
    END listar_consulta_fondo;
    
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
        v_idestadoregistro      NUMBER;
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
            NVL(JSON_VALUE(p_json_cabecera, '$.idEstadoRegistro' RETURNING NUMBER), 1),
            NVL(JSON_VALUE(p_json_cabecera, '$.marcaProcesoAprobacion'), ' ')
        INTO 
            v_idtipoacuerdo,
            v_idmotivoacuerdo,
            v_descripcion,
            v_fechainiciovigencia,
            v_fechafinvigencia,
            v_idusuarioingreso,
            v_idestadoregistro,
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
                v_idestadoregistro,
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
                v_idestadoregistro,
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
    

    
END APL_PKG_ACUERDOS;