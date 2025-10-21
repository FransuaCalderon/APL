create or replace NONEDITIONABLE PACKAGE APL_PKG_CATALOGOTIPO AS
  TYPE t_cursor IS REF CURSOR;

  -- Crea un registro y devuelve el ID generado
  PROCEDURE crear(
    p_nombre                        IN  VARCHAR2,
    p_descripcion                   IN  VARCHAR2,
    p_idusuariocreacion             IN  NUMBER,
    p_idestado                      IN  NUMBER,
    p_idmarcaabreviaturaautomatica  IN  NUMBER DEFAULT NULL,
    p_idetiqueta                    IN  VARCHAR2 DEFAULT NULL,
    o_idcatalogotipo                OUT NUMBER
  );

  -- Actualiza un registro existente (por ID)
  PROCEDURE actualizar(
    p_idcatalogotipo                IN  NUMBER,
    p_nombre                        IN  VARCHAR2,
    p_descripcion                   IN  VARCHAR2,
    p_idusuariomodificacion         IN  NUMBER,
    p_idestado                      IN  NUMBER,
    p_idmarcaabreviaturaautomatica  IN  NUMBER DEFAULT NULL,
    p_idetiqueta                    IN  VARCHAR2 DEFAULT NULL
  );

  -- Elimina (hard delete) por ID
  PROCEDURE eliminar(
    p_idcatalogotipo IN NUMBER
  );

  -- Obtiene un registro por ID
  PROCEDURE obtener_por_id(
    p_idcatalogotipo IN  NUMBER,
    o_cur            OUT t_cursor
  );

  -- Lista con filtros y paginación; devuelve también el total de filas del filtro
  PROCEDURE listar(
    p_nombre        IN  VARCHAR2  DEFAULT NULL,  -- filtro LIKE
    p_idestado      IN  NUMBER    DEFAULT NULL,
    p_creado_desde  IN  DATE      DEFAULT NULL,
    p_creado_hasta  IN  DATE      DEFAULT NULL,
    p_page_number   IN  PLS_INTEGER DEFAULT 1,   -- 1-based
    p_page_size     IN  PLS_INTEGER DEFAULT 50,
    o_cur           OUT t_cursor,
    o_total         OUT PLS_INTEGER
  );
END APL_PKG_CATALOGOTIPO;

