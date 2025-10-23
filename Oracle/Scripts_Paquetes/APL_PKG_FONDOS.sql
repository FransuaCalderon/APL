CREATE OR REPLACE PACKAGE APL_PKG_FONDOS IS
  /* Lista todos los fondos */
  PROCEDURE listar_fondos(p_cur OUT SYS_REFCURSOR);

  /* Crea un fondo y devuelve el ID autogenerado */
  PROCEDURE crear_fondo(
    p_descripcion_fondo      IN APL_TB_FONDOS.DESCRIPCION_FONDO%TYPE,
    p_idproveedor            IN APL_TB_FONDOS.IDPROVEEDOR%TYPE,
    p_tipo_fondo             IN APL_TB_FONDOS.TIPO_FONDO%TYPE,
    p_valor_fondo            IN APL_TB_FONDOS.VALOR_FONDO%TYPE,
    p_fecha_inicio_vigencia  IN APL_TB_FONDOS.FECHA_INICIO_VIGENCIA%TYPE,
    p_fecha_fin_vigencia     IN APL_TB_FONDOS.FECHA_FIN_VIGENCIA%TYPE,
    p_valor_disponible       IN APL_TB_FONDOS.VALOR_DISPONIBLE%TYPE,
    p_valor_comprometido     IN APL_TB_FONDOS.VALOR_COMPROMETIDO%TYPE,
    p_valor_liquidado        IN APL_TB_FONDOS.VALOR_LIQUIDADO%TYPE,
    p_estado_registro        IN APL_TB_FONDOS.ESTADO_REGISTRO%TYPE,
    p_indicador_creacion     IN APL_TB_FONDOS.INDICADOR_CREACION%TYPE,
    p_idfondo_out           OUT APL_TB_FONDOS.IDFONDO%TYPE
  );

  /* Actualiza un fondo por ID */
  PROCEDURE actualizar_fondo(
    p_idfondo                IN APL_TB_FONDOS.IDFONDO%TYPE,
    p_descripcion_fondo      IN APL_TB_FONDOS.DESCRIPCION_FONDO%TYPE,
    p_idproveedor            IN APL_TB_FONDOS.IDPROVEEDOR%TYPE,
    p_tipo_fondo             IN APL_TB_FONDOS.TIPO_FONDO%TYPE,
    p_valor_fondo            IN APL_TB_FONDOS.VALOR_FONDO%TYPE,
    p_fecha_inicio_vigencia  IN APL_TB_FONDOS.FECHA_INICIO_VIGENCIA%TYPE,
    p_fecha_fin_vigencia     IN APL_TB_FONDOS.FECHA_FIN_VIGENCIA%TYPE,
    p_valor_disponible       IN APL_TB_FONDOS.VALOR_DISPONIBLE%TYPE,
    p_valor_comprometido     IN APL_TB_FONDOS.VALOR_COMPROMETIDO%TYPE,
    p_valor_liquidado        IN APL_TB_FONDOS.VALOR_LIQUIDADO%TYPE,
    p_estado_registro        IN APL_TB_FONDOS.ESTADO_REGISTRO%TYPE,
    p_indicador_creacion     IN APL_TB_FONDOS.INDICADOR_CREACION%TYPE
  );

  /* Elimina un fondo por ID */
  PROCEDURE eliminar_fondo(p_idfondo IN APL_TB_FONDOS.IDFONDO%TYPE);
END APL_PKG_FONDOS;

==========================================================================================================BODY===========================

