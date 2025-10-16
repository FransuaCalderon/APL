-- Opcional: establece el esquema actual
-- ALTER SESSION SET CURRENT_SCHEMA = YOUR_SCHEMA;

CREATE TABLE APL_Tb_Opciones  (
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
  IDCATALOGOTIPOCLIENTE  NUMBER(10)          NOT NULL,
  CONSTRAINT PK_APL_TB_OPCION
    PRIMARY KEY (IDOPCION)
);

=================================INSERT====================================
INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdCatalogoTipoCliente) 
VALUES ('Config. Tipo Catalogo', '.', 21, '/Configuracion/TipoCatalogo', 1, TO_DATE('2022-08-08 17:17:58', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 28);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdCatalogoTipoCliente) 
VALUES ('Config. Catalogo', '.', 21, '/Configuracion/Catalogos', 1, TO_DATE('2022-08-08 17:17:58', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 28);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdCatalogoTipoCliente) 
VALUES ('Config. Pais', '.', 21, '/Configuracion/Pais', 1, TO_DATE('2022-08-08 17:17:58', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 28);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdCatalogoTipoCliente) 
VALUES ('Config. Estruct.Pais', '.', 21, '/Configuracion/EstructuraPais', 1, TO_DATE('2022-08-08 17:17:58', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 28);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdCatalogoTipoCliente) 
VALUES ('Config. Div.Politica', '.', 21, '/Configuracion/DivisionPolitica', 1, TO_DATE('2022-08-08 17:17:58', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 28);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdCatalogoTipoCliente) 
VALUES ('Config. Opciones', '.', 21, '/Configuracion/Opciones', 1, TO_DATE('2022-08-08 17:17:58', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 28);