=========================BODY===========================================
CREATE OR REPLACE PACKAGE BODY APL_PKG_CATALOGOTIPO AS

  PROCEDURE crear(
    p_nombre                        IN  VARCHAR2,
    p_descripcion                   IN  VARCHAR2,
    p_idusuariocreacion             IN  NUMBER,
    p_idestado                      IN  NUMBER,
    p_idmarcaabreviaturaautomatica  IN  NUMBER DEFAULT NULL,
    p_idetiqueta                    IN  VARCHAR2 DEFAULT NULL,
    o_idcatalogotipo                OUT NUMBER
  ) IS
  BEGIN
    INSERT INTO APL_TB_CATALOGOTIPO (
      nombre, descripcion, idusuariocreacion, fechacreacion,
      idusuariomodificacion, fechamodificacion, idestado,
      idmarcaabreviaturaautomatica, idetiqueta
    ) VALUES (
      p_nombre,
      p_descripcion,
      p_idusuariocreacion,
      SYSDATE,
      NULL,
      NULL,
      p_idestado,
      p_idmarcaabreviaturaautomatica,
      p_idetiqueta
    )
    RETURNING idcatalogotipo INTO o_idcatalogotipo;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20001,
        'Error al crear APL_TB_CATALOGOTIPO: '||SQLERRM);
  END crear;

  PROCEDURE actualizar(
    p_idcatalogotipo                IN  NUMBER,
    p_nombre                        IN  VARCHAR2,
    p_descripcion                   IN  VARCHAR2,
    p_idusuariomodificacion         IN  NUMBER,
    p_idestado                      IN  NUMBER,
    p_idmarcaabreviaturaautomatica  IN  NUMBER DEFAULT NULL,
    p_idetiqueta                    IN  VARCHAR2 DEFAULT NULL
  ) IS
    v_rows  PLS_INTEGER;
  BEGIN
    UPDATE APL_TB_CATALOGOTIPO
       SET nombre        = p_nombre,
           descripcion   = p_descripcion,
           idusuariomodificacion = p_idusuariomodificacion,
           fechamodificacion     = SYSDATE,
           idestado      = p_idestado,
           idmarcaabreviaturaautomatica = p_idmarcaabreviaturaautomatica,
           idetiqueta    = p_idetiqueta
     WHERE idcatalogotipo = p_idcatalogotipo;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20002,
        'No existe IDCATALOGOTIPO='||p_idcatalogotipo||' para actualizar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20003,
        'Error al actualizar APL_TB_CATALOGOTIPO: '||SQLERRM);
  END actualizar;

  PROCEDURE eliminar(
    p_idcatalogotipo IN NUMBER
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    DELETE FROM APL_TB_CATALOGOTIPO
     WHERE idcatalogotipo = p_idcatalogotipo;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20004,
        'No existe IDCATALOGOTIPO='||p_idcatalogotipo||' para eliminar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay FK, aquí verás ORA-02292. Puedes optar por "borrado lógico" usando IDESTADO.
      RAISE_APPLICATION_ERROR(-20005,
        'Error al eliminar APL_TB_CATALOGOTIPO: '||SQLERRM);
  END eliminar;

  PROCEDURE obtener_por_id(
    p_idcatalogotipo IN  NUMBER,
    o_cur            OUT t_cursor
  ) IS
  BEGIN
    OPEN o_cur FOR
      SELECT
        idcatalogotipo,
        nombre,
        descripcion,
        idusuariocreacion,
        fechacreacion,
        idusuariomodificacion,
        fechamodificacion,
        idestado,
        idmarcaabreviaturaautomatica,
        idetiqueta
      FROM APL_TB_CATALOGOTIPO
     WHERE idcatalogotipo = p_idcatalogotipo;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20006,
        'Error en obtener_por_id: '||SQLERRM);
  END obtener_por_id;

  PROCEDURE listar(
    p_nombre        IN  VARCHAR2  DEFAULT NULL,
    p_idestado      IN  NUMBER    DEFAULT NULL,
    p_creado_desde  IN  DATE      DEFAULT NULL,
    p_creado_hasta  IN  DATE      DEFAULT NULL,
    p_page_number   IN  PLS_INTEGER DEFAULT 1,
    p_page_size     IN  PLS_INTEGER DEFAULT 50,
    o_cur           OUT t_cursor,
    o_total         OUT PLS_INTEGER
  ) IS
  BEGIN
    -- Total para el mismo filtro
    SELECT COUNT(*)
      INTO o_total
      FROM APL_TB_CATALOGOTIPO t
     WHERE (p_nombre   IS NULL OR UPPER(t.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idestado IS NULL OR t.idestado = p_idestado)
       AND (p_creado_desde IS NULL OR t.fechacreacion >= p_creado_desde)
       AND (p_creado_hasta IS NULL OR t.fechacreacion <  p_creado_hasta + 1);

    -- Página solicitada
    OPEN o_cur FOR
      SELECT
        t.idcatalogotipo,
        t.nombre,
        t.descripcion,
        t.idusuariocreacion,
        t.fechacreacion,
        t.idusuariomodificacion,
        t.fechamodificacion,
        t.idestado,
        t.idmarcaabreviaturaautomatica,
        t.idetiqueta
      FROM APL_TB_CATALOGOTIPO t
     WHERE (p_nombre   IS NULL OR UPPER(t.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idestado IS NULL OR t.idestado = p_idestado)
       AND (p_creado_desde IS NULL OR t.fechacreacion >= p_creado_desde)
       AND (p_creado_hasta IS NULL OR t.fechacreacion <  p_creado_hasta + 1)
     ORDER BY t.idcatalogotipo DESC
     OFFSET GREATEST((p_page_number-1),0) * p_page_size ROWS
     FETCH NEXT p_page_size ROWS ONLY;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20007,
        'Error en listar: '||SQLERRM);
  END listar;

END APL_PKG_CATALOGOTIPO;
/

===========================================PRUEBAS===========================================
-- Crear
DECLARE
  v_id NUMBER;
BEGIN
  APL_CATALOGOTIPO_PKG.crear(
    p_nombre       => 'CAT TIPOS',
    p_descripcion  => 'Catálogo de tipos',
    p_idusuariocreacion => 1001,
    p_idestado     => 1,
    p_idmarcaabreviaturaautomatica => NULL,
    p_idetiqueta   => 'TIPO',
    o_idcatalogotipo => v_id
  );
  DBMS_OUTPUT.PUT_LINE('Nuevo ID: '||v_id);
END;
/


-- Actualizar
BEGIN
  APL_CATALOGOTIPO_PKG.actualizar(
    p_idcatalogotipo => 4,
    p_nombre         => 'CAT TIPOS (upd)',
    p_descripcion    => 'Descripción actualizada',
    p_idusuariomodificacion => 1002,
    p_idestado       => 1,
    p_idmarcaabreviaturaautomatica => 5,
    p_idetiqueta     => 'TAG-UPD'
  );
END;
/


-- Obtener por ID
VAR rc REFCURSOR
EXEC APL_CATALOGOTIPO_PKG.obtener_por_id(4, :rc);
PRINT rc


-- Eliminar
BEGIN
  APL_CATALOGOTIPO_PKG.eliminar(4);
END;