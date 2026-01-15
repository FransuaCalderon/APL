CREATE OR REPLACE PACKAGE APL_PKG_CATALOGO AS
  TYPE t_cursor IS REF CURSOR;

  -- Crear un catálogo y devolver el ID generado
  PROCEDURE crear(
    p_nombre            IN  VARCHAR2,
    p_adicional         IN  VARCHAR2 DEFAULT NULL,
    p_abreviatura       IN  VARCHAR2 DEFAULT NULL, -- se recorta a 10 chars
    p_idcatalogotipo    IN  NUMBER,                -- FK a APL_TB_CATALOGOTIPO
    p_idusuariocreacion IN  NUMBER,
    p_idestado          IN  NUMBER,
    p_idetiqueta        IN  VARCHAR2 DEFAULT NULL,
    o_idcatalogo        OUT NUMBER
  );

  -- Actualizar un catálogo existente
  PROCEDURE actualizar(
    p_idcatalogo            IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_adicional             IN  VARCHAR2,
    p_abreviatura           IN  VARCHAR2, -- se recorta a 10 chars
    p_idcatalogotipo        IN  NUMBER,
    p_idusuariomodificacion IN  NUMBER,
    p_idestado              IN  NUMBER,
    p_idetiqueta            IN  VARCHAR2 DEFAULT NULL
  );

  -- Eliminar (hard delete) por ID
  PROCEDURE eliminar(
    p_idcatalogo IN NUMBER
  );

  -- Obtener registro por ID
  PROCEDURE obtener_por_id(
    p_idcatalogo IN  NUMBER,
    o_cur        OUT t_cursor
  );

  -- Listar con filtros y paginación; retorna también el total filtrado
  PROCEDURE listar(
    p_nombre         IN  VARCHAR2   DEFAULT NULL,  -- filtro LIKE (case-insensitive)
    p_idcatalogotipo IN  NUMBER     DEFAULT NULL,  -- por tipo
    p_idestado       IN  NUMBER     DEFAULT NULL,  -- por estado
    p_creado_desde   IN  DATE       DEFAULT NULL,  -- rango de creación (desde)
    p_creado_hasta   IN  DATE       DEFAULT NULL,  -- rango de creación (hasta, inclusivo)
    p_page_number    IN  PLS_INTEGER DEFAULT 1,    -- 1-based
    p_page_size      IN  PLS_INTEGER DEFAULT 50,
    o_cur            OUT t_cursor,
    o_total          OUT PLS_INTEGER
  );
  
  PROCEDURE SP_FILTRAR_CATALOGO_POR_TIPO(
        p_idcatalogotipo    IN  NUMBER,
        p_cursor            OUT t_cursor,
        p_codigo_error      OUT NUMBER,
        p_mensaje_error     OUT VARCHAR2
  );
END APL_PKG_CATALOGO;
/

