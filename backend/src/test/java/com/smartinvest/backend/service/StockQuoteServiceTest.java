package com.smartinvest.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.smartinvest.backend.dto.StockSummaryResponse;
import com.smartinvest.backend.entity.Stock;
import com.smartinvest.backend.repository.StockRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StockQuoteServiceTest {
    @Mock
    private StockRepository stockRepository;

    @Mock
    private TwelveDataMarketQuoteClient quoteClient;

    @Test
    void reportsUnconfiguredProviderWithoutInventingAQuote() {
        StockQuoteService service = new StockQuoteService(stockRepository, quoteClient, "");

        StockSummaryResponse result = service.withQuotes(List.of(
                new StockSummaryResponse("INFY", "Infosys Limited", "NSE", true, null)))
                .getFirst();

        assertEquals("UNAVAILABLE", result.quote().status());
        assertNull(result.quote().lastPrice());
        assertEquals("Twelve Data API key is not configured.", result.quote().message());
        verify(quoteClient, never()).fetch(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void includesEndOfDayQuoteForNseStock() {
        Stock stock = new Stock("INFY", "Infosys Limited", "NSE", true);
        when(stockRepository.findAllById(List.of("INFY"))).thenReturn(List.of(stock));
        when(quoteClient.fetch(List.of("INFY"))).thenReturn(Map.of(
                "INFY", new TwelveDataMarketQuoteClient.Quote(
                        new BigDecimal("1425.75"), "INR", LocalDate.parse("2026-11-09"))));
        StockQuoteService service = new StockQuoteService(stockRepository, quoteClient, "configured-api-key");

        StockSummaryResponse result = service.withQuotes(List.of(
                new StockSummaryResponse("INFY", "Infosys Limited", "NSE", true, null)))
                .getFirst();

        assertEquals("AVAILABLE", result.quote().status());
        assertEquals(new BigDecimal("1425.75"), result.quote().lastPrice());
        assertEquals("INR", result.quote().currency());
        assertEquals("TWELVE_DATA", result.quote().source());
        assertEquals(LocalDate.parse("2026-11-09"), result.quote().marketDate());
    }

    @Test
    void marksNonNseStocksUnavailableWithoutCallingTheProvider() {
        Stock stock = new Stock("AAPL", "Apple Inc.", "NASDAQ", true);
        when(stockRepository.findAllById(List.of("AAPL"))).thenReturn(List.of(stock));
        StockQuoteService service = new StockQuoteService(stockRepository, quoteClient, "configured-api-key");

        StockSummaryResponse result = service.withQuotes(List.of(
                new StockSummaryResponse("AAPL", "Apple Inc.", "NASDAQ", true, null)))
                .getFirst();

        assertEquals("UNAVAILABLE", result.quote().status());
        assertEquals("Exchange instrument mapping is unavailable.", result.quote().message());
        verify(quoteClient, never()).fetch(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void reportsProviderMissWithoutReturningAPlaceholderPrice() {
        Stock stock = new Stock("INFY", "Infosys Limited", "NSE", true);
        when(stockRepository.findAllById(List.of("INFY"))).thenReturn(List.of(stock));
        when(quoteClient.fetch(List.of("INFY"))).thenReturn(Map.of());
        StockQuoteService service = new StockQuoteService(stockRepository, quoteClient, "configured-api-key");

        StockSummaryResponse result = service.withQuotes(List.of(
                new StockSummaryResponse("INFY", "Infosys Limited", "NSE", true, null)))
                .getFirst();

        assertEquals("UNAVAILABLE", result.quote().status());
        assertNull(result.quote().lastPrice());
        assertEquals("End-of-day quote could not be retrieved from Twelve Data.", result.quote().message());
    }
}
