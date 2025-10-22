CREATE TABLE APL_Tb_Catalogo (
  IDCATALOGO            NUMBER(10) GENERATED ALWAYS AS IDENTITY NOT NULL,
  NOMBRE                VARCHAR2(150 CHAR)  NOT NULL,
  ADICIONAL             VARCHAR2(300 CHAR),
  ABREVIATURA           CHAR(10 CHAR),
  IDCATALOGOTIPO        NUMBER(10)          NOT NULL,
  IDUSUARIOCREACION     NUMBER(10)          NOT NULL,
  FECHACREACION         DATE                NOT NULL,
  IDUSUARIOMODIFICACION NUMBER(10),
  FECHAMODIFICACION     DATE,
  IDESTADO              NUMBER(10)          NOT NULL,
  IDETIQUETA            VARCHAR2(30 CHAR),
  CONSTRAINT PK_APL_TB_CATALOGO
    PRIMARY KEY (IDCATALOGO),
  CONSTRAINT FK_APL_TB_CATALOGOTIPO
    FOREIGN KEY (IDCATALOGOTIPO)
    REFERENCES APL_TB_CATALOGOTIPO (IDCATALOGOTIPO)
);

=======================INSERT===============================

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Natural', 'N', 'PN', 1, 1, TO_DATE('2022-08-08 11:09:20', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'PNATURAL');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Juridica', 'J', 'PJ', 1, 1, TO_DATE('2022-08-08 11:09:20', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'PJURIDICA');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Cedula', 'C', 'CED', 2, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'CEDULA');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Ruc', 'R', 'RUC', 2, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'RUC');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Pasaporte', 'P', 'PAS', 2, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'PASAPORTE');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Masculino', 'M', 'MAS', 3, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'MASCULINO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Femenino', 'F', 'FEM', 3, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'FEMENINO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('No Aplica', 'N', 'N/P', 3, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'NOSEXO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('No Aplica', 'N', 'N/P', 4, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'SINTITPROFESIONAL');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('No Aplica', 'N', 'N/P', 5, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'SINTITPOSTGRADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Inactivo', 'I', 'IN', 6, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'ESTADOINACTIVO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Activo', 'A', 'AC', 6, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'ESTADOACTIVO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Anulado', 'N', 'AN', 6, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'ESTADOANULADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Eliminado', 'E', 'EL', 6, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'ESTADOELIMINADO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('NoAplica', 'N', 'N/P', 7, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'SECNOAPLICA');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Secuencia 3 Digitos', '000', 'Sec3D', 7, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'SECENTERO3');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Secuencia 5 Digitos', '00000', 'Sec5D', 7, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'SECENTERO5');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Principal', 'P', 'Prin', 8, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'DIRPRINCIPAL');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Oficina', 'O', 'Ofi', 8, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'DIROFICINA');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Otra Adicional', 'A', 'OA', 8, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'DIROTRA');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Configuracion', 'fas fa-cog', '', 9, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'GRCONFIGURACION');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Registros', 'far fa-address-card', '', 9, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'GRREGISTROS');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Seguridad', 'fas fa-user', '', 9, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'GRSEGURIDAD');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo,IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion,IdEstado, IdEtiqueta) 
VALUES ('Consultas', 'fas fa-desktop', '', 9, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), NULL,12, 'GRCONSULTAS');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Información Cuenta', 'fas fa-user', 'CTA', 9, 1, TO_DATE('2022-09-22 12:40:46', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'GRADMINCUENTA');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Procesos Solicitud', 'fas fa-paper-plane', '.', 9, 1, TO_DATE('2023-01-24 12:31:38', 'YYYY-MM-DD HH24:MI:SS'), 1, TO_DATE('2023-04-11 14:21:17', 'YYYY-MM-DD HH24:MI:SS'), 12, 'GRPROCESOS');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Procesos Respuesta', 'fas fa-reply', '.', 9, 1, TO_DATE('2023-02-10 13:00:45', 'YYYY-MM-DD HH24:MI:SS'), 1, TO_DATE('2023-04-11 14:19:19', 'YYYY-MM-DD HH24:MI:SS'), 12, 'GRPROCESOR');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Referencias Bancarias', 'SERVVEN', 'URB', 11, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), 1, TO_DATE('2022-11-21 12:01:01', 'YYYY-MM-DD HH24:MI:SS'), 12, 'TCREFERBANCOS');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Administración y Configuración Sistema', 'SERVSYS', 'ADMS', 11, 1, TO_DATE('2022-08-08 11:10:54', 'YYYY-MM-DD HH24:MI:SS'), 1, TO_DATE('2022-11-21 12:02:49', 'YYYY-MM-DD HH24:MI:SS'), 12, 'TCADMINSYSTEM');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Administración de Cuenta', 'SERVGEN', 'ADC', 11, 1, TO_DATE('2022-09-20 13:51:48', 'YYYY-MM-DD HH24:MI:SS'), 1, TO_DATE('2022-11-21 12:03:13', 'YYYY-MM-DD HH24:MI:SS'), 12, 'TCADMINCUENTA');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Administrador de Usuarios', 'SERVSEG', 'ADU', 11, 1, TO_DATE('2022-11-15 13:18:49', 'YYYY-MM-DD HH24:MI:SS'), 1, TO_DATE('2022-11-21 12:03:54', 'YYYY-MM-DD HH24:MI:SS'), 12, 'TCADMINUSUARIO');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Funcionario Principal', '.', 'FPRI', 12, 1, TO_DATE('2022-11-15 13:20:47', 'YYYY-MM-DD HH24:MI:SS'), 1, TO_DATE('2022-11-15 13:21:24', 'YYYY-MM-DD HH24:MI:SS'), 12, 'TFFUNPRINCIPAL');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Funcionario Normal', ' ', 'FNOR', 12, 1, TO_DATE('2022-08-09 16:04:03', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'TFFUNNORMAL');

INSERT INTO APL_TB_CATALOGO (Nombre, Adicional, Abreviatura, IdCatalogoTipo, IdUsuarioCreacion, FechaCreacion, IdUsuarioModificacion, FechaModificacion, IdEstado, IdEtiqueta) 
VALUES ('Funcionario Administrador', ' ', 'FADM', 12, 1, TO_DATE('2022-08-09 16:04:03', 'YYYY-MM-DD HH24:MI:SS'), NULL, NULL, 12, 'TFFUNADMINI');
