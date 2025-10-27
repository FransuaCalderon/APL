create or replace PACKAGE APL_PKG_LOGS_SISTEMA AS
    
    -- Procedimiento principal para registrar logs
    PROCEDURE PR_REGISTRAR_LOG(
        P_IDUSER IN APL_TB_LOG.IDUSER%TYPE,
        P_IDOPCION IN APL_TB_LOG.IDOPCION%TYPE,
        P_IDEVENTO IN APL_TB_LOG.IDEVENTO%TYPE,
        P_DATOS IN APL_TB_LOG.DATOS%TYPE
    );
    
    -- Procedimiento sobrecargado con nombre de opción
    PROCEDURE PR_REGISTRAR_LOG(
        P_IDUSER IN APL_TB_LOG.IDUSER%TYPE,
        P_NOMBRE_OPCION IN APL_TB_OPCIONES.NOMBRE%TYPE,
        P_IDEVENTO IN APL_TB_LOG.IDEVENTO%TYPE,
        P_DATOS IN APL_TB_LOG.DATOS%TYPE
    );
    
    -- Procedimiento para obtener logs por usuario
    PROCEDURE PR_OBTENER_LOGS_USUARIO(
        P_IDUSER IN APL_TB_LOG.IDUSER%TYPE,
        P_FECHA_INICIO IN DATE DEFAULT NULL,
        P_FECHA_FIN IN DATE DEFAULT NULL,
        P_CURSOR OUT SYS_REFCURSOR
    );
    
    -- Procedimiento para obtener logs por opción
    PROCEDURE PR_OBTENER_LOGS_OPCION(
        P_IDOPCION IN APL_TB_LOG.IDOPCION%TYPE,
        P_FECHA_INICIO IN DATE DEFAULT NULL,
        P_FECHA_FIN IN DATE DEFAULT NULL,
        P_CURSOR OUT SYS_REFCURSOR
    );
    
END APL_PKG_LOGS_SISTEMA;

