CREATE OR REPLACE PACKAGE APL_OPCION_PKG AS
  TYPE t_cursor IS REF CURSOR;

  PROCEDURE crear(
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariocreacion     IN  NUMBER,
    p_idestado              IN  NUMBER,
    o_idopcion              OUT NUMBER
  );

  PROCEDURE actualizar(
    p_idopcion              IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariomodificacion IN  NUMBER,
    p_idestado              IN  NUMBER
  );

  PROCEDURE eliminar(
    p_idopcion IN NUMBER
  );

  PROCEDURE obtener_por_id(
    p_idopcion IN  NUMBER,
    o_cur      OUT t_cursor
  );

  PROCEDURE listar(
    p_nombre       IN  VARCHAR2    DEFAULT NULL, -- filtro LIKE (case-insensitive)
    p_idgrupo      IN  NUMBER      DEFAULT NULL,
    p_idestado     IN  NUMBER      DEFAULT NULL,
    p_creado_desde IN  TIMESTAMP   DEFAULT NULL,
    p_creado_hasta IN  TIMESTAMP   DEFAULT NULL, -- inclusivo (día completo)
    p_page_number  IN  PLS_INTEGER DEFAULT 1,    -- 1-based
    p_page_size    IN  PLS_INTEGER DEFAULT 50,
    o_cur          OUT t_cursor,
    o_total        OUT PLS_INTEGER
  );
END APL_OPCION_PKG;
/

================================Body================
CREATE OR REPLACE PACKAGE BODY APL_OPCION_PKG AS

  PROCEDURE crear(
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariocreacion     IN  NUMBER,
    p_idestado              IN  NUMBER,
    o_idopcion              OUT NUMBER
  ) IS
  BEGIN
    INSERT INTO APL_TB_OPCION(
      nombre, descripcion, idgrupo, vista,
      idusuariocreacion, fechacreacion,
      idusuariomodificacion, fechamodificacion,
      idestado
    ) VALUES (
      p_nombre,
      p_descripcion,
      p_idgrupo,
      p_vista,
      p_idusuariocreacion,
      SYSTIMESTAMP,
      NULL,
      NULL,
      p_idestado
    )
    RETURNING idopcion INTO o_idopcion;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20201,
        'Error al crear APL_TB_OPCION: '||SQLERRM);
  END crear;


  PROCEDURE actualizar(
    p_idopcion              IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariomodificacion IN  NUMBER,
    p_idestado              IN  NUMBER
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    UPDATE APL_TB_OPCION
       SET nombre                = p_nombre,
           descripcion           = p_descripcion,
           idgrupo               = p_idgrupo,
           vista                 = p_vista,
           idusuariomodificacion = p_idusuariomodificacion,
           fechamodificacion     = SYSTIMESTAMP,
           idestado              = p_idestado
     WHERE idopcion = p_idopcion;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20202,
        'No existe IDOPCION='||p_idopcion||' para actualizar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20203,
        'Error al actualizar APL_TB_OPCION: '||SQLERRM);
  END actualizar;


  PROCEDURE eliminar(
    p_idopcion IN NUMBER
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    DELETE FROM APL_TB_OPCION
     WHERE idopcion = p_idopcion;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20204,
        'No existe IDOPCION='||p_idopcion||' para eliminar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Si hay tablas hijas con FK: ORA-02292
      RAISE_APPLICATION_ERROR(-20205,
        'Error al eliminar APL_TB_OPCION: '||SQLERRM);
  END eliminar;


  PROCEDURE obtener_por_id(
    p_idopcion IN  NUMBER,
    o_cur      OUT t_cursor
  ) IS
  BEGIN
    OPEN o_cur FOR
      SELECT
        idopcion,
        nombre,
        descripcion,
        idgrupo,
        vista,
        idusuariocreacion,
        fechacreacion,
        idusuariomodificacion,
        fechamodificacion,
        idestado
      FROM APL_TB_OPCION
     WHERE idopcion = p_idopcion;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20206,
        'Error en obtener_por_id: '||SQLERRM);
  END obtener_por_id;


  PROCEDURE listar(
    p_nombre       IN  VARCHAR2    DEFAULT NULL,
    p_idgrupo      IN  NUMBER      DEFAULT NULL,
    p_idestado     IN  NUMBER      DEFAULT NULL,
    p_creado_desde IN  TIMESTAMP   DEFAULT NULL,
    p_creado_hasta IN  TIMESTAMP   DEFAULT NULL,
    p_page_number  IN  PLS_INTEGER DEFAULT 1,
    p_page_size    IN  PLS_INTEGER DEFAULT 50,
    o_cur          OUT t_cursor,
    o_total        OUT PLS_INTEGER
  ) IS
  BEGIN
    -- Total con los mismos filtros
    SELECT COUNT(*)
      INTO o_total
      FROM APL_TB_OPCION o
     WHERE (p_nombre   IS NULL OR UPPER(o.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idgrupo  IS NULL OR o.idgrupo = p_idgrupo)
       AND (p_idestado IS NULL OR o.idestado = p_idestado)
       AND (p_creado_desde IS NULL OR o.fechacreacion >= p_creado_desde)
       AND (p_creado_hasta IS NULL OR o.fechacreacion <  p_creado_hasta + NUMTODSINTERVAL(1,'DAY'));

    -- Página solicitada
    OPEN o_cur FOR
      SELECT
        o.idopcion,
        o.nombre,
        o.descripcion,
        o.idgrupo,
        o.vista,
        o.idusuariocreacion,
        o.fechacreacion,
        o.idusuariomodificacion,
        o.fechamodificacion,
        o.idestado
      FROM APL_TB_OPCION o
     WHERE (p_nombre   IS NULL OR UPPER(o.nombre) LIKE '%'||UPPER(p_nombre)||'%')
       AND (p_idgrupo  IS NULL OR o.idgrupo = p_idgrupo)
       AND (p_idestado IS NULL OR o.idestado = p_idestado)
       AND (p_creado_desde IS NULL OR o.fechacreacion >= p_creado_desde)
       AND (p_creado_hasta IS NULL OR o.fechacreacion <  p_creado_hasta + NUMTODSINTERVAL(1,'DAY'))
     ORDER BY o.idopcion DESC
     OFFSET GREATEST(p_page_number-1, 0) * p_page_size ROWS
     FETCH NEXT p_page_size ROWS ONLY;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20207,
        'Error en listar: '||SQLERRM);
  END listar;

