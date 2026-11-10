package com.smartinvest.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.smartinvest.backend.entity.Stock;
import com.smartinvest.backend.entity.User;
import com.smartinvest.backend.entity.WatchlistEntry;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.WatchlistEntryRepository;
import com.smartinvest.backend.repository.UserRepository;
import com.smartinvest.backend.dto.WatchlistEntryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class WatchlistServiceTest {
    @Mock
    private WatchlistEntryRepository watchlistRepository;

    @Mock
    private StockCatalogService stockCatalogService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WatchlistService watchlistService;

    @Test
    void addsCanonicalStockForAuthenticatedOwner() {
        Stock stock = new Stock("AAPL", "Apple Inc.", "NASDAQ", true);
        User user = new User("Owner", "owner@example.com", "hash");
        user.setId(8L);
        when(stockCatalogService.requireActiveStock(" aapl ")).thenReturn(stock);
        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(watchlistRepository.existsByUserIdAndStockSymbol(8L, "AAPL")).thenReturn(false);
        when(watchlistRepository.saveAndFlush(any(WatchlistEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WatchlistEntryResponse result = watchlistService.add(8L, " aapl ");

        assertEquals("AAPL", result.stock().symbol());
        verify(watchlistRepository).saveAndFlush(any(WatchlistEntry.class));
    }

    @Test
    void rejectsDuplicateForSameOwner() {
        when(stockCatalogService.requireActiveStock("AAPL"))
                .thenReturn(new Stock("AAPL", "Apple Inc.", "NASDAQ", true));
        User user = new User("Owner", "owner@example.com", "hash");
        user.setId(8L);
        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(watchlistRepository.existsByUserIdAndStockSymbol(8L, "AAPL")).thenReturn(true);

        ApiException error = assertThrows(ApiException.class, () -> watchlistService.add(8L, "AAPL"));

        assertEquals("WATCHLIST_DUPLICATE", error.code());
    }

    @Test
    void mapsConcurrentDatabaseUniquenessConflictToDuplicateError() {
        Stock stock = new Stock("AAPL", "Apple Inc.", "NASDAQ", true);
        User user = new User("Owner", "owner@example.com", "hash");
        user.setId(8L);
        when(stockCatalogService.requireActiveStock("AAPL")).thenReturn(stock);
        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(watchlistRepository.existsByUserIdAndStockSymbol(8L, "AAPL")).thenReturn(false);
        when(watchlistRepository.saveAndFlush(any(WatchlistEntry.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        ApiException error = assertThrows(ApiException.class, () -> watchlistService.add(8L, "AAPL"));

        assertEquals("WATCHLIST_DUPLICATE", error.code());
    }

    @Test
    void removesOnlyEntryOwnedByAuthenticatedUser() {
        User owner = new User("Owner", "owner@example.com", "hash");
        owner.setId(8L);
        WatchlistEntry entry = new WatchlistEntry(owner,
                new Stock("AAPL", "Apple Inc.", "NASDAQ", true));
        when(stockCatalogService.normalizeSymbol("aapl")).thenReturn("AAPL");
        when(watchlistRepository.findByUserIdAndStockSymbol(8L, "AAPL")).thenReturn(Optional.of(entry));

        watchlistService.remove(8L, "aapl");

        verify(watchlistRepository).delete(entry);
    }

    @Test
    void returnsOnlyEntriesQueriedForAuthenticatedOwner() {
        when(watchlistRepository.findAllByUserIdNewestFirst(8L)).thenReturn(java.util.List.of());

        assertEquals(0, watchlistService.list(8L).items().size());

        verify(watchlistRepository).findAllByUserIdNewestFirst(8L);
    }

    @Test
    void missingOwnerEntryDoesNotDeleteOtherUsersData() {
        when(stockCatalogService.normalizeSymbol("AAPL")).thenReturn("AAPL");
        when(watchlistRepository.findByUserIdAndStockSymbol(8L, "AAPL")).thenReturn(Optional.empty());

        ApiException error = assertThrows(ApiException.class, () -> watchlistService.remove(8L, "AAPL"));

        assertEquals("WATCHLIST_ENTRY_NOT_FOUND", error.code());
    }
}
