create or replace PACKAGE APL_PKG_PROMOCIONES AS

    -- Tipo cursor REF CURSOR para retorno
    TYPE t_cursor IS REF CURSOR;
    
    -- ------------------------------------------------------------------------
    -- SP_CONSULTA_ACUERDO
    -- Descripción: Consulta los acuerdos vigentes con fondos disponibles
    -- ------------------------------------------------------------------------
    PROCEDURE sp_consulta_acuerdo(
        p_etiqueta_tipo_fondo    IN  VARCHAR2,
        p_etiqueta_clase_acuerdo IN  VARCHAR2,
        p_cursor                 OUT t_cursor,
        p_codigo    OUT NUMBER,
        p_mensaje   OUT VARCHAR2
        
    );
    
    
    -- ------------------------------------------------------------------------
    -- SP_CREAR_PROMOCION
    -- Descripción: Crea una promoción de tipo General - Por Articulo - Por Combo
    -- ------------------------------------------------------------------------
    PROCEDURE sp_crear_promocion(
        p_tipo_clase_etiqueta     IN  VARCHAR2,
        p_json_promocion          IN  CLOB,
        p_json_acuerdos           IN  CLOB DEFAULT NULL,
        p_json_segmentos          IN  CLOB DEFAULT NULL,
        p_idpromocion_out         OUT NUMBER,
        -- Parámetros para el log
        p_idopcion                IN  NUMBER,
        p_idcontrolinterfaz       IN  VARCHAR2,
        p_idevento_etiqueta       IN  VARCHAR2,
        p_archivosoporte          IN  VARCHAR2,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    );
    
END APL_PKG_PROMOCIONES;

