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
        p_resultado               OUT VARCHAR2
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
        p_resultado               OUT VARCHAR2
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
        v_marcaproceso          CHAR(1);
        v_numerolote            NUMBER;
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
    
    BEGIN
        -- =============================================================
        -- PASO 0: Obtener etiquetas válidas del catálogo
        -- =============================================================
        
        v_etiqueta_recibida := UPPER(TRIM(p_tipo_clase_etiqueta));
        
        -- Obtener etiqueta GENERAL del catálogo
        SELECT idetiqueta INTO v_etiqueta_general FROM apl_tb_catalogo WHERE idetiqueta = 'ACGENERAL';
        
        -- Obtener etiqueta CON ARTICULOS del catálogo      
        SELECT idetiqueta INTO v_etiqueta_articulos FROM apl_tb_catalogo WHERE idetiqueta = 'ACARTICULO';
        
        
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
            NVL(JSON_VALUE(p_json_cabecera, '$.marcaProcesoAprobacion'), 'N'),
            JSON_VALUE(p_json_cabecera, '$.numeroLoteAprobacion' RETURNING NUMBER)
        INTO 
            v_idtipoacuerdo,
            v_idmotivoacuerdo,
            v_descripcion,
            v_fechainiciovigencia,
            v_fechafinvigencia,
            v_idusuarioingreso,
            v_idestadoregistro,
            v_marcaproceso,
            v_numerolote
        FROM DUAL;
        
        -- =============================================================
        -- PASO 2: Evaluar CLASE DE ACUERDO con IF-ELSIF
        -- =============================================================
        
        -- ---------------------------------------------------------
        -- CASO: GENERAL (2 tablas: acuerdo + fondo)
        -- ---------------------------------------------------------
        IF v_etiqueta_recibida = v_etiqueta_general THEN
            
            -- Validar JSON fondo
            IF p_json_fondo IS NULL OR LENGTH(p_json_fondo) < 3 THEN
                p_resultado := 'ERROR: Para clase "General" debe enviar información del fondo';
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
                v_numerolote
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
            
            p_resultado := 'OK - Acuerdo General #' || v_idacuerdo || 
                           ' creado con Fondo #' || v_idfondo;
    
        -- ---------------------------------------------------------
        -- CASO: CON ARTICULOS (3 tablas: acuerdo + fondo + articulos)
        -- ---------------------------------------------------------
        ELSIF v_etiqueta_recibida = v_etiqueta_articulos THEN
            
            -- Validar JSON fondo
            IF p_json_fondo IS NULL OR LENGTH(p_json_fondo) < 3 THEN
                p_resultado := 'ERROR: Para clase "Con Articulos" debe enviar información del fondo';
                RETURN;
            END IF;
            
            -- Validar JSON artículos
            IF p_json_articulos IS NULL OR LENGTH(p_json_articulos) < 3 THEN
                p_resultado := 'ERROR: Para clase "Con Articulos" debe enviar artículos';
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
                v_numerolote
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
            
            p_resultado := 'OK - Acuerdo #' || v_idacuerdo || 
                           ' creado con Fondo #' || v_idfondo ||
                           ' y ' || v_count_articulos || ' artículos';
        
        ELSE
            p_resultado := 'ERROR: Clase de acuerdo no válida: ' || p_tipo_clase_etiqueta;
            RETURN;
            
        END IF;
        
        COMMIT;
        p_idacuerdo_out := v_idacuerdo;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_idacuerdo_out := NULL;
            p_resultado := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END sp_crear_acuerdo;
    

    
END APL_PKG_ACUERDOS;