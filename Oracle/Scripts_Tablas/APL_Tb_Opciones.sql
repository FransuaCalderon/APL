CREATE TABLE APL_Tb_Opciones (
  IDOPCION               NUMBER(10) GENERATED ALWAYS AS IDENTITY ( START WITH 1 INCREMENT BY 1 NOCACHE ORDER) NOT NULL,
  NOMBRE                 VARCHAR2(100 CHAR)  NOT NULL,
  DESCRIPCION            VARCHAR2(250 CHAR)  NOT NULL,
  IDGRUPO                NUMBER(10)          NOT NULL,
  VISTA                  VARCHAR2(150 CHAR)  NOT NULL,
  IDUSUARIOCREACION      NUMBER(10)          NOT NULL,
  FECHACREACION          TIMESTAMP(7)        NOT NULL,
  IDUSUARIOMODIFICACION  NUMBER(10),
  FECHAMODIFICACION      TIMESTAMP(7),
  IDESTADO               NUMBER(10)          NOT NULL,
  IDTIPOSERVICIO         NUMBER(10)          NOT NULL,
  CONSTRAINT PK_APL_TB_OPCION
    PRIMARY KEY (IDOPCION)
);

=================================INSERT====================================
--id ->18

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Tipo Catalogo', '.', 11, '/CatalogoTipo/Index', 1, SYSDATE, NULL, NULL, 1, 18);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Catalogo', '.', 11, '/Catalogo/Index', 1, SYSDATE, NULL, NULL, 1, 18);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Opciones', '.', 11, '/Opciones/Index', 1, SYSDATE, NULL, NULL, 1, 18);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Empresas', '.', 11, '/Empresa/Index', 1, SYSDATE, NULL, NULL, 1, 18);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Usuarios', '.', 11, '/Usuario/Index', 1, SYSDATE, NULL, NULL, 1, 18);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Autorizaciones', '.', 11, '/Autorizacion/Index', 1, SYSDATE, NULL, NULL, 1, 18);


--id ->19

--Parametrizacion
INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Tipo Parametros', '.', 12, '/ParametroTipo/Index', 1, SYSDATE, NULL, NULL, 1, 19);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Parametros', '.', 12, '/Parametro/Index', 1, SYSDATE, NULL, NULL, 1, 19);

--Fondo
INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Creacion Fondo', '.', 13, '/Fondo/CrearFondo/', 1, SYSDATE, NULL, NULL, 1, 19);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Aprobacion de Fondo', '.', 13, '/Fondo/AprobarFondo', 1, SYSDATE, NULL, NULL, 1, 19);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Modificacion de Fondo', '.', 13, '/Fondo/ModificarFondo', 1, SYSDATE, NULL, NULL, 1, 19);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Inactivacion de Fondo', '.', 13, '/Fondo/InactivarFondo', 1, SYSDATE, NULL, NULL, 1, 19);

INSERT INTO APL_TB_OPCIONES (Nombre, Descripcion, IdGrupo, Vista, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdTipoServicio) 
VALUES ('Consulta de Fondo ', '.', 13, '/Fondo/ConsultarFondo', 1, SYSDATE, NULL, NULL, 1, 19);

















