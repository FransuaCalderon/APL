create or replace PACKAGE APL_PKG_OPCIONES AS
  
  PROCEDURE crear(
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariocreacion     IN  NUMBER,
    p_idestado              IN  NUMBER,
    p_IdTipoServicio        IN  NUMBER,
    o_idopcion              OUT NUMBER
  );

  PROCEDURE actualizar(
    p_idopcion              IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariomodificacion IN  NUMBER,
    p_IdTipoServicio        IN  NUMBER,
    p_idestado              IN  NUMBER
  );

  PROCEDURE eliminar(
    p_idopcion IN NUMBER
  );

  PROCEDURE listar(
    p_opciones_out          OUT SYS_REFCURSOR,
    p_nombreusuario         IN VARCHAR2
  );
  
  PROCEDURE obtener_por_id(
    p_idopcion IN NUMBER,
    p_opciones_out OUT SYS_REFCURSOR
  );

  PROCEDURE listarOpcionesAutorizadasInternas(
    p_idusuario    IN  NUMBER,
    p_opciones_out OUT SYS_REFCURSOR
  );

  PROCEDURE listarOpcionesAutorizadasCorporativa(
    p_idusuario     IN  NUMBER,
    p_idopcionlista IN  CLOB,
    p_opciones_out  OUT SYS_REFCURSOR
  );

END APL_PKG_OPCIONES;


================================Body================

