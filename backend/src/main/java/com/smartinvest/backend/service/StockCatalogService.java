package com.smartinvest.backend.service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import com.smartinvest.backend.dto.StockSearchPageResponse;
import com.smartinvest.backend.dto.StockSummaryResponse;
import com.smartinvest.backend.entity.Stock;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.StockRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockCatalogService {
    private static final Pattern SYMBOL_PATTERN = Pattern.compile("[A-Z0-9][A-Z0-9.^_-]{0,31}");
    private static final int MAX_QUERY_LENGTH = 100;
    private static final int MAX_PAGE_SIZE = 50;

    private final StockRepository stockRepository;

    public StockCatalogService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Transactional(readOnly = true)
    public Stock requireActiveStock(String rawSymbol) {
        String symbol = normalizeSymbol(rawSymbol);
        try {
            return stockRepository.findBySymbolAndActiveTrue(symbol)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STOCK_NOT_FOUND",
                            "The requested stock is not available in the catalog."));
        } catch (DataAccessException exception) {
            throw catalogUnavailable();
        }
    }

    @Transactional(readOnly = true)
    public StockSearchPageResponse search(String rawQuery, int page, int size) {
        if (rawQuery == null || rawQuery.isBlank() || rawQuery.trim().length() > MAX_QUERY_LENGTH
                || page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SEARCH_QUERY",
                    "Provide a non-blank query and valid pagination values.");
        }
        String query = rawQuery.trim().toLowerCase(Locale.ROOT);
        Page<Stock> result;
        try {
            result = stockRepository.searchActive(query,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "symbol")));
        } catch (DataAccessException exception) {
            throw catalogUnavailable();
        }
        List<StockSummaryResponse> items = result.getContent().stream()
                .map(StockSummaryResponse::from)
                .toList();
        return new StockSearchPageResponse(items, result.getNumber(), result.getSize(), result.hasNext());
    }

    public String normalizeSymbol(String rawSymbol) {
        if (rawSymbol == null) {
            throw invalidSymbol();
        }
        String symbol = rawSymbol.trim().toUpperCase(Locale.ROOT);
        if (!SYMBOL_PATTERN.matcher(symbol).matches()) {
            throw invalidSymbol();
        }
        return symbol;
    }

    private ApiException invalidSymbol() {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SYMBOL",
                "Provide a valid stock symbol using letters, numbers, dots, carets, underscores, or hyphens.");
    }

    private ApiException catalogUnavailable() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "CATALOG_UNAVAILABLE",
                "The stock catalog is temporarily unavailable.");
    }
}
