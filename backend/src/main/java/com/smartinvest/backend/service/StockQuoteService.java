package com.smartinvest.backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.smartinvest.backend.dto.StockQuoteResponse;
import com.smartinvest.backend.dto.StockSummaryResponse;
import com.smartinvest.backend.dto.WatchlistEntryResponse;
import com.smartinvest.backend.dto.WatchlistResponse;
import com.smartinvest.backend.entity.Stock;
import com.smartinvest.backend.repository.StockRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StockQuoteService {
    private final StockRepository stockRepository;
    private final TwelveDataMarketQuoteClient quoteClient;
    private final boolean apiKeyConfigured;

    public StockQuoteService(
            StockRepository stockRepository,
            TwelveDataMarketQuoteClient quoteClient,
            @Value("${twelvedata.api-key:}") String apiKey) {
        this.stockRepository = stockRepository;
        this.quoteClient = quoteClient;
        this.apiKeyConfigured = apiKey != null && !apiKey.isBlank();
    }

    public List<StockSummaryResponse> withQuotes(List<StockSummaryResponse> stocks) {
        if (!apiKeyConfigured || stocks.isEmpty()) {
            String message = apiKeyConfigured
                    ? "End-of-day quote could not be retrieved from Twelve Data."
                    : "Twelve Data API key is not configured.";
            return stocks.stream()
                    .map(stock -> stock.withQuote(StockQuoteResponse.unavailable(message)))
                    .toList();
        }

        List<String> symbols = stocks.stream().map(StockSummaryResponse::symbol).distinct().toList();
        Map<String, Stock> stocksBySymbol = new HashMap<>();
        stockRepository.findAllById(symbols).forEach(stock -> stocksBySymbol.put(stock.getSymbol(), stock));

        List<String> nseSymbols = symbols.stream()
                .filter(symbol -> isNseStock(stocksBySymbol.get(symbol)))
                .toList();
        Map<String, TwelveDataMarketQuoteClient.Quote> providerQuotes = nseSymbols.isEmpty()
                ? Map.of()
                : quoteClient.fetch(nseSymbols);

        return stocks.stream()
                .map(stock -> stock.withQuote(quoteFor(stock.symbol(), stocksBySymbol, providerQuotes)))
                .toList();
    }

    public WatchlistResponse withQuotes(WatchlistResponse watchlist) {
        List<StockSummaryResponse> quotedStocks = withQuotes(
                watchlist.items().stream().map(WatchlistEntryResponse::stock).toList());
        Map<String, StockSummaryResponse> stocksBySymbol = new HashMap<>();
        quotedStocks.forEach(stock -> stocksBySymbol.put(stock.symbol(), stock));
        List<WatchlistEntryResponse> entries = watchlist.items().stream()
                .map(entry -> new WatchlistEntryResponse(
                        entry.id(), stocksBySymbol.get(entry.stock().symbol()), entry.addedAt()))
                .toList();
        return new WatchlistResponse(entries);
    }

    public WatchlistEntryResponse withQuote(WatchlistEntryResponse entry) {
        StockSummaryResponse quotedStock = withQuotes(List.of(entry.stock())).getFirst();
        return new WatchlistEntryResponse(entry.id(), quotedStock, entry.addedAt());
    }

    private StockQuoteResponse quoteFor(
            String symbol,
            Map<String, Stock> stocksBySymbol,
            Map<String, TwelveDataMarketQuoteClient.Quote> providerQuotes) {
        Stock stock = stocksBySymbol.get(symbol);
        if (!isNseStock(stock)) {
            return StockQuoteResponse.unavailable("Exchange instrument mapping is unavailable.");
        }
        TwelveDataMarketQuoteClient.Quote quote = providerQuotes.get(symbol);
        if (quote == null) {
            return StockQuoteResponse.unavailable("End-of-day quote could not be retrieved from Twelve Data.");
        }
        return StockQuoteResponse.available(quote.closePrice(), quote.currency(), quote.marketDate());
    }

    private boolean isNseStock(Stock stock) {
        return stock != null && "NSE".equalsIgnoreCase(stock.getExchangeCode());
    }
}