----------------------------------------------------------BODY
CREATE OR REPLACE PACKAGE BODY APL_PKG_LOGS_SISTEMA AS
    
    -- =====================================================
    -- Procedimiento para registrar log con IDOPCION
    -- =====================================================
    PROCEDURE PR_REGISTRAR_LOG(
        P_IDUSER IN APL_TB_LOG.IDUSER%TYPE,
        P_IDOPCION IN APL_TB_LOG.IDOPCION%TYPE,
        P_IDEVENTO IN APL_TB_LOG.IDEVENTO%TYPE,
        P_DATOS IN APL_TB_LOG.DATOS%TYPE
    ) AS
        V_IDLOG APL_TB_LOG.IDLOG%TYPE;
        V_EXISTE_OPCION NUMBER;
    BEGIN
        -- Validar que la opción exista
        SELECT COUNT(*)
        INTO V_EXISTE_OPCION
        FROM APL_TB_OPCIONES
        WHERE IDOPCION = P_IDOPCION;
        
        IF V_EXISTE_OPCION = 0 THEN
            RAISE_APPLICATION_ERROR(-20001, 'La opción con ID ' || P_IDOPCION || ' no existe');
        END IF;
        
        -- Insertar el registro de log (ID se genera automáticamente con trigger o identity)
        INSERT INTO APL_TB_LOG (
            IDLOG,
            FECHAHORATRX,
            IDUSER,
            IDOPCION,
            IDEVENTO,
            DATOS
        ) VALUES (
            V_IDLOG,
            SYSTIMESTAMP,
            P_IDUSER,
            P_IDOPCION,
            P_IDEVENTO,
            P_DATOS
        );
        
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE_APPLICATION_ERROR(-20002, 'Error al registrar log: ' || SQLERRM);
    END PR_REGISTRAR_LOG;
    
    -- =====================================================
    -- Procedimiento para registrar log con nombre de opción
    -- =====================================================
    PROCEDURE PR_REGISTRAR_LOG(
        P_IDUSER IN APL_TB_LOG.IDUSER%TYPE,
        P_NOMBRE_OPCION IN APL_TB_OPCIONES.NOMBRE%TYPE,
        P_IDEVENTO IN APL_TB_LOG.IDEVENTO%TYPE,
        P_DATOS IN APL_TB_LOG.DATOS%TYPE
    ) AS
        V_IDOPCION APL_TB_OPCIONES.IDOPCION%TYPE;
    BEGIN
        -- Obtener el ID de la opción por su nombre
        SELECT IDOPCION
        INTO V_IDOPCION
        FROM APL_TB_OPCIONES
        WHERE UPPER(NOMBRE) = UPPER(P_NOMBRE_OPCION)
        AND ROWNUM = 1;
        
        -- Llamar al procedimiento principal
        PR_REGISTRAR_LOG(
            P_IDUSER => P_IDUSER,
            P_IDOPCION => V_IDOPCION,
            P_IDEVENTO => P_IDEVENTO,
            P_DATOS => P_DATOS
        );
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20003, 'No se encontró la opción: ' || P_NOMBRE_OPCION);
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20004, 'Error al registrar log: ' || SQLERRM);
    END PR_REGISTRAR_LOG;
    
    -- =====================================================
    -- Procedimiento para obtener logs por usuario
    -- =====================================================
    PROCEDURE PR_OBTENER_LOGS_USUARIO(
        P_IDUSER IN APL_TB_LOG.IDUSER%TYPE,
        P_FECHA_INICIO IN DATE DEFAULT NULL,
        P_FECHA_FIN IN DATE DEFAULT NULL,
        P_CURSOR OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN P_CURSOR FOR
            SELECT 
                L.IDLOG,
                L.FECHAHORATRX,
                L.IDUSER,
                L.IDOPCION,
                O.NOMBRE AS NOMBRE_OPCION,
                O.DESCRIPCION AS DESCRIPCION_OPCION,
                L.IDEVENTO,
                L.DATOS
            FROM APL_TB_LOG L
            INNER JOIN APL_TB_OPCIONES O ON L.IDOPCION = O.IDOPCION
            WHERE L.IDUSER = P_IDUSER
            AND (P_FECHA_INICIO IS NULL OR L.FECHAHORATRX >= P_FECHA_INICIO)
            AND (P_FECHA_FIN IS NULL OR L.FECHAHORATRX <= P_FECHA_FIN)
            ORDER BY L.FECHAHORATRX DESC;
    END PR_OBTENER_LOGS_USUARIO;
    
    -- =====================================================
    -- Procedimiento para obtener logs por opción
    -- =====================================================
    PROCEDURE PR_OBTENER_LOGS_OPCION(
        P_IDOPCION IN APL_TB_LOG.IDOPCION%TYPE,
        P_FECHA_INICIO IN DATE DEFAULT NULL,
        P_FECHA_FIN IN DATE DEFAULT NULL,
        P_CURSOR OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN P_CURSOR FOR
            SELECT 
                L.IDLOG,
                L.FECHAHORATRX,
                L.IDUSER,
                L.IDOPCION,
                O.NOMBRE AS NOMBRE_OPCION,
                O.DESCRIPCION AS DESCRIPCION_OPCION,
                L.IDEVENTO,
                L.DATOS
            FROM APL_TB_LOG L
            INNER JOIN APL_TB_OPCIONES O ON L.IDOPCION = O.IDOPCION
            WHERE L.IDOPCION = P_IDOPCION
            AND (P_FECHA_INICIO IS NULL OR L.FECHAHORATRX >= P_FECHA_INICIO)
            AND (P_FECHA_FIN IS NULL OR L.FECHAHORATRX <= P_FECHA_FIN)
            ORDER BY L.FECHAHORATRX DESC;
    END PR_OBTENER_LOGS_OPCION;
    
END APL_PKG_LOGS_SISTEMA;


