package com.smartinvest.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import com.smartinvest.backend.support.AbstractMysqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class WatchlistApiIntegrationTest extends AbstractMysqlIntegrationTest {
    @Test
    void addValidStockAndReadPersistedEntry() {
        seedStock("AAPL", "Apple Inc.", true);
        String token = registerAndLogin();

        ResponseEntity<Map> added = rest.exchange("/api/v1/watchlist", HttpMethod.POST,
                new HttpEntity<>(Map.of("symbol", " aapl "), bearer(token).getHeaders()), Map.class);
        assertEquals(HttpStatus.CREATED, added.getStatusCode());
        Map stock = (Map) added.getBody().get("stock");
        assertEquals("AAPL", stock.get("symbol"));
        Map addedQuote = (Map) stock.get("quote");
        assertEquals("UNAVAILABLE", addedQuote.get("status"));
        assertEquals("Twelve Data API key is not configured.", addedQuote.get("message"));

        ResponseEntity<Map> watchlist = rest.exchange("/api/v1/watchlist", HttpMethod.GET,
                bearer(token), Map.class);
        List<Map> entries = (List<Map>) watchlist.getBody().get("items");
        assertEquals(1, entries.size());
        Map listedStock = (Map) entries.getFirst().get("stock");
        assertEquals("AAPL", listedStock.get("symbol"));
        assertEquals("UNAVAILABLE", ((Map) listedStock.get("quote")).get("status"));
    }

    @Test
    void malformedUnknownAndDuplicateSymbolsReturnDistinctErrors() {
        seedStock("AAPL", "Apple Inc.", true);
        String token = registerAndLogin();

        ResponseEntity<Map> malformed = add(token, "bad symbol");
        assertEquals(HttpStatus.BAD_REQUEST, malformed.getStatusCode());
        assertEquals("INVALID_SYMBOL", malformed.getBody().get("code"));

        ResponseEntity<Map> unknown = add(token, "MISSING");
        assertEquals(HttpStatus.NOT_FOUND, unknown.getStatusCode());
        assertEquals("STOCK_NOT_FOUND", unknown.getBody().get("code"));

        assertEquals(HttpStatus.CREATED, add(token, "AAPL").getStatusCode());
        ResponseEntity<Map> duplicate = add(token, "aapl");
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatusCode());
        assertEquals("WATCHLIST_DUPLICATE", duplicate.getBody().get("code"));
    }

    @Test
    void usersCannotViewOrRemoveAnotherUsersEntry() {
        seedStock("MSFT", "Microsoft Corporation", true);
        String ownerToken = registerAndLogin();
        String otherToken = registerAndLogin();
        assertEquals(HttpStatus.CREATED, add(ownerToken, "MSFT").getStatusCode());

        ResponseEntity<Map> otherList = rest.exchange("/api/v1/watchlist", HttpMethod.GET,
                bearer(otherToken), Map.class);
        assertEquals(HttpStatus.OK, otherList.getStatusCode());
        assertTrue(((List<?>) otherList.getBody().get("items")).isEmpty());

        ResponseEntity<Map> remove = rest.exchange("/api/v1/watchlist/MSFT", HttpMethod.DELETE,
                bearer(otherToken), Map.class);
        assertEquals(HttpStatus.NOT_FOUND, remove.getStatusCode());
        assertEquals("WATCHLIST_ENTRY_NOT_FOUND", remove.getBody().get("code"));

        ResponseEntity<Map> ownerList = rest.exchange("/api/v1/watchlist", HttpMethod.GET,
                bearer(ownerToken), Map.class);
        assertEquals(1, ((List<?>) ownerList.getBody().get("items")).size());
    }

    @Test
    void ownerCanRemoveEntryAndMissingEntryReturnsNotFound() {
        seedStock("NVDA", "NVIDIA Corporation", true);
        String token = registerAndLogin();
        add(token, "NVDA");

        ResponseEntity<Map> removed = rest.exchange("/api/v1/watchlist/nvda", HttpMethod.DELETE,
                bearer(token), Map.class);
        assertEquals(HttpStatus.OK, removed.getStatusCode());
        assertEquals("NVDA", removed.getBody().get("symbol"));
        assertEquals(Boolean.TRUE, removed.getBody().get("removed"));

        ResponseEntity<Map> list = rest.exchange("/api/v1/watchlist", HttpMethod.GET, bearer(token), Map.class);
        assertEquals(0, ((List<?>) list.getBody().get("items")).size());
        assertEquals(HttpStatus.NOT_FOUND,
                rest.exchange("/api/v1/watchlist/NVDA", HttpMethod.DELETE, bearer(token), Map.class).getStatusCode());
    }

    @Test
    void watchlistIsOrderedNewestFirstWithStableTieBreak() {
        seedStock("AAPL", "Apple Inc.", true);
        seedStock("MSFT", "Microsoft Corporation", true);
        String token = registerAndLogin();
        add(token, "AAPL");
        add(token, "MSFT");

        ResponseEntity<Map> response = rest.exchange("/api/v1/watchlist", HttpMethod.GET, bearer(token), Map.class);
        List<Map> entries = (List<Map>) response.getBody().get("items");

        assertEquals("MSFT", ((Map) entries.getFirst().get("stock")).get("symbol"));
        assertEquals("AAPL", ((Map) entries.getLast().get("stock")).get("symbol"));
    }

    @Test
    void concurrentDuplicateAddsCreateOnlyOneEntry() throws Exception {
        seedStock("TSLA", "Tesla Inc.", true);
        String token = registerAndLogin();
        var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            var requests = java.util.stream.IntStream.range(0, 2)
                    .mapToObj(index -> executor.submit(() -> add(token, "TSLA").getStatusCode()))
                    .toList();
            List<org.springframework.http.HttpStatusCode> statuses =
                    List.of(requests.getFirst().get(), requests.getLast().get());
            assertEquals(1, statuses.stream().filter(HttpStatus.CREATED::isSameCodeAs).count());
            assertEquals(1, statuses.stream().filter(HttpStatus.CONFLICT::isSameCodeAs).count());
            assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM watchlist_entry", Integer.class));
        } finally {
            executor.shutdownNow();
        }
    }

    private ResponseEntity<Map> add(String token, String symbol) {
        return rest.exchange("/api/v1/watchlist", HttpMethod.POST,
                new HttpEntity<>(Map.of("symbol", symbol), bearer(token).getHeaders()), Map.class);
    }
}
