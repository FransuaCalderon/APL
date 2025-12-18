CREATE TABLE Apl_Tb_PromocionAcuerdo (
    IdPromocionAcuerdo      NUMBER(18,0)    GENERATED ALWAYS AS IDENTITY NOT NULL,
    IdPromocion             NUMBER(18,0)    NOT NULL,
    IdAcuerdo               NUMBER(18,0)    NOT NULL,
    PorcentajeDescuento     NUMBER(18,2)    NOT NULL,
    ValorComprometido       NUMBER(18,2)    NOT NULL,
    EstadoRegistro          NUMBER(10)      NOT NULL,
    
    CONSTRAINT PK_Apl_Tb_PromocionesAcuerdos PRIMARY KEY (IdPromocionAcuerdo)
);

-- Foreign Keys
ALTER TABLE Apl_Tb_PromocionAcuerdo
ADD CONSTRAINT FK_PromocAcuerdos_Acuerdos
    FOREIGN KEY (IdAcuerdo)
    REFERENCES Apl_Tb_Acuerdo (IdAcuerdo);

ALTER TABLE Apl_Tb_PromocionAcuerdo
ADD CONSTRAINT FK_PromocAcuerdos_Promociones
    FOREIGN KEY (IdPromocion)
    REFERENCES Apl_Tb_Promocion (IdPromocion);
	
	
----------------INSERTS----------------------------------------------------------------------------------------------
INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (1, 65, 15.00, 5000.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (1, 66, 10.00, 3500.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (2, 81, 25.00, 8000.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (3, 65, 12.50, 4200.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (4, 66, 20.00, 6500.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (5, 81, 30.00, 10000.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (6, 65, 18.00, 5500.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (7, 66, 22.00, 7200.00, 0);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (8, 81, 8.50, 2800.00, 1);

INSERT INTO Apl_Tb_PromocionAcuerdo (IdPromocion, IdAcuerdo, PorcentajeDescuento, ValorComprometido, EstadoRegistro)
VALUES (10, 65, 35.00, 12000.00, 1);

-- Confirmar transacción
COMMIT;