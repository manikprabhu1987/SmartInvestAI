package com.smartinvest.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.smartinvest.backend.entity.Stock;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.StockRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class StockCatalogServiceTest {
    @Mock
    private StockRepository stockRepository;

    @InjectMocks
    private StockCatalogService stockCatalogService;

    @Test
    void resolvesTrimmedUppercaseActiveSymbol() {
        Stock stock = new Stock("AAPL", "Apple Inc.", "NASDAQ", true);
        when(stockRepository.findBySymbolAndActiveTrue("AAPL")).thenReturn(Optional.of(stock));

        assertEquals(stock, stockCatalogService.requireActiveStock(" aapl "));
    }

    @Test
    void rejectsUnknownOrInactiveSymbol() {
        when(stockRepository.findBySymbolAndActiveTrue("MISSING")).thenReturn(Optional.empty());

        ApiException error = assertThrows(ApiException.class,
                () -> stockCatalogService.requireActiveStock("missing"));

        assertEquals("STOCK_NOT_FOUND", error.code());
    }

    @Test
    void rejectsMalformedSymbol() {
        ApiException error = assertThrows(ApiException.class,
                () -> stockCatalogService.requireActiveStock("bad symbol"));

        assertEquals("INVALID_SYMBOL", error.code());
    }

    @Test
    void searchesWithNormalizedQueryAndRequestedPage() {
        Page<Stock> page = new PageImpl<>(List.of(new Stock("AAPL", "Apple Inc.", "NASDAQ", true)),
                PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "symbol")), 1);
        when(stockRepository.searchActive("apple",
                PageRequest.of(0, 20, Sort.by(Sort.Direction.ASC, "symbol")))).thenReturn(page);

        var result = stockCatalogService.search(" Apple ", 0, 20);

        assertEquals(1, result.items().size());
        assertEquals("AAPL", result.items().getFirst().symbol());
    }

    @Test
    void rejectsBlankQueriesAndInvalidPagination() {
        ApiException blank = assertThrows(ApiException.class, () -> stockCatalogService.search("  ", 0, 20));
        ApiException size = assertThrows(ApiException.class, () -> stockCatalogService.search("AAPL", 0, 51));
        ApiException page = assertThrows(ApiException.class, () -> stockCatalogService.search("AAPL", -1, 20));

        assertEquals("INVALID_SEARCH_QUERY", blank.code());
        assertEquals("INVALID_SEARCH_QUERY", size.code());
        assertEquals("INVALID_SEARCH_QUERY", page.code());
    }
}
