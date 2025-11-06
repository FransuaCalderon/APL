CREATE OR REPLACE PACKAGE APL_PKG_LOGS_SISTEMA AS
  /*
   * Paquete para gestión de logs del sistema
   * Autor: Jose Diaz
   * Fecha: 05/11/2025
   */
  
  -- Procedimiento para registrar logs en el sistema
  PROCEDURE REGISTRAR_LOG(
    p_iduser              IN VARCHAR2,
    p_idopcion            IN NUMBER,
    p_idcontrolinterfaz   IN NUMBER DEFAULT NULL,
    p_idevento            IN NUMBER,
    p_entidad             IN NUMBER DEFAULT NULL,
    p_identidad           IN NUMBER DEFAULT NULL,
    p_idtipoproceso       IN NUMBER DEFAULT NULL,
<<<<<<< Updated upstream
    p_datos               IN CLOB DEFAULT NULL
=======
	p_datos 			  IN CLOB DEFAULT NULL
>>>>>>> Stashed changes
  );
  
END APL_PKG_LOGS_SISTEMA;

----------------------------------------------------------BODY
CREATE OR REPLACE PACKAGE BODY APL_PKG_LOGS_SISTEMA AS

  PROCEDURE REGISTRAR_LOG(
    p_iduser              IN VARCHAR2,
    p_idopcion            IN NUMBER,
    p_idcontrolinterfaz   IN NUMBER DEFAULT NULL,
    p_idevento            IN NUMBER,
    p_entidad             IN NUMBER DEFAULT NULL,
    p_identidad           IN NUMBER DEFAULT NULL,
    p_idtipoproceso       IN NUMBER DEFAULT NULL,
<<<<<<< Updated upstream
    p_datos               IN CLOB DEFAULT NULL
=======
    p_datos 			  IN CLOB DEFAULT NULL
>>>>>>> Stashed changes
  ) AS
  BEGIN
    
    -- Insertar el registro de log
    INSERT INTO APL_TB_LOG (
      FECHAHORATRX,
      IDUSER,
      IDOPCION,
      IDCONTROLINTERFAZ,
      IDEVENTO,
      ENTIDAD,
      IDENTIDAD,
      IDTIPOPROCESO,
      DATOS
    ) VALUES (
      SYSTIMESTAMP,
      p_iduser,
      p_idopcion,
      p_idcontrolinterfaz,
      p_idevento,
      p_entidad,
      p_identidad,
      p_idtipoproceso,
      p_datos
    );
    
    COMMIT;
    
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20001, 'Error al registrar log: ' || SQLERRM);
  END REGISTRAR_LOG;

END APL_PKG_LOGS_SISTEMA;