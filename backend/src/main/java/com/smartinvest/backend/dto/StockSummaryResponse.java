package com.smartinvest.backend.dto;

import com.smartinvest.backend.entity.Stock;

public record StockSummaryResponse(
        String symbol,
        String companyName,
        String exchangeCode,
        boolean active,
        StockQuoteResponse quote) {
    public static StockSummaryResponse from(Stock stock) {
        return new StockSummaryResponse(stock.getSymbol(), stock.getCompanyName(),
                stock.getExchangeCode(), stock.isActive(), null);
    }

    public StockSummaryResponse withQuote(StockQuoteResponse stockQuote) {
        return new StockSummaryResponse(symbol, companyName, exchangeCode, active, stockQuote);
    }
}
