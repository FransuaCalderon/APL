create or replace PROCEDURE APL_SP_GRUPO_SELECT_ARTEFACTA_PROMOCIONES (
    p_rc_canal        OUT SYS_REFCURSOR,
    p_rc_grupo        OUT SYS_REFCURSOR,
    p_rc_almacen      OUT SYS_REFCURSOR,
    p_rc_tipocliente  OUT SYS_REFCURSOR,
    p_rc_mediopago    OUT SYS_REFCURSOR
)
IS
    c_cod_todos CONSTANT VARCHAR2(50) := 'ALL';
BEGIN
    /* =========================
       1) CANAL
       ========================= */
    OPEN p_rc_canal FOR
        SELECT codigo, nombre
         FROM (
             SELECT 'TODOS' AS codigo, 'Todos' AS nombre, 0 AS orden FROM dual
             UNION ALL
             SELECT codigo, nombre, 1 AS orden
             FROM apl_tb_artefacta_canal
             WHERE codigo IS NOT NULL AND nombre IS NOT NULL
         )
        ORDER BY orden, nombre;

    /* =========================
       2) ALMACÉN
       ========================= */
    OPEN p_rc_almacen FOR
         SELECT codigo, nombre
         FROM (
             SELECT 'TODOS' AS codigo, 'Todos' AS nombre, 0 AS orden FROM dual
             UNION ALL
             SELECT codigo, nombre, 1 AS orden
             FROM apl_tb_artefacta_almacen
             WHERE codigo IS NOT NULL AND nombre IS NOT NULL
         )
         ORDER BY orden, nombre;

    /* =========================
       3) GRUPO (opcionalmente por almacén)
       ========================= */
    OPEN p_rc_grupo FOR
        SELECT codigo, nombre
         FROM (
             SELECT 'TODOS' AS codigo, 'Todos' AS nombre, 0 AS orden FROM dual
             UNION ALL
             SELECT codigo, nombre, 1 AS orden
             FROM apl_tb_artefacta_grupoalmacen
             WHERE codigo IS NOT NULL AND nombre IS NOT NULL
         )
         ORDER BY orden, nombre;

    /* =========================
       4) TIPO DE CLIENTE
       ========================= */
    OPEN p_rc_tipocliente FOR
       SELECT codigo, nombre
         FROM (
             SELECT 'TODOS' AS codigo, 'Todos' AS nombre, 0 AS orden FROM dual
             UNION ALL
             SELECT codigo, nombre, 1 AS orden
             FROM apl_tb_artefacta_tipocliente
             WHERE codigo IS NOT NULL AND nombre IS NOT NULL
         )
         ORDER BY orden, nombre;

    /* =========================
       5) MEDIO DE PAGO
       ========================= */
    OPEN p_rc_mediopago FOR
         SELECT codigo, descripcion
         FROM (
             SELECT 'TODOS' AS codigo, 'Todos' AS descripcion, 0 AS orden FROM dual
             UNION ALL
             SELECT codigo, descripcion, 1 AS orden
             FROM apl_tb_artefacta_mediopago
             WHERE codigo IS NOT NULL AND descripcion IS NOT NULL
         )
         ORDER BY orden, descripcion;

EXCEPTION
    WHEN OTHERS THEN
        -- enfoque defensivo: propaga error con contexto
        RAISE_APPLICATION_ERROR(
            -20001,
            'Error en select_artefacta: ' || SQLERRM
        );
END APL_SP_GRUPO_SELECT_ARTEFACTA_PROMOCIONES;