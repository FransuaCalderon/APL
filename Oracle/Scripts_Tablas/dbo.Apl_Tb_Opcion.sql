-- Opcional: establece el esquema actual
-- ALTER SESSION SET CURRENT_SCHEMA = YOUR_SCHEMA;

CREATE TABLE APL_TB_OPCION (
  IDOPCION               NUMBER(10) GENERATED ALWAYS AS IDENTITY NOT NULL,
  NOMBRE                 VARCHAR2(100 CHAR)  NOT NULL,
  DESCRIPCION            VARCHAR2(250 CHAR)  NOT NULL,
  IDGRUPO                NUMBER(10)          NOT NULL,
  VISTA                  VARCHAR2(150 CHAR)  NOT NULL,
  IDUSUARIOCREACION      NUMBER(10)          NOT NULL,
  FECHACREACION          TIMESTAMP(7)        NOT NULL,  -- datetime2(7) → TIMESTAMP(7)
  IDUSUARIOMODIFICACION  NUMBER(10),
  FECHAMODIFICACION      TIMESTAMP(7),
  IDESTADO               NUMBER(10)          NOT NULL,
  CONSTRAINT PK_APL_TB_OPCION
    PRIMARY KEY (IDOPCION)
);

=================================INSERT====================================
-- 1
INSERT INTO APL_TB_OPCION (
  NOMBRE,
  DESCRIPCION,
  IDGRUPO,
  VISTA,
  IDUSUARIOCREACION,
  FECHACREACION,
  IDUSUARIOMODIFICACION,
  FECHAMODIFICACION,
  IDESTADO
)
VALUES (
  'Gestión de Usuarios',
  'Permite administrar usuarios del sistema',
  1,
  'usuarios/gestion',
  1,
  SYSTIMESTAMP,
  NULL,
  NULL,
  1
);

-- 2
INSERT INTO APL_TB_OPCION (
  NOMBRE,
  DESCRIPCION,
  IDGRUPO,
  VISTA,
  IDUSUARIOCREACION,
  FECHACREACION,
  IDUSUARIOMODIFICACION,
  FECHAMODIFICACION,
  IDESTADO
)
VALUES (
  'Reportes Generales',
  'Acceso a reportes de actividad y métricas',
  2,
  'reportes/generales',
  1,
  SYSTIMESTAMP,
  NULL,
  NULL,
  1
);

-- 3
INSERT INTO APL_TB_OPCION (
  NOMBRE,
  DESCRIPCION,
  IDGRUPO,
  VISTA,
  IDUSUARIOCREACION,
  FECHACREACION,
  IDUSUARIOMODIFICACION,
  FECHAMODIFICACION,
  IDESTADO
)
VALUES (
  'Configuraciones Internas',
  'Opciones de ajuste para administradores del sistema',
  3,
  'configuracion/interna',
  2,
  SYSTIMESTAMP,
  NULL,
  NULL,
  0
);


