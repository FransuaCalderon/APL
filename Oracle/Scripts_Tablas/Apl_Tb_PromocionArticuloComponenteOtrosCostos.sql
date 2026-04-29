CREATE TABLE Apl_Tb_PromocionArticuloComponenteOtrosCostos (
    IdPromocionArticuloComponenteOtrosCostos   NUMBER(18,0)    GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER),
    IdPromocionArticuloComponente              NUMBER(18,0)    NOT NULL,
    CodigoParametro                            NUMBER(10,0)    NOT NULL,
    Costo                                      NUMBER(18,2)    DEFAULT 0,
    EstadoRegistro                             NUMBER(10,0)    DEFAULT 1 NOT NULL,

    -- CONSTRAINT: LLAVE PRIMARIA
    CONSTRAINT PK_PromoArtCompOtrosCostos
        PRIMARY KEY (IdPromocionArticuloComponenteOtrosCostos),

    -- CONSTRAINT: FK -> Apl_Tb_PromocionArticuloComponente
    CONSTRAINT FK_PromoArtCompOtrosCostos_Comp
        FOREIGN KEY (IdPromocionArticuloComponente)
        REFERENCES Apl_Tb_PromocionArticuloComponente (IdPromocionArticuloComponente)
        ON DELETE CASCADE
);

-- ÍNDICES
CREATE INDEX IDX_PromoArtCompOtrosCostos_Comp
    ON Apl_Tb_PromocionArticuloComponenteOtrosCostos (IdPromocionArticuloComponente);

CREATE INDEX IDX_PromoArtCompOtrosCostos_Param
    ON Apl_Tb_PromocionArticuloComponenteOtrosCostos (CodigoParametro);