CREATE OR REPLACE PACKAGE BODY APL_PKG_FONDOS IS

  PROCEDURE validar_fechas(
    p_ini IN APL_TB_FONDOS.FECHA_INICIO_VIGENCIA%TYPE,
    p_fin IN APL_TB_FONDOS.FECHA_FIN_VIGENCIA%TYPE
  ) IS
  BEGIN
    IF p_fin IS NOT NULL AND p_ini IS NOT NULL AND p_fin < p_ini THEN
      RAISE_APPLICATION_ERROR(-20001, 'FECHA_FIN_VIGENCIA no puede ser menor que FECHA_INICIO_VIGENCIA');
    END IF;
  END validar_fechas;

  PROCEDURE listar_fondos(p_cur OUT SYS_REFCURSOR) IS
  BEGIN
    OPEN p_cur FOR
      SELECT
        IDFONDO,
        DESCRIPCION_FONDO,
        IDPROVEEDOR,
        TIPO_FONDO,
        VALOR_FONDO,
        FECHA_INICIO_VIGENCIA,
        FECHA_FIN_VIGENCIA,
        VALOR_DISPONIBLE,
        VALOR_COMPROMETIDO,
        VALOR_LIQUIDADO,
        ESTADO_REGISTRO,
        INDICADOR_CREACION
      FROM APL_TB_FONDOS
      ORDER BY IDFONDO;
  END listar_fondos;

  PROCEDURE crear_fondo(
    p_descripcion_fondo      IN APL_TB_FONDOS.DESCRIPCION_FONDO%TYPE,
    p_idproveedor            IN APL_TB_FONDOS.IDPROVEEDOR%TYPE,
    p_tipo_fondo             IN APL_TB_FONDOS.TIPO_FONDO%TYPE,
    p_valor_fondo            IN APL_TB_FONDOS.VALOR_FONDO%TYPE,
    p_fecha_inicio_vigencia  IN APL_TB_FONDOS.FECHA_INICIO_VIGENCIA%TYPE,
    p_fecha_fin_vigencia     IN APL_TB_FONDOS.FECHA_FIN_VIGENCIA%TYPE,
    p_valor_disponible       IN APL_TB_FONDOS.VALOR_DISPONIBLE%TYPE,
    p_valor_comprometido     IN APL_TB_FONDOS.VALOR_COMPROMETIDO%TYPE,
    p_valor_liquidado        IN APL_TB_FONDOS.VALOR_LIQUIDADO%TYPE,
    p_estado_registro        IN APL_TB_FONDOS.ESTADO_REGISTRO%TYPE,
    p_indicador_creacion     IN APL_TB_FONDOS.INDICADOR_CREACION%TYPE,
    p_idfondo_out           OUT APL_TB_FONDOS.IDFONDO%TYPE
  ) IS
    v_valor_disponible APL_TB_FONDOS.VALOR_DISPONIBLE%TYPE;
  BEGIN
    validar_fechas(p_fecha_inicio_vigencia, p_fecha_fin_vigencia);

    /* Si no te envían disponible, lo calculamos simple: fondo - comprometido - liquidado */
    v_valor_disponible :=
      NVL(p_valor_disponible,
          NVL(p_valor_fondo,0) - NVL(p_valor_comprometido,0) - NVL(p_valor_liquidado,0));

    INSERT INTO APL_TB_FONDOS (
      DESCRIPCION_FONDO,
      IDPROVEEDOR,
      TIPO_FONDO,
      VALOR_FONDO,
      FECHA_INICIO_VIGENCIA,
      FECHA_FIN_VIGENCIA,
      VALOR_DISPONIBLE,
      VALOR_COMPROMETIDO,
      VALOR_LIQUIDADO,
      ESTADO_REGISTRO,
      INDICADOR_CREACION
    ) VALUES (
      p_descripcion_fondo,
      p_idproveedor,
      p_tipo_fondo,
      p_valor_fondo,
      p_fecha_inicio_vigencia,
      p_fecha_fin_vigencia,
      v_valor_disponible,
      p_valor_comprometido,
      p_valor_liquidado,
      p_estado_registro,
      p_indicador_creacion
    )
    RETURNING IDFONDO INTO p_idfondo_out; -- IDENTITY GENERATED ALWAYS

  EXCEPTION
    WHEN OTHERS THEN
      RAISE; -- deja el control de transacción al llamador
  END crear_fondo;

  PROCEDURE actualizar_fondo(
    p_idfondo                IN APL_TB_FONDOS.IDFONDO%TYPE,
    p_descripcion_fondo      IN APL_TB_FONDOS.DESCRIPCION_FONDO%TYPE,
    p_idproveedor            IN APL_TB_FONDOS.IDPROVEEDOR%TYPE,
    p_tipo_fondo             IN APL_TB_FONDOS.TIPO_FONDO%TYPE,
    p_valor_fondo            IN APL_TB_FONDOS.VALOR_FONDO%TYPE,
    p_fecha_inicio_vigencia  IN APL_TB_FONDOS.FECHA_INICIO_VIGENCIA%TYPE,
    p_fecha_fin_vigencia     IN APL_TB_FONDOS.FECHA_FIN_VIGENCIA%TYPE,
    p_valor_disponible       IN APL_TB_FONDOS.VALOR_DISPONIBLE%TYPE,
    p_valor_comprometido     IN APL_TB_FONDOS.VALOR_COMPROMETIDO%TYPE,
    p_valor_liquidado        IN APL_TB_FONDOS.VALOR_LIQUIDADO%TYPE,
    p_estado_registro        IN APL_TB_FONDOS.ESTADO_REGISTRO%TYPE,
    p_indicador_creacion     IN APL_TB_FONDOS.INDICADOR_CREACION%TYPE
  ) IS
    v_valor_disponible APL_TB_FONDOS.VALOR_DISPONIBLE%TYPE;
  BEGIN
    validar_fechas(p_fecha_inicio_vigencia, p_fecha_fin_vigencia);

    v_valor_disponible :=
      NVL(p_valor_disponible,
          NVL(p_valor_fondo,0) - NVL(p_valor_comprometido,0) - NVL(p_valor_liquidado,0));

    UPDATE APL_TB_FONDOS
       SET DESCRIPCION_FONDO     = p_descripcion_fondo,
           IDPROVEEDOR           = p_idproveedor,
           TIPO_FONDO            = p_tipo_fondo,
           VALOR_FONDO           = p_valor_fondo,
           FECHA_INICIO_VIGENCIA = p_fecha_inicio_vigencia,
           FECHA_FIN_VIGENCIA    = p_fecha_fin_vigencia,
           VALOR_DISPONIBLE      = v_valor_disponible,
           VALOR_COMPROMETIDO    = p_valor_comprometido,
           VALOR_LIQUIDADO       = p_valor_liquidado,
           ESTADO_REGISTRO       = p_estado_registro,
           INDICADOR_CREACION    = p_indicador_creacion
     WHERE IDFONDO = p_idfondo;

    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20002, 'No existe APL_TB_FONDOS.IDFONDO='||p_idfondo);
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END actualizar_fondo;

  PROCEDURE eliminar_fondo(p_idfondo IN APL_TB_FONDOS.IDFONDO%TYPE) IS
  BEGIN
    DELETE FROM APL_TB_FONDOS WHERE IDFONDO = p_idfondo;

    IF SQL%ROWCOUNT = 0 THEN
      RAISE_APPLICATION_ERROR(-20003, 'No existe APL_TB_FONDOS.IDFONDO='||p_idfondo);
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END eliminar_fondo;

END APL_PKG_FONDOS;
