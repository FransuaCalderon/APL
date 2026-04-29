create or replace PROCEDURE apl_sp_consultar_acuerdos_promocion_articulos (
      p_etiqueta_tipo_fondo   IN  VARCHAR2,
      p_codigo_item           IN  VARCHAR2,
      p_cursor                OUT SYS_REFCURSOR
  )
  AS
      v_etiqueta_clase_acuerdo_general  VARCHAR2(50);
      v_etiqueta_clase_acuerdo_articulo VARCHAR2(50);
      v_etiqueta_estado_vigente         VARCHAR2(50);
      v_etiqueta_tipo_fondo             VARCHAR2(50);
  BEGIN
      -- Cargar etiquetas desde catálogo
      SELECT idetiqueta INTO v_etiqueta_clase_acuerdo_general FROM apl_tb_catalogo WHERE idetiqueta = 'CLAGENERAL';

      SELECT idetiqueta INTO v_etiqueta_clase_acuerdo_articulo FROM apl_tb_catalogo WHERE idetiqueta = 'CLAARTICULO';

      SELECT idetiqueta INTO v_etiqueta_estado_vigente FROM apl_tb_catalogo WHERE idetiqueta = 'ESTADOVIGENTE';

      -- El tipo de fondo viene directo del parámetro
      v_etiqueta_tipo_fondo := p_etiqueta_tipo_fondo;

      OPEN p_cursor FOR
          -- Acuerdos de clase GENERAL (sin detalle por artículo)
          SELECT
              a.idacuerdo,
              a.descripcion,
              f.idtipofondo,
              af.idfondo,
              tf.nombre                                        AS nombre_tipo_fondo,
              tf.idetiqueta                                    AS etiqueta_tipo_fondo,
              arp.nombre                                       AS nombre_proveedor,
              ct.nombre                                        AS clase_acuerdo,
              ct.idetiqueta                                    AS etiqueta_clase_acuerdo,
              a.idtipoacuerdo,
              NVL(af.valoraporte, 0)                           AS valor_acuerdo,
              TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
              TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
              NVL(af.valordisponible, 0)                       AS valor_disponible,
              NVL(af.valorcomprometido, 0)                     AS valor_comprometido,
              NVL(af.valorliquidado, 0)                        AS valor_liquidado,
              ce.nombre                                        AS estado,
              ce.idetiqueta                                    AS estado_etiqueta,
              0                                                AS valor_aporte_por_items,
              0                                                AS valor_comprometido_items,
              0                                                AS unidades_limite
          FROM
              apl_tb_acuerdo              a
              INNER JOIN apl_tb_acuerdofondo          af  ON a.idacuerdo         = af.idacuerdo
              INNER JOIN apl_tb_fondo                 f   ON f.idfondo           = af.idfondo
              INNER JOIN apl_tb_artefacta_proveedor   arp ON arp.identificacion  = f.idproveedor
              INNER JOIN apl_tb_catalogo              ct  ON a.idtipoacuerdo     = ct.idcatalogo
              INNER JOIN apl_tb_catalogo              ce  ON a.idestadoregistro  = ce.idcatalogo
              INNER JOIN apl_tb_catalogo              tf  ON f.idtipofondo       = tf.idcatalogo
          WHERE
              ce.idetiqueta             = v_etiqueta_estado_vigente
              AND NVL(af.valordisponible, 0) > 0
              AND UPPER(tf.idetiqueta)  = UPPER(v_etiqueta_tipo_fondo)
              AND ct.idetiqueta         = v_etiqueta_clase_acuerdo_general

          UNION

          -- Acuerdos de clase ARTÍCULO (con detalle por artículo específico)
          SELECT
              a.idacuerdo,
              a.descripcion,
              f.idtipofondo,
              af.idfondo,
              tf.nombre                                        AS nombre_tipo_fondo,
              tf.idetiqueta                                    AS etiqueta_tipo_fondo,
              arp.nombre                                       AS nombre_proveedor,
              ct.nombre                                        AS clase_acuerdo,
              ct.idetiqueta                                    AS etiqueta_clase_acuerdo,
              a.idtipoacuerdo,
              NVL(af.valoraporte, 0)                           AS valor_acuerdo,
              TO_CHAR(a.fechainiciovigencia, 'YYYY-MM-DD')     AS fecha_inicio,
              TO_CHAR(a.fechafinvigencia, 'YYYY-MM-DD')        AS fecha_fin,
              NVL(af.valordisponible, 0)                       AS valor_disponible,
              NVL(af.valorcomprometido, 0)                     AS valor_comprometido,
              NVL(af.valorliquidado, 0)                        AS valor_liquidado,
              ce.nombre                                        AS estado,
              ce.idetiqueta                                    AS estado_etiqueta,
              act.valoraporte                                  AS valor_aporte_por_items,
              act.valorcomprometido                            AS valor_comprometido_items,
              act.unidadeslimite                               AS unidades_limite
          FROM
              apl_tb_acuerdo              a
              INNER JOIN apl_tb_acuerdofondo          af  ON a.idacuerdo = af.idacuerdo
              INNER JOIN apl_tb_fondo                 f   ON f.idfondo  = af.idfondo
              INNER JOIN apl_tb_artefacta_proveedor   arp ON arp.identificacion  = f.idproveedor
              INNER JOIN apl_tb_catalogo              ct  ON a.idtipoacuerdo = ct.idcatalogo
              INNER JOIN apl_tb_catalogo              ce  ON a.idestadoregistro = ce.idcatalogo
              INNER JOIN apl_tb_catalogo              tf  ON f.idtipofondo      = tf.idcatalogo
              INNER JOIN apl_tb_acuerdoarticulo       act ON a.idacuerdo        = act.idacuerdo AND act.codigoarticulo = p_codigo_item
          WHERE
              ce.idetiqueta             = v_etiqueta_estado_vigente
              AND NVL(af.valordisponible, 0) > 0
              AND UPPER(tf.idetiqueta)  = UPPER(v_etiqueta_tipo_fondo)
              AND ct.idetiqueta         = v_etiqueta_clase_acuerdo_articulo;

  EXCEPTION
      WHEN NO_DATA_FOUND THEN
          IF p_cursor%ISOPEN THEN
              CLOSE p_cursor;
          END IF;
          RAISE_APPLICATION_ERROR(-20001, 'No se encontró una o más etiquetas requeridas en apl_tb_catalogo.');
      WHEN OTHERS THEN
          IF p_cursor%ISOPEN THEN
              CLOSE p_cursor;
          END IF;
          RAISE;
  END apl_sp_consultar_acuerdos_promocion_articulos;