=============================================================Body=========================
CREATE OR REPLACE PACKAGE BODY APL_PKG_CATALOGO AS

  PROCEDURE crear(
    p_nombre            IN  VARCHAR2,
    p_adicional         IN  VARCHAR2 DEFAULT NULL,
    p_abreviatura       IN  VARCHAR2 DEFAULT NULL,
    p_idcatalogotipo    IN  NUMBER,
    p_idusuariocreacion IN  NUMBER,
    p_idestado          IN  NUMBER,
    p_idetiqueta        IN  VARCHAR2 DEFAULT NULL,
    o_idcatalogo        OUT NUMBER
  ) IS
  BEGIN
    INSERT INTO APL_TB_CATALOGO(
      nombre, adicional, abreviatura, idcatalogotipo,
      idusuariocreacion, fechacreacion,
      idusuariomodificacion, fechamodificacion,
      idestado, idetiqueta
    ) VALUES (
      p_nombre,
      p_adicional,
      CASE WHEN p_abreviatura IS NOT NULL THEN SUBSTR(TRIM(p_abreviatura),1,10) END,
      p_idcatalogotipo,
      p_idusuariocreacion,
      SYSDATE,
      NULL,
      NULL,
      p_idestado,
      p_idetiqueta
    )
    RETURNING idcatalogo INTO o_idcatalogo;

  EXCEPTION
    WHEN OTHERS THEN
      -- FK inválida => ORA-02291; otros errores de datos/permiso/etc.
      RAISE_APPLICATION_ERROR(-20101,
        'Error al crear APL_TB_CATALOGO: '||SQLERRM);
  END crear;


  PROCEDURE actualizar(
    p_idcatalogo            IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_adicional             IN  VARCHAR2,
    p_abreviatura           IN  VARCHAR2,
    p_idcatalogotipo        IN  NUMBER,
    p_idusuariomodificacion IN  NUMBER,
    p_idestado              IN  NUMBER,
    p_idetiqueta            IN  VARCHAR2 DEFAULT NULL
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    UPDATE APL_TB_CATALOGO
       SET nombre                = p_nombre,
           adicional             = p_adicional,
           abreviatura           = CASE WHEN p_abreviatura IS NOT NULL THEN SUBSTR(TRIM(p_abreviatura),1,10) END,
           idcatalogotipo        = p_idcatalogotipo,
           idusuariomodificacion = p_idusuariomodificacion,
           fechamodificacion     = SYSDATE,
           idestado              = p_idestado,
           idetiqueta            = p_idetiqueta
     WHERE idcatalogo = p_idcatalogo;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20102,
        'No existe IDCATALOGO='||p_idcatalogo||' para actualizar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Si cambia idcatalogotipo a uno inexistente => ORA-02291
      RAISE_APPLICATION_ERROR(-20103,
        'Error al actualizar APL_TB_CATALOGO: '||SQLERRM);
  END actualizar;


  PROCEDURE eliminar(
    p_idcatalogo IN NUMBER
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    DELETE FROM APL_TB_CATALOGO
     WHERE idcatalogo = p_idcatalogo;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20104,
        'No existe IDCATALOGO='||p_idcatalogo||' para eliminar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay tablas hijas referenciando este catálogo => ORA-02292
      RAISE_APPLICATION_ERROR(-20105,
        'Error al eliminar APL_TB_CATALOGO: '||SQLERRM);
  END eliminar;


  PROCEDURE obtener_por_id(
    p_idcatalogo IN  NUMBER,
    o_cur        OUT t_cursor
  ) IS
  BEGIN
    OPEN o_cur FOR
      SELECT
        idcatalogo,
        nombre,
        adicional,
        abreviatura,
        idcatalogotipo,
        idusuariocreacion,
        fechacreacion,
        idusuariomodificacion,
        fechamodificacion,
        idestado,
        idetiqueta
      FROM APL_TB_CATALOGO
     WHERE idcatalogo = p_idcatalogo;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20106,
        'Error en obtener_por_id: '||SQLERRM);
  END obtener_por_id;


  PROCEDURE listar(
    p_nombre         IN  VARCHAR2   DEFAULT NULL,
    p_idcatalogotipo IN  NUMBER     DEFAULT NULL,
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
      FROM APL_TB_CATALOGO c
     WHERE (p_nombre         IS NULL OR UPPER(c.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idcatalogotipo IS NULL OR c.idcatalogotipo = p_idcatalogotipo)
       AND (p_idestado       IS NULL OR c.idestado       = p_idestado)
       AND (p_creado_desde   IS NULL OR c.fechacreacion  >= p_creado_desde)
       AND (p_creado_hasta   IS NULL OR c.fechacreacion  <  p_creado_hasta + 1);

    -- Página de resultados
    OPEN o_cur FOR
      SELECT
        c.idcatalogo,
        c.nombre,
        c.adicional,
        c.abreviatura,
        c.idcatalogotipo,
        c.idusuariocreacion,
        c.fechacreacion,
        c.idusuariomodificacion,
        c.fechamodificacion,
        c.idestado,
        c.idetiqueta
      FROM APL_TB_CATALOGO c
     WHERE (p_nombre         IS NULL OR UPPER(c.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idcatalogotipo IS NULL OR c.idcatalogotipo = p_idcatalogotipo)
       AND (p_idestado       IS NULL OR c.idestado       = p_idestado)
       AND (p_creado_desde   IS NULL OR c.fechacreacion  >= p_creado_desde)
       AND (p_creado_hasta   IS NULL OR c.fechacreacion  <  p_creado_hasta + 1)
     ORDER BY c.idcatalogo DESC
     OFFSET GREATEST(p_page_number-1, 0) * p_page_size ROWS
     FETCH NEXT p_page_size ROWS ONLY;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20107,
        'Error en listar: '||SQLERRM);
  END listar;
  
  PROCEDURE SP_FILTRAR_CATALOGO_POR_TIPO(
        p_idcatalogotipo    IN  NUMBER,
        p_cursor            OUT t_cursor,
        p_codigo_error      OUT NUMBER,
        p_mensaje_error     OUT VARCHAR2
   ) AS
  BEGIN
        -- Inicializar variables de error
        p_codigo_error  := 0;
        p_mensaje_error := 'OK';
        
        -- Abrir cursor con el filtro por IDCATALOGOTIPO
        OPEN p_cursor FOR
            SELECT  IDCATALOGO,
                    NOMBRE,
                    ADICIONAL,
                    ABREVIATURA,
                    IDCATALOGOTIPO,
                    IDUSUARIOCREACION,
                    FECHACREACION,
                    IDUSUARIOMODIFICACION,
                    FECHAMODIFICACION,
                    IDESTADO,
                    IDETIQUETA
            FROM    APL_TB_CATALOGO
            WHERE   IDCATALOGOTIPO = p_idcatalogotipo
            ORDER BY IDCATALOGO;
            
    EXCEPTION
        WHEN OTHERS THEN
            p_codigo_error  := SQLCODE;
            p_mensaje_error := 'Error: ' || SQLERRM;
    END SP_FILTRAR_CATALOGO_POR_TIPO;

END APL_PKG_CATALOGO;
/