create or replace PACKAGE BODY APL_PKG_OPCIONES AS

  PROCEDURE crear(
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariocreacion     IN  NUMBER,
    p_idestado              IN  NUMBER,
    p_IdTipoServicio        IN  NUMBER,
    o_idopcion              OUT NUMBER
  ) IS
  BEGIN
    INSERT INTO APL_TB_OPCIONES (
      nombre, descripcion, idgrupo, vista,
      idusuariocreacion, fechacreacion,
      idusuariomodificacion, fechamodificacion,
      idestado, IdTipoServicio
    ) VALUES (
      p_nombre,
      p_descripcion,
      p_idgrupo,
      p_vista,
      p_idusuariocreacion,
      SYSTIMESTAMP,
      NULL,
      NULL,
      p_idestado,
      p_IdTipoServicio
    )
    RETURNING idopcion INTO o_idopcion;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20201,
        'Error al crear APL_TB_OPCIONES: '||SQLERRM);
  END crear;


  PROCEDURE actualizar(
    p_idopcion              IN  NUMBER,
    p_nombre                IN  VARCHAR2,
    p_descripcion           IN  VARCHAR2,
    p_idgrupo               IN  NUMBER,
    p_vista                 IN  VARCHAR2,
    p_idusuariomodificacion IN  NUMBER,
    p_IdTipoServicio        IN  NUMBER,
    p_idestado              IN  NUMBER
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    UPDATE APL_TB_OPCIONES
       SET nombre                = p_nombre,
           descripcion           = p_descripcion,
           idgrupo               = p_idgrupo,
           vista                 = p_vista,
           idusuariomodificacion = p_idusuariomodificacion,
           fechamodificacion     = SYSTIMESTAMP,
           idestado              = p_idestado,
           IdTipoServicio        = p_IdTipoServicio
     WHERE idopcion = p_idopcion;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20202,
        'No existe IDOPCION='||p_idopcion||' para actualizar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20203,
        'Error al actualizar APL_TB_OPCIONES: '||SQLERRM);
  END actualizar;


  PROCEDURE eliminar(
    p_idopcion IN NUMBER
  ) IS
    v_rows PLS_INTEGER;
  BEGIN
    DELETE FROM APL_TB_OPCIONES
     WHERE idopcion = p_idopcion;

    v_rows := SQL%ROWCOUNT;
    IF v_rows = 0 THEN
      RAISE_APPLICATION_ERROR(-20204,
        'No existe IDOPCION='||p_idopcion||' para eliminar');
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20205,
        'Error al eliminar APL_TB_OPCIONES: '||SQLERRM);
  END eliminar;


  PROCEDURE listar(
    p_opciones_out          OUT SYS_REFCURSOR,
    p_nombreusuario         IN VARCHAR2 
  ) IS 
  BEGIN 
    OPEN p_opciones_out FOR
      SELECT
        o.idopcion,
        UPPER(o.nombre) AS nombre,
        o.descripcion,
        o.idgrupo,
        a.nombre AS Grupo,
        a.idetiqueta AS EtiquetaGrupo,
        o.vista,
        o.idusuariocreacion,
        o.fechacreacion,
        o.idusuariomodificacion,
        o.fechamodificacion,
        o.idestado,
        b.nombre AS Estado,
        b.idetiqueta AS EtiquetaEstado,
        o.IdTipoServicio,
        c.nombre AS TipoServicio,
        c.idetiqueta AS EtiquetaTipoServicio
      FROM APL_TB_OPCIONES o 
      INNER JOIN APL_TB_CATALOGO a ON o.idgrupo = a.idcatalogo
      INNER JOIN APL_TB_CATALOGO b ON o.idestado = b.idcatalogo
      INNER JOIN APL_TB_CATALOGO c ON o.idtiposervicio = c.idcatalogo
      ORDER BY o.idgrupo, o.idopcion ASC;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END listar;
  
  PROCEDURE obtener_por_id (
    p_idopcion IN NUMBER,
    p_opciones_out OUT SYS_REFCURSOR
  ) IS
  BEGIN
    OPEN p_opciones_out FOR
      SELECT *
        FROM APL_Tb_Opciones
       WHERE idopcion = p_idopcion;
  END obtener_por_id;


  PROCEDURE listarOpcionesAutorizadasInternas(
    p_idusuario    IN  NUMBER,
    p_opciones_out OUT SYS_REFCURSOR
  ) IS
  BEGIN
    OPEN p_opciones_out FOR
      SELECT
        o.idopcion,
        UPPER(o.nombre) AS nombre,
        o.descripcion,
        o.idgrupo,
        a.nombre AS Grupo,
        a.idetiqueta AS EtiquetaGrupo,
        o.vista,
        o.idusuariocreacion,
        o.fechacreacion,
        o.idusuariomodificacion,
        o.fechamodificacion,
        o.idestado,
        b.nombre AS Estado,
        b.idetiqueta AS EtiquetaEstado,
        o.IdTipoServicio,
        c.nombre AS TipoServicio,
        c.idetiqueta AS EtiquetaTipoServicio
      FROM APL_TB_OPCIONES o 
      INNER JOIN APL_TB_CATALOGO a ON o.idgrupo = a.idcatalogo
      INNER JOIN APL_TB_CATALOGO b ON o.idestado = b.idcatalogo
      INNER JOIN APL_TB_CATALOGO c ON o.idtiposervicio = c.idcatalogo
      ORDER BY o.idgrupo, o.idopcion ASC;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20207,
        'Error en listarOpcionesAutorizadasInternas: ' || SQLERRM);
  END listarOpcionesAutorizadasInternas;   


  PROCEDURE listarOpcionesAutorizadasCorporativa(
    p_idusuario     IN  NUMBER,
    p_idopcionlista IN  CLOB,
    p_opciones_out  OUT SYS_REFCURSOR
  ) IS
  BEGIN
     
    OPEN p_opciones_out FOR
      SELECT
        o.idopcion,
        UPPER(o.nombre) AS nombre,
        o.descripcion,
        o.idgrupo,
        a.nombre AS Grupo,
        a.idetiqueta AS EtiquetaGrupo,
        o.vista,
        o.idusuariocreacion,
        o.fechacreacion,
        o.idusuariomodificacion,
        o.fechamodificacion,
        o.idestado,
        b.nombre AS Estado,
        b.idetiqueta AS EtiquetaEstado,
        o.IdTipoServicio,
        c.nombre AS TipoServicio,
        c.idetiqueta AS EtiquetaTipoServicio
      FROM APL_TB_OPCIONES o 
      INNER JOIN APL_TB_CATALOGO a ON o.idgrupo = a.idcatalogo
      INNER JOIN APL_TB_CATALOGO b ON o.idestado = b.idcatalogo
      INNER JOIN APL_TB_CATALOGO c ON o.idtiposervicio = c.idcatalogo
              JOIN (
        SELECT jt.idopcion
        FROM JSON_TABLE(
               p_idopcionlista, '$[*]'
               COLUMNS ( idopcion NUMBER PATH '$.idopcion' )
             ) jt
      ) d ON o.idopcion = d.idopcion
      ORDER BY o.idgrupo, o.idopcion ASC;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE_APPLICATION_ERROR(-20208,
        'Error en listarOpcionesAutorizadasCorporativa: ' || SQLERRM);
  END listarOpcionesAutorizadasCorporativa;

END APL_PKG_OPCIONES;