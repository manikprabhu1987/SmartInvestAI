package com.smartinvest.backend.service;

import java.util.List;

import com.smartinvest.backend.dto.RemoveWatchlistStockResponse;
import com.smartinvest.backend.dto.WatchlistEntryResponse;
import com.smartinvest.backend.dto.WatchlistResponse;
import com.smartinvest.backend.entity.Stock;
import com.smartinvest.backend.entity.User;
import com.smartinvest.backend.entity.WatchlistEntry;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.UserRepository;
import com.smartinvest.backend.repository.WatchlistEntryRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WatchlistService {
    private final WatchlistEntryRepository watchlistRepository;
    private final StockCatalogService stockCatalogService;
    private final UserRepository userRepository;

    public WatchlistService(WatchlistEntryRepository watchlistRepository,
            StockCatalogService stockCatalogService, UserRepository userRepository) {
        this.watchlistRepository = watchlistRepository;
        this.stockCatalogService = stockCatalogService;
        this.userRepository = userRepository;
    }

    @Transactional
    public WatchlistEntryResponse add(Long userId, String rawSymbol) {
        Stock stock = stockCatalogService.requireActiveStock(rawSymbol);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                        "The authenticated account is no longer available."));
        if (watchlistRepository.existsByUserIdAndStockSymbol(userId, stock.getSymbol())) {
            throw duplicateEntry();
        }

        try {
            WatchlistEntry entry = watchlistRepository.saveAndFlush(new WatchlistEntry(user, stock));
            return WatchlistEntryResponse.from(entry);
        } catch (DataIntegrityViolationException exception) {
            throw duplicateEntry();
        }
    }

    @Transactional(readOnly = true)
    public WatchlistResponse list(Long userId) {
        List<WatchlistEntryResponse> entries = watchlistRepository.findAllByUserIdNewestFirst(userId).stream()
                .map(WatchlistEntryResponse::from)
                .toList();
        return new WatchlistResponse(entries);
    }

    @Transactional
    public RemoveWatchlistStockResponse remove(Long userId, String rawSymbol) {
        String symbol = stockCatalogService.normalizeSymbol(rawSymbol);
        WatchlistEntry entry = watchlistRepository.findByUserIdAndStockSymbol(userId, symbol)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "WATCHLIST_ENTRY_NOT_FOUND",
                        "The stock is not in this user's watchlist."));
        watchlistRepository.delete(entry);
        return new RemoveWatchlistStockResponse(symbol, true);
    }

    private ApiException duplicateEntry() {
        return new ApiException(HttpStatus.CONFLICT, "WATCHLIST_DUPLICATE",
                "This stock is already in your watchlist.");
    }
}
