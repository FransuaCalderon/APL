create or replace PACKAGE APL_PKG_PARAMETRO AS
  TYPE t_cursor IS REF CURSOR;

  -- Crear un catálogo y devolver el ID generado
  PROCEDURE crear(
    p_nombre            IN  VARCHAR2,
    p_adicional         IN  VARCHAR2 DEFAULT NULL,
    p_abreviatura       IN  VARCHAR2 DEFAULT NULL, -- se recorta a 10 chars
    p_idparametrotipo    IN  NUMBER,                -- FK a APL_TB_CATALOGOTIPO
    p_idusuariocreacion IN  NUMBER,
    p_idestado          IN  NUMBER,
    p_idetiqueta        IN  VARCHAR2 DEFAULT NULL,
    o_idparametro        OUT NUMBER
  );

  -- Actualizar un catálogo existente
  PROCEDURE actualizar(
    p_idparametro            IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_adicional             IN  VARCHAR2,
    p_abreviatura           IN  VARCHAR2, -- se recorta a 10 chars
    p_idparametrotipo        IN  NUMBER,
    p_idusuariomodificacion IN  NUMBER,
    p_idestado              IN  NUMBER,
    p_idetiqueta            IN  VARCHAR2 DEFAULT NULL
  );

  -- Eliminar (hard delete) por ID
  PROCEDURE eliminar(
    p_idparametro IN NUMBER
  );

  -- Obtener registro por ID
  PROCEDURE obtener_por_id(
    p_idparametro IN  NUMBER,
    o_cur        OUT t_cursor
  );

  -- Listar con filtros y paginación; retorna también el total filtrado
  PROCEDURE listar(
    p_nombre         IN  VARCHAR2   DEFAULT NULL,  -- filtro LIKE (case-insensitive)
    p_idparametrotipo IN  NUMBER     DEFAULT NULL,  -- por tipo
    p_idestado       IN  NUMBER     DEFAULT NULL,  -- por estado
    p_creado_desde   IN  DATE       DEFAULT NULL,  -- rango de creación (desde)
    p_creado_hasta   IN  DATE       DEFAULT NULL,  -- rango de creación (hasta, inclusivo)
    p_page_number    IN  PLS_INTEGER DEFAULT 1,    -- 1-based
    p_page_size      IN  PLS_INTEGER DEFAULT 50,
    o_cur            OUT t_cursor,
    o_total          OUT PLS_INTEGER
  );
END APL_PKG_PARAMETRO;