--------------BODY--------------------
create or replace PACKAGE BODY APL_PKG_PROMOCIONES AS

   PROCEDURE sp_consulta_acuerdo(
        p_etiqueta_tipo_fondo    IN  VARCHAR2,
        p_etiqueta_clase_acuerdo IN  VARCHAR2,
        p_cursor                 OUT t_cursor,
        p_codigo                 OUT NUMBER,
        p_mensaje                OUT VARCHAR2
    ) IS
    BEGIN
        -- Inicializar respuesta exitosa
        p_codigo  := 0;
        p_mensaje := 'OK';
        
        OPEN p_cursor FOR
            SELECT 
                a.idacuerdo,
                a.descripcion,
                f.idtipofondo,
                af.idfondo,
                tf.nombre                                           AS nombre_tipo_fondo,
                tf.idetiqueta                                       AS etiqueta_tipo_fondo,
                arp.nombre                                          AS nombre_proveedor,
                ct.nombre                                           AS clase_acuerdo,
                ct.idetiqueta                                       AS etiqueta_clase_acuerdo,
                a.idtipoacuerdo,
                NVL(art.cantidad_articulos, 0)                      AS cantidad_articulos,
                NVL(af.valoraporte, 0)                              AS valor_acuerdo,
                TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')        AS fecha_inicio,
                TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')           AS fecha_fin,
                NVL(af.valordisponible, 0)                          AS valor_disponible,
                NVL(af.valorcomprometido, 0)                        AS valor_comprometido,
                NVL(af.valorliquidado, 0)                           AS valor_liquidado,
                ce.nombre                                           AS estado,
                ce.idetiqueta                                       AS estado_etiqueta
            FROM 
                apl_tb_acuerdo a
                LEFT JOIN apl_tb_acuerdofondo af 
                    ON a.idacuerdo = af.idacuerdo
                LEFT JOIN apl_tb_fondo f 
                    ON f.idfondo = af.idfondo
                LEFT JOIN apl_tb_artefacta_proveedor arp 
                    ON arp.identificacion = f.idproveedor
                LEFT JOIN apl_tb_catalogo ct 
                    ON a.idtipoacuerdo = ct.idcatalogo
                LEFT JOIN apl_tb_catalogo ce 
                    ON a.idestadoregistro = ce.idcatalogo
                LEFT JOIN apl_tb_catalogo tf 
                    ON f.idtipofondo = tf.idcatalogo
                LEFT JOIN (
                    SELECT 
                        aa.idacuerdo, 
                        COUNT(*) AS cantidad_articulos 
                    FROM apl_tb_acuerdoarticulo aa
                    WHERE aa.idestadoregistro != (
                        SELECT idcatalogo 
                        FROM apl_tb_catalogo 
                        WHERE idetiqueta = 'ESTADOELIMINADO'
                    )
                    GROUP BY aa.idacuerdo
                ) art 
                    ON art.idacuerdo = a.idacuerdo
            WHERE ce.idetiqueta = 'ESTADOVIGENTE'                       -- Acuerdo vigente
              AND NVL(af.valordisponible, 0) > 0                        -- Valor disponible > 0
              AND tf.idetiqueta = p_etiqueta_tipo_fondo                 -- Tipo de fondo
              AND ct.idetiqueta = p_etiqueta_clase_acuerdo              -- Clase de acuerdo
            ORDER BY a.idacuerdo;
    
    EXCEPTION
        WHEN OTHERS THEN
            p_codigo  := SQLCODE;
            p_mensaje := 'Error en SP_CONSULTA_ACUERDO: ' || SQLERRM;
            
    END sp_consulta_acuerdo;
 
   PROCEDURE sp_crear_promocion(
        p_tipo_clase_etiqueta     IN  VARCHAR2,
        p_json_promocion          IN  CLOB,
        p_json_acuerdos           IN  CLOB DEFAULT NULL,
        p_json_segmentos          IN  CLOB DEFAULT NULL,
        p_idpromocion_out         OUT NUMBER,
        -- Parámetros para el log
        p_idopcion                IN  NUMBER,
        p_idcontrolinterfaz       IN  VARCHAR2,
        p_idevento_etiqueta       IN  VARCHAR2,
        p_archivosoporte          IN  VARCHAR2,
        p_codigo_salida           OUT NUMBER,
        p_mensaje_salida          OUT VARCHAR2
    ) IS
        -- =============================================================
        -- Variables para promoción
        -- =============================================================
        v_idpromocion              NUMBER;
    
        v_descripcion              VARCHAR2(100);
        v_motivo                   NUMBER;
        v_clasepromocion           NUMBER;
        v_fechahorainicio          TIMESTAMP;
        v_fechahorafin             TIMESTAMP;
        v_marcaregalo              CHAR(1);
        v_marcaprocesoaprobacion   CHAR(1);
        v_idusuarioingreso         VARCHAR2(50);
        v_nombreusuario            VARCHAR2(100);
    
        -- =============================================================
        -- Variables para catálogo y etiquetas
        -- =============================================================
        v_etiqueta_recibida        VARCHAR2(50);
        v_etiqueta_general         VARCHAR2(50);
        v_etiqueta_articulo        VARCHAR2(50);
        v_etiqueta_combo           VARCHAR2(50);
    
        -- =============================================================
        -- Variables para aprobadores / estados / entidad
        -- =============================================================
        v_tiene_aprobadores        NUMBER;
        v_entidad_promocion        NUMBER;
        v_tipo_creacion            NUMBER;
    
        v_estado_activo            NUMBER;
        v_estado_nuevo             NUMBER;
        v_estado_aprobado          NUMBER;
        v_estado_registro           NUMBER;
    
        -- =============================================================
        -- Variables para lote
        -- =============================================================
        v_numero_lote_aprobacion   NUMBER;
        v_row_exists               NUMBER;
    
        -- =============================================================
        -- Variables para LOG
        -- =============================================================
        v_json_log                 CLOB;
        v_id_control_interfaz      NUMBER;
        v_idevento                 NUMBER;
    
    BEGIN
        p_codigo_salida := 0;
        p_mensaje_salida := NULL;
        p_idpromocion_out := NULL;
    
        -- =============================================================
        -- PASO 0: Validar etiquetas válidas
        -- =============================================================
        v_etiqueta_recibida := UPPER(TRIM(p_tipo_clase_etiqueta));
    
        SELECT idetiqueta INTO v_etiqueta_general  FROM apl_tb_catalogo WHERE idetiqueta = 'PRGENERAL';
        SELECT idetiqueta INTO v_etiqueta_articulo FROM apl_tb_catalogo WHERE idetiqueta = 'PRARTICULO';
        SELECT idetiqueta INTO v_etiqueta_combo    FROM apl_tb_catalogo WHERE idetiqueta = 'PRCOMBO';
    
        -- Catálogos generales
        SELECT idcatalogo INTO v_entidad_promocion FROM apl_tb_catalogo WHERE idetiqueta = 'ENTPROMOCION';
        SELECT idcatalogo INTO v_tipo_creacion     FROM apl_tb_catalogo WHERE idetiqueta = 'TPCREACION';
        SELECT idcatalogo INTO v_estado_activo     FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOACTIVO';
        SELECT idcatalogo INTO v_estado_nuevo      FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADONUEVO';
        SELECT idcatalogo INTO v_estado_aprobado   FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOAPROBADO';
    
        -- LOG (etiquetas => idcatalogo)
        SELECT idcatalogo INTO v_id_control_interfaz
          FROM apl_tb_catalogo
         WHERE idetiqueta = UPPER(TRIM(p_idcontrolinterfaz));
    
        SELECT idcatalogo INTO v_idevento
          FROM apl_tb_catalogo
         WHERE idetiqueta = UPPER(TRIM(p_idevento_etiqueta));
    
        -- =============================================================
        -- PASO 1: Extraer datos de PROMOCIÓN desde JSON
        -- Nota: Ajusta el formato de timestamp si tu front manda otro.
        -- =============================================================
        SELECT
            JSON_VALUE(p_json_promocion, '$.descripcion'),
            JSON_VALUE(p_json_promocion, '$.motivo' RETURNING NUMBER),
            JSON_VALUE(p_json_promocion, '$.clasePromocion' RETURNING NUMBER),
            TO_TIMESTAMP(JSON_VALUE(p_json_promocion, '$.fechaHoraInicio'),
                         'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
            TO_TIMESTAMP(JSON_VALUE(p_json_promocion, '$.fechaHoraFin'),
                         'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
            SUBSTR(NVL(JSON_VALUE(p_json_promocion, '$.marcaRegalo'), 'N'), 1, 1),
            SUBSTR(NVL(JSON_VALUE(p_json_promocion, '$.marcaProcesoAprobacion'), ' '), 1, 1),
            JSON_VALUE(p_json_promocion, '$.idUsuarioIngreso'),
            JSON_VALUE(p_json_promocion, '$.nombreUsuario')
        INTO
            v_descripcion,
            v_motivo,
            v_clasepromocion,
            v_fechahorainicio,
            v_fechahorafin,
            v_marcaregalo,
            v_marcaprocesoaprobacion,
            v_idusuarioingreso,
            v_nombreusuario
        FROM dual;
    
        -- Validaciones mínimas (recomendadas)
        IF v_descripcion IS NULL THEN
            p_mensaje_salida := 'ERROR: descripcion es obligatoria';
            RETURN;
        END IF;
    
        IF v_fechahorainicio IS NULL OR v_fechahorafin IS NULL OR v_fechahorafin <= v_fechahorainicio THEN
            p_mensaje_salida := 'ERROR: rango de fechas inválido';
            RETURN;
        END IF;
    
        -- =============================================================
        -- CASO: GENERAL
        -- =============================================================
        IF v_etiqueta_recibida = v_etiqueta_general THEN
    
          
            
            -- ============================================================
            -- 3) Estado: si hay aprobadores => NUEVO, si no => APROBADO
            -- ============================================================
            
                v_estado_registro := v_estado_nuevo;     -- NUEVO (requiere aprobación)
           
            
            -- ============================================================
            -- 4) Lote: si el campo NUMEROLOTEAPROBACION es NOT NULL,
            --         conviene generarlo SIEMPRE (recomendado)
            -- ============================================================
            
            -- ¿Existe registro de lote para la entidad?
            SELECT CASE
                     WHEN EXISTS (SELECT 1 FROM apl_tb_lote WHERE entidad = v_entidad_promocion) THEN 1
                     ELSE 0
                   END
            INTO v_row_exists
            FROM dual;
            
            IF v_row_exists = 0 THEN
                v_numero_lote_aprobacion := 1;
            
                INSERT INTO apl_tb_lote (entidad, secuencial)
                VALUES (v_entidad_promocion, v_numero_lote_aprobacion);
            
            ELSE
                -- Bloqueo para concurrencia: evita duplicar secuencial
                SELECT secuencial
                INTO v_numero_lote_aprobacion
                FROM apl_tb_lote
                WHERE entidad = v_entidad_promocion
                FOR UPDATE;
            
                v_numero_lote_aprobacion := v_numero_lote_aprobacion + 1;
            
                UPDATE apl_tb_lote
                SET secuencial = v_numero_lote_aprobacion
                WHERE entidad = v_entidad_promocion;
            END IF;
    
            SAVEPOINT sp_crear_promocion_ini;
    
            -- =========================================================
            -- INSERT 1: APL_TB_PROMOCION
            -- IMPORTANTÍSIMO:
            --   NO uses MAX(idpromocion). Usa RETURNING.
            --   Esto exige que IDPROMOCION sea identity o trigger/seq.
            -- =========================================================
            INSERT INTO apl_tb_promocion (
                descripcion,
                motivo,
                clasepromocion,
                fechahorainicio,
                fechahorafin,
                marcaregalo,
                estadoregistro,
                marcaprocesoaprobacion,
                numeroloteaprobacion,
                archivosoporte
            ) VALUES (
                v_descripcion,
                v_motivo,
                v_clasepromocion,
                v_fechahorainicio,
                v_fechahorafin,
                v_marcaregalo,
                v_estado_registro,
                v_marcaprocesoaprobacion,
                v_numero_lote_aprobacion,
                p_archivosoporte
            )
            RETURNING idpromocion INTO v_idpromocion;
    
            -- =========================================================
            -- INSERT 2: APL_TB_PROMOCIONACUERDO
            -- =========================================================
            IF p_json_acuerdos IS NOT NULL AND DBMS_LOB.GETLENGTH(p_json_acuerdos) > 2 THEN
                INSERT INTO apl_tb_promocionacuerdo (
                    idpromocion,
                    idacuerdo,
                    porcentajedescuento,
                    valorcomprometido,
                    valordisponible,
                    valorliquidado,
                    estadoregistro
                )
                SELECT
                    v_idpromocion,
                    jt.id_acuerdo,
                    jt.porcentaje_descuento,
                    jt.valor_comprometido,
                    jt.valor_comprometido,
                    0,
                    v_estado_activo
                FROM JSON_TABLE(
                    p_json_acuerdos,
                    '$[*]'
                    COLUMNS (
                        id_acuerdo            NUMBER PATH '$.idAcuerdo',
                        porcentaje_descuento  NUMBER PATH '$.porcentajeDescuento',
                        valor_comprometido    NUMBER PATH '$.valorComprometido'
                    )
                ) jt;
            END IF;
    
            -- =========================================================
            -- INSERT 3: SEGMENTO + DETALLE (robusto, sin VARCHAR2(32767))
            -- Estructura esperada (recomendada):
            -- [
            --  { "tipoSegmento":"SEGMARCA", "tipoAsignacion":"T", "codigos":[] },
            --  { "tipoSegmento":"SEGCLASE", "tipoAsignacion":"C", "codigos":["C01","C02"] }
            -- ]
            -- =========================================================
            IF p_json_segmentos IS NOT NULL AND DBMS_LOB.GETLENGTH(p_json_segmentos) > 2 THEN
    
                FOR seg IN (
                    SELECT
                        jt.tipo_segmento,
                        jt.tipo_asignacion
                    FROM JSON_TABLE(
                            p_json_segmentos,
                            '$[*]'
                            COLUMNS (
                                tipo_segmento   VARCHAR2(50) PATH '$.tipoSegmento',
                                tipo_asignacion VARCHAR2(1)  PATH '$.tipoAsignacion'
                            )
                         ) jt
                ) LOOP
                    DECLARE
                        v_id_segmento NUMBER;
                    BEGIN
                        INSERT INTO apl_tb_promocionsegmento (
                            idpromocion,
                            idtiposegmento,
                            tipoasignacion,
                            estadoregistro
                        ) VALUES (
                            v_idpromocion,
                            (SELECT idcatalogo FROM apl_tb_catalogo WHERE idetiqueta = UPPER(TRIM(seg.tipo_segmento))),
                            SUBSTR(TRIM(seg.tipo_asignacion),1,1),
                            v_estado_activo
                        )
                        RETURNING idpromocionsegmento INTO v_id_segmento;
    
                        -- Si no es Todos, inserta detalle leyendo el array con NESTED PATH
                        IF SUBSTR(TRIM(seg.tipo_asignacion),1,1) <> 'T' THEN
                            INSERT INTO apl_tb_promocionsegmentodetalle (
                                idpromocionsegmento,
                                codigo,
                                estadoregistro
                            )
                            SELECT
                                v_id_segmento,
                                det.codigo,
                                v_estado_activo
                            FROM JSON_TABLE(
                                    p_json_segmentos,
                                    '$[*]'
                                    COLUMNS (
                                        tipo_segmento   VARCHAR2(50) PATH '$.tipoSegmento',
                                        tipo_asignacion VARCHAR2(1)  PATH '$.tipoAsignacion',
                                        NESTED PATH '$.codigos[*]'
                                        COLUMNS (
                                            codigo VARCHAR2(13) PATH '$'
                                        )
                                    )
                                 ) det
                            WHERE UPPER(TRIM(det.tipo_segmento)) = UPPER(TRIM(seg.tipo_segmento))
                              AND SUBSTR(TRIM(det.tipo_asignacion),1,1) = SUBSTR(TRIM(seg.tipo_asignacion),1,1);
                        END IF;
    
                    END;
                END LOOP;
    
            END IF;
    
            -- =============================================================
            -- INSERT 4: APL_TB_APROBACION (solo si hay aprobadores nivel 2)
            -- =============================================================
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
                ) VALUES (
                    v_entidad_promocion,
                    v_idpromocion,
                    v_tipo_creacion,
                    v_idusuarioingreso,
                    v_nombreusuario,
                    SYSTIMESTAMP,
                    '*',
                    NULL,
                    NULL,
                    2,
                    v_estado_nuevo,
                    v_numero_lote_aprobacion
                );
    
            -- =============================================================
            -- LOG: guarda un “paquete” autocontenido
            -- (promoción + acuerdos + segmentos originales)
            -- =============================================================
            v_json_log := JSON_OBJECT(
                'tipoPromocion' VALUE 'GENERAL',
                'idPromocion'   VALUE v_idpromocion,
                'promocion'     VALUE p_json_promocion FORMAT JSON,
                'acuerdos'      VALUE CASE WHEN p_json_acuerdos IS NOT NULL THEN p_json_acuerdos ELSE '[]' END FORMAT JSON,
                'segmentos'     VALUE CASE WHEN p_json_segmentos IS NOT NULL THEN p_json_segmentos ELSE '[]' END FORMAT JSON
            );
    
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
                v_entidad_promocion,
                v_idpromocion,
                v_tipo_creacion,
                v_json_log
            );
    
            COMMIT;
    
            p_idpromocion_out := v_idpromocion;
            p_codigo_salida := 1;
            p_mensaje_salida := 'OK - Promoción General #' || v_idpromocion || ' creada exitosamente';
    
            RETURN;
    
        ELSIF v_etiqueta_recibida = v_etiqueta_articulo THEN
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: Tipo PRARTICULO no implementado aún';
            RETURN;
    
        ELSIF v_etiqueta_recibida = v_etiqueta_combo THEN
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: Tipo PRCOMBO no implementado aún';
            RETURN;
    
        ELSE
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: Tipo de promoción no válido: ' || p_tipo_clase_etiqueta;
            RETURN;
        END IF;
    
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_idpromocion_out := NULL;
            p_codigo_salida := 0;
            p_mensaje_salida := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END sp_crear_promocion;
    
END APL_PKG_PROMOCIONES;