package com.smartinvest.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StockQuoteResponse(
        String status,
        BigDecimal lastPrice,
        String currency,
        LocalDate marketDate,
        String source,
        String message) {
    public static StockQuoteResponse available(BigDecimal lastPrice, String currency, LocalDate marketDate) {
        return new StockQuoteResponse("AVAILABLE", lastPrice, currency, marketDate, "TWELVE_DATA", null);
    }

    public static StockQuoteResponse unavailable(String message) {
        return new StockQuoteResponse("UNAVAILABLE", null, null, null, "TWELVE_DATA", message);
    }
}