===============================================body===========
create or replace PACKAGE BODY APL_PKG_PARAMETRO AS

  PROCEDURE crear(
    p_nombre            IN  VARCHAR2,
    p_adicional         IN  VARCHAR2 DEFAULT NULL,
    p_abreviatura       IN  VARCHAR2 DEFAULT NULL,
    p_idparametrotipo    IN  NUMBER,
    p_idusuariocreacion IN  NUMBER,
    p_idestado          IN  NUMBER,
    p_idetiqueta        IN  VARCHAR2 DEFAULT NULL,
    o_idparametro        OUT NUMBER
  ) IS
  BEGIN
    INSERT INTO APL_TB_PARAMETRO(
      nombre, adicional, abreviatura, idparametrotipo,
      idusuariocreacion, fechacreacion,
      idusuariomodificacion, fechamodificacion,
      idestado, idetiqueta
    ) VALUES (
      p_nombre,
      p_adicional,
      CASE WHEN p_abreviatura IS NOT NULL THEN SUBSTR(TRIM(p_abreviatura),1,10) END,
      p_idparametrotipo,
      p_idusuariocreacion,
      SYSDATE,
      NULL,
      NULL,
      p_idestado,
      p_idetiqueta
    )
    RETURNING idparametro INTO o_idparametro;

  EXCEPTION
    WHEN OTHERS THEN
      -- FK inválida => ORA-02291; otros errores de datos/permiso/etc.
      RAISE_APPLICATION_ERROR(-20101,
        'Error al crear APL_TB_CATALOGO: '||SQLERRM);
  END crear;


  PROCEDURE actualizar(
    p_idparametro            IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_adicional             IN  VARCHAR2,
    p_abreviatura           IN  VARCHAR2,
    p_idparametrotipo        IN  NUMBER,
    p_idusuariomodificacion IN  NUMBER,
    p_idestado              IN  NUMBER,
    p_idetiqueta            IN  VARCHAR2 DEFAULT NULL
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    UPDATE APL_TB_PARAMETRO
       SET nombre                = p_nombre,
           adicional             = p_adicional,
           abreviatura           = CASE WHEN p_abreviatura IS NOT NULL THEN SUBSTR(TRIM(p_abreviatura),1,10) END,
           idparametrotipo        = p_idparametrotipo,
           idusuariomodificacion = p_idusuariomodificacion,
           fechamodificacion     = SYSDATE,
           idestado              = p_idestado,
           idetiqueta            = p_idetiqueta
     WHERE idparametro = p_idparametro;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20102,
        'No existe IDCATALOGO='||p_idparametro||' para actualizar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Si cambia idcatalogotipo a uno inexistente => ORA-02291
      RAISE_APPLICATION_ERROR(-20103,
        'Error al actualizar APL_TB_PARAMETRO: '||SQLERRM);
  END actualizar;


  PROCEDURE eliminar(
    p_idparametro IN NUMBER
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    DELETE FROM APL_TB_PARAMETRO
     WHERE idparametro = p_idparametro;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20104,
        'No existe IDCATALOGO='||p_idparametro||' para eliminar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay tablas hijas referenciando este catálogo => ORA-02292
      RAISE_APPLICATION_ERROR(-20105,
        'Error al eliminar APL_TB_PARAMETRO: '||SQLERRM);
  END eliminar;


  PROCEDURE obtener_por_id(
    p_idparametro IN  NUMBER,
    o_cur        OUT t_cursor
  ) IS
  BEGIN
    OPEN o_cur FOR
      SELECT
        idparametro,
        nombre,
        adicional,
        abreviatura,
        idparametrotipo,
        idusuariocreacion,
        fechacreacion,
        idusuariomodificacion,
        fechamodificacion,
        idestado,
        idetiqueta
      FROM APL_TB_PARAMETRO
     WHERE idparametro = p_idparametro;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20106,
        'Error en obtener_por_id: '||SQLERRM);
  END obtener_por_id;


  PROCEDURE listar(
    p_nombre         IN  VARCHAR2   DEFAULT NULL,
    p_idparametrotipo IN  NUMBER     DEFAULT NULL,
    p_idestado       IN  NUMBER     DEFAULT NULL,
    p_creado_desde   IN  DATE       DEFAULT NULL,
    p_creado_hasta   IN  DATE       DEFAULT NULL,
    p_page_number    IN  PLS_INTEGER DEFAULT 1,
    p_page_size      IN  PLS_INTEGER DEFAULT 50,
    o_cur            OUT t_cursor,
    o_total          OUT PLS_INTEGER
  ) IS
  BEGIN
    -- Total con los mismos filtros
    SELECT COUNT(*)
      INTO o_total
      FROM APL_TB_PARAMETRO c
     WHERE (p_nombre         IS NULL OR UPPER(c.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idparametrotipo IS NULL OR c.idparametrotipo = p_idparametrotipo)
       AND (p_idestado       IS NULL OR c.idestado       = p_idestado)
       AND (p_creado_desde   IS NULL OR c.fechacreacion  >= p_creado_desde)
       AND (p_creado_hasta   IS NULL OR c.fechacreacion  <  p_creado_hasta + 1);

    -- Página de resultados
    OPEN o_cur FOR
      SELECT
        c.idparametro,
        c.nombre,
        c.adicional,
        c.abreviatura,
        c.idparametrotipo,
        c.idusuariocreacion,
        c.fechacreacion,
        c.idusuariomodificacion,
        c.fechamodificacion,
        c.idestado,
        c.idetiqueta
      FROM APL_TB_PARAMETRO c
     WHERE (p_nombre         IS NULL OR UPPER(c.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idparametrotipo IS NULL OR c.idparametrotipo = p_idparametrotipo)
       AND (p_idestado       IS NULL OR c.idestado       = p_idestado)
       AND (p_creado_desde   IS NULL OR c.fechacreacion  >= p_creado_desde)
       AND (p_creado_hasta   IS NULL OR c.fechacreacion  <  p_creado_hasta + 1)
     ORDER BY c.idparametro DESC
     OFFSET GREATEST(p_page_number-1, 0) * p_page_size ROWS
     FETCH NEXT p_page_size ROWS ONLY;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20107,
        'Error en listar: '||SQLERRM);
  END listar;

END APL_PKG_PARAMETRO;