

CREATE TABLE APL_TB_ARTEFACTA_PROVEEDOR (
  CODIGO            VARCHAR2(50)    NOT NULL,
  IDENTIFICACION    VARCHAR2(20 CHAR),
  NOMBRE            VARCHAR2(150 CHAR),
  NOMBRECONTACTO1   VARCHAR2(100 CHAR),
  MAILCONTACTO1     VARCHAR2(150 CHAR),
  NOMBRECONTACTO2   VARCHAR2(100 CHAR),
  MAILCONTACTO2     VARCHAR2(150 CHAR),
  NOMBRECONTACTO3   VARCHAR2(100 CHAR),
  MAILCONTACTO3     VARCHAR2(150 CHAR),
  NOMBRECONTACTO4   VARCHAR2(100 CHAR),
  MAILCONTACTO4     VARCHAR2(150 CHAR),
  CONSTRAINT PK_APL_TB_ARTEFACTA_PROVEEDOR PRIMARY KEY (CODIGO)
);

==================================INSERTS

-- Insert 1: Proveedor con 4 contactos
INSERT INTO APL_TB_ARTEFACTA_PROVEEDOR (
    CODIGO,
    IDENTIFICACION,
    NOMBRE,
    NOMBRECONTACTO1,
    MAILCONTACTO1,
    NOMBRECONTACTO2,
    MAILCONTACTO2,
    NOMBRECONTACTO3,
    MAILCONTACTO3,
    NOMBRECONTACTO4,
    MAILCONTACTO4
) VALUES (
    'PROV001',
    '1790012345001',
    'Distribuidora El Éxito S.A.',
    'Carlos Mendoza',
    'cmendoza@elexito.com',
    'María López',
    'mlopez@elexito.com',
    'Juan Pérez',
    'jperez@elexito.com',
    'Ana García',
    'agarcia@elexito.com'
);

-- Insert 2: Proveedor con 2 contactos (los demás quedan NULL)
INSERT INTO APL_TB_ARTEFACTA_PROVEEDOR (
    CODIGO,
    IDENTIFICACION,
    NOMBRE,
    NOMBRECONTACTO1,
    MAILCONTACTO1,
    NOMBRECONTACTO2,
    MAILCONTACTO2
) VALUES (
    'PROV002',
    '1791234567001',
    'Importadora Global Cía. Ltda.',
    'Roberto Sánchez',
    'rsanchez@importglobal.com',
    'Laura Martínez',
    'lmartinez@importglobal.com'
);

COMMIT;