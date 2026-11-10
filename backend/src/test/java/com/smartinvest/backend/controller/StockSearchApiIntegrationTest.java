package com.smartinvest.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import com.smartinvest.backend.support.AbstractMysqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class StockSearchApiIntegrationTest extends AbstractMysqlIntegrationTest {
    @Test
    void searchesSymbolsNamesAndReturnsEmptyResults() {
        seedStock("AAPL", "Apple Inc.", true);
        seedStock("MSFT", "Microsoft Corporation", true);
        seedStock("DEAD", "Inactive Sample", false);
        String token = registerAndLogin();

        ResponseEntity<Map> bySymbol = search(token, "aap");
        assertEquals(HttpStatus.OK, bySymbol.getStatusCode());
        Map stock = (Map) ((List<?>) bySymbol.getBody().get("items")).getFirst();
        assertEquals("AAPL", stock.get("symbol"));
        Map quote = (Map) stock.get("quote");
        assertEquals("UNAVAILABLE", quote.get("status"));
        assertEquals("Twelve Data API key is not configured.", quote.get("message"));

        ResponseEntity<Map> byName = search(token, "MICROSOFT");
        assertEquals(1, ((List<?>) byName.getBody().get("items")).size());
        assertEquals(0, ((List<?>) search(token, "no-match").getBody().get("items")).size());
        assertEquals(0, ((List<?>) search(token, "inactive").getBody().get("items")).size());
    }

    @Test
    void validatesBlankQueryAndPaginationAndRequiresAuthentication() {
        String token = registerAndLogin();

        ResponseEntity<Map> blank = search(token, "  ");
        assertEquals(HttpStatus.BAD_REQUEST, blank.getStatusCode());
        assertEquals("INVALID_SEARCH_QUERY", blank.getBody().get("code"));
        assertEquals(HttpStatus.BAD_REQUEST,
                rest.exchange("/api/v1/stocks/search?q=AAPL&size=51", HttpMethod.GET, bearer(token), Map.class)
                        .getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED,
                rest.getForEntity("/api/v1/stocks/search?q=AAPL", Map.class).getStatusCode());
    }

    @Test
    void searchesOneThousandRowsWithStablePagination() {
        for (int index = 0; index < 1_000; index++) {
            String symbol = "T" + String.format("%04d", index);
            seedStock(symbol, "Synthetic Company " + index, true);
        }
        String token = registerAndLogin();
        long start = System.nanoTime();

        ResponseEntity<Map> firstPage = rest.exchange("/api/v1/stocks/search?q=synthetic&page=0&size=50",
                HttpMethod.GET, bearer(token), Map.class);
        ResponseEntity<Map> secondPage = rest.exchange("/api/v1/stocks/search?q=synthetic&page=1&size=50",
                HttpMethod.GET, bearer(token), Map.class);

        long elapsedMillis = java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        assertEquals(HttpStatus.OK, firstPage.getStatusCode());
        assertEquals(50, ((List<?>) firstPage.getBody().get("items")).size());
        assertEquals(Boolean.TRUE, firstPage.getBody().get("hasNext"));
        assertEquals(50, ((List<?>) secondPage.getBody().get("items")).size());
        assertEquals("T0000", ((Map) ((List<?>) firstPage.getBody().get("items")).getFirst()).get("symbol"));
        assertEquals("T0050", ((Map) ((List<?>) secondPage.getBody().get("items")).getFirst()).get("symbol"));
        assertTrue(elapsedMillis < 2_000, "Search page requests took " + elapsedMillis + " ms");
    }

    private ResponseEntity<Map> search(String token, String query) {
        return rest.exchange("/api/v1/stocks/search?q=" + query, HttpMethod.GET, bearer(token), Map.class);
    }
}
