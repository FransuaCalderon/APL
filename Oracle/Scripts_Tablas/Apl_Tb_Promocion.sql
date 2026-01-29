
CREATE TABLE Apl_Tb_Promocion (
    IdPromocion             NUMBER(18,0)    GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER) NOT NULL,
    Descripcion             VARCHAR2(100)   NOT NULL,
    Motivo                  NUMBER(10)      NOT NULL,
    ClasePromocion          NUMBER(10)      NOT NULL,
    FechaHoraInicio         TIMESTAMP       NOT NULL,
    FechaHoraFin            TIMESTAMP       NOT NULL,
    MarcaRegalo             CHAR(1)         NOT NULL,
    EstadoRegistro          NUMBER(10)      NOT NULL,
    MarcaProcesoAprobacion  CHAR(1)         NOT NULL,
    NumeroLoteAprobacion    NUMBER(10)      NOT NULL,
	ArchivoSoporte          VARCHAR2(200)   NOT NULL,
    
    CONSTRAINT PK_Apl_Tb_Promociones PRIMARY KEY (IdPromocion)
);

-- =============================================
-- Inserción de 10 registros de ejemplo
-- =============================================

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Promoción Navidad 2025', 1, 1, TO_DATE('2025-12-20 08:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2025-12-25 23:59:59', 'YYYY-MM-DD HH24:MI:SS'), 'S', 1, 'S', 1001);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Liquidación Fin de Año', 2, 2, TO_DATE('2025-12-26 00:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2025-12-31 23:59:59', 'YYYY-MM-DD HH24:MI:SS'), 'N', 1, 'S', 1002);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Promoción Año Nuevo 2026', 1, 1, TO_DATE('2026-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2026-01-05 23:59:59', 'YYYY-MM-DD HH24:MI:SS'), 'S', 1, 'P', 1003);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Descuento Electrodomésticos', 3, 2, TO_DATE('2025-12-15 09:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2025-12-22 21:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'N', 1, 'S', 1004);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('2x1 en Ropa de Temporada', 4, 3, TO_DATE('2025-12-18 10:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2025-12-24 20:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'N', 1, 'S', 1005);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Combo Familiar Alimentos', 5, 4, TO_DATE('2025-12-20 06:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2025-12-31 22:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'S', 1, 'S', 1006);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Black Friday Extendido', 2, 1, TO_DATE('2025-11-28 00:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2025-12-05 23:59:59', 'YYYY-MM-DD HH24:MI:SS'), 'N', 0, 'S', 1007);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Promoción Día de Reyes', 1, 1, TO_DATE('2026-01-04 08:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2026-01-06 23:59:59', 'YYYY-MM-DD HH24:MI:SS'), 'S', 1, 'P', 1008);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Descuento Tecnología 30%', 3, 2, TO_DATE('2025-12-10 09:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2025-12-17 21:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'N', 0, 'S', 1009);

INSERT INTO Apl_Tb_Promocion (Descripcion, Motivo, ClasePromocion, FechaHoraInicio, FechaHoraFin, MarcaRegalo, EstadoRegistro, MarcaProcesoAprobacion, NumeroLoteAprobacion)
VALUES ('Ofertas de Inventario', 6, 5, TO_DATE('2026-01-10 07:00:00', 'YYYY-MM-DD HH24:MI:SS'), TO_DATE('2026-01-20 22:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'N', 1, 'N', 1010);

-- Confirmar transacción
COMMIT;