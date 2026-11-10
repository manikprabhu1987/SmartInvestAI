package com.smartinvest.backend.controller;

import com.smartinvest.backend.dto.AddWatchlistStockRequest;
import com.smartinvest.backend.dto.RemoveWatchlistStockResponse;
import com.smartinvest.backend.dto.WatchlistEntryResponse;
import com.smartinvest.backend.dto.WatchlistResponse;
import com.smartinvest.backend.service.StockQuoteService;
import com.smartinvest.backend.service.WatchlistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/watchlist")
public class WatchlistController {
    private final WatchlistService watchlistService;
    private final StockQuoteService stockQuoteService;

    public WatchlistController(WatchlistService watchlistService, StockQuoteService stockQuoteService) {
        this.watchlistService = watchlistService;
        this.stockQuoteService = stockQuoteService;
    }

    @GetMapping
    public WatchlistResponse list(@AuthenticationPrincipal Long userId) {
        return stockQuoteService.withQuotes(watchlistService.list(userId));
    }

    @PostMapping
    public ResponseEntity<WatchlistEntryResponse> add(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody AddWatchlistStockRequest request) {
        WatchlistEntryResponse entry = watchlistService.add(userId, request.symbol());
        return ResponseEntity.status(HttpStatus.CREATED).body(stockQuoteService.withQuote(entry));
    }

    @DeleteMapping("/{symbol}")
    public RemoveWatchlistStockResponse remove(
            @AuthenticationPrincipal Long userId, @PathVariable String symbol) {
        return watchlistService.remove(userId, symbol);
    }
}