END APL_OPCION_PKG;
/

===========================================================PRUEBAS
-- Crear
SET SERVEROUTPUT ON
DECLARE
  v_id NUMBER;
BEGIN
  APL_OPCION_PKG.crear(
    p_nombre            => 'Usuarios - Crear',
    p_descripcion       => 'Permite crear usuarios',
    p_idgrupo           => 1,
    p_vista             => '/seguridad/usuarios/crear',
    p_idusuariocreacion => 1001,
    p_idestado          => 1,
    o_idopcion          => v_id
  );
  DBMS_OUTPUT.PUT_LINE('Nuevo IDOPCION: '||v_id);
END;
/

-- Actualizar
BEGIN
  APL_OPCION_PKG.actualizar(
    p_idopcion              => 4,
    p_nombre                => 'Usuarios - Crear (upd)',
    p_descripcion           => 'Actualización de descripción',
    p_idgrupo               => 1,
    p_vista                 => '/seguridad/usuarios/crear',
    p_idusuariomodificacion => 1002,
    p_idestado              => 1
  );
END;
/

-- Obtener por ID
VAR rc REFCURSOR
EXEC APL_OPCION_PKG.obtener_por_id(4, :rc);
PRINT rc

-- Listar (página 1, 20 filas, filtro por nombre y estado)
VAR rc2 REFCURSOR
VAR total NUMBER
EXEC APL_OPCION_PKG.listar('Usuarios', NULL, 1, NULL, NULL, 1, 20, :rc2, :total);
PRINT rc2
PRINT total


-- Listar (página 1, 20 filas, filtro por nombre y estado)
VAR rc2 REFCURSOR
VAR total NUMBER
EXEC APL_OPCION_PKG.listar('Usuarios', NULL, 1, NULL, NULL, 1, 20, :rc2, :total);
PRINT rc2
PRINT total

-- Eliminar
BEGIN
  APL_OPCION_PKG.eliminar(4);
END;
/