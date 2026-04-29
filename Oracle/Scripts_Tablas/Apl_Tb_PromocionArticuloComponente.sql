CREATE TABLE Apl_Tb_PromocionArticuloComponente (
    IdPromocionArticuloComponente   NUMBER(18,0)        GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1 NOCACHE ORDER),
    IdPromocionArticulo             NUMBER(18,0)        NOT NULL,
    CodigoItem                      VARCHAR2(10 BYTE)   NOT NULL,
    Costo                           NUMBER(18,2)        DEFAULT 0,
    StockBodega                     NUMBER(10,0)        DEFAULT 0,
    StockTienda                     NUMBER(10,0)        DEFAULT 0,
    InventarioOptimo                NUMBER(10,0)        DEFAULT 0,
    ExcedenteUnidad                 NUMBER(10,0)        DEFAULT 0,
    ExcedenteValor                  NUMBER(18,2)        DEFAULT 0,
    M0Unidades                      NUMBER(10,0)        DEFAULT 0,
    M0Precio                        NUMBER(18,2)        DEFAULT 0,
    M1Unidades                      NUMBER(10,0)        DEFAULT 0,
    M1Precio                        NUMBER(18,2)        DEFAULT 0,
    M2Unidades                      NUMBER(10,0)        DEFAULT 0,
    M2Precio                        NUMBER(18,2)        DEFAULT 0,
    IgualarPrecio                   NUMBER(18,2)        DEFAULT 0,
    DiasAntiguedad                  NUMBER(10,0)        DEFAULT 0,
    MargenMinimoContado             NUMBER(18,2)        DEFAULT 0,
    MargenMinimoTarjetaCredito      NUMBER(18,2)        DEFAULT 0,
    MargenMinimoCredito             NUMBER(18,2)        DEFAULT 0,
    MargenMinimoIgualar             NUMBER(18,2)        DEFAULT 0,
    PrecioListaContado              NUMBER(18,2)        DEFAULT 0,
    PrecioListaCredito              NUMBER(18,2)        DEFAULT 0,
    EstadoRegistro                  NUMBER(10,0)        DEFAULT 1 NOT NULL,

    CONSTRAINT PK_PromocionArticuloComponente
        PRIMARY KEY (IdPromocionArticuloComponente),

    CONSTRAINT FK_PromoArtComp_PromoArt
        FOREIGN KEY (IdPromocionArticulo)
        REFERENCES Apl_Tb_PromocionArticulo (IdPromocionArticulo)
        ON DELETE CASCADE
);

-- ÍNDICES
CREATE INDEX IDX_PromoArtComp_IdPromoArt
    ON Apl_Tb_PromocionArticuloComponente (IdPromocionArticulo);

CREATE INDEX IDX_PromoArtComp_CodigoItem
    ON Apl_Tb_PromocionArticuloComponente (CodigoItem);