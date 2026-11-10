package com.smartinvest.backend.controller;

import com.smartinvest.backend.dto.StockSearchPageResponse;
import com.smartinvest.backend.service.StockCatalogService;
import com.smartinvest.backend.service.StockQuoteService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stocks")
public class StockController {
    private final StockCatalogService stockCatalogService;
    private final StockQuoteService stockQuoteService;

    public StockController(StockCatalogService stockCatalogService, StockQuoteService stockQuoteService) {
        this.stockCatalogService = stockCatalogService;
        this.stockQuoteService = stockQuoteService;
    }

    @GetMapping("/search")
    public StockSearchPageResponse search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        StockSearchPageResponse results = stockCatalogService.search(q, page, size);
        return new StockSearchPageResponse(
                stockQuoteService.withQuotes(results.items()),
                results.page(),
                results.size(),
                results.hasNext());
    }
}
