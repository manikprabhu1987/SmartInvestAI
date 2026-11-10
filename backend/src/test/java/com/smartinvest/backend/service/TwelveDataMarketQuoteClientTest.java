package com.smartinvest.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class TwelveDataMarketQuoteClientTest {
    @Test
    void fetchesNseEndOfDayCloseAndCachesTheSuccessfulQuote() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TwelveDataMarketQuoteClient client = new TwelveDataMarketQuoteClient(
                builder, "https://api.twelvedata.com", "test-api-key");

        server.expect(requestTo("https://api.twelvedata.com/eod?symbol=INFY&mic_code=XNSE&apikey=test-api-key"))
                .andRespond(withSuccess("""
                        {
                          "symbol": "INFY",
                          "exchange": "NSE",
                          "mic_code": "XNSE",
                          "currency": "INR",
                          "datetime": "2026-11-09",
                          "close": "1425.75"
                        }
                        """, MediaType.APPLICATION_JSON));

        var quotes = client.fetch(List.of("INFY"));
        var cachedQuotes = client.fetch(List.of("INFY"));

        assertEquals(new BigDecimal("1425.75"), quotes.get("INFY").closePrice());
        assertEquals("INR", quotes.get("INFY").currency());
        assertEquals(LocalDate.parse("2026-11-09"), quotes.get("INFY").marketDate());
        assertEquals(quotes, cachedQuotes);
        server.verify();
    }

    @Test
    void doesNotCallProviderWhenApiKeyIsMissing() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TwelveDataMarketQuoteClient client = new TwelveDataMarketQuoteClient(
                builder, "https://api.twelvedata.com", "");

        assertTrue(client.fetch(List.of("INFY")).isEmpty());
        server.verify();
    }

    @Test
    void treatsProviderFailureAsAnUnavailableQuote() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TwelveDataMarketQuoteClient client = new TwelveDataMarketQuoteClient(
                builder, "https://api.twelvedata.com", "test-api-key");

        server.expect(requestTo("https://api.twelvedata.com/eod?symbol=INFY&mic_code=XNSE&apikey=test-api-key"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertTrue(client.fetch(List.of("INFY")).isEmpty());
        server.verify();
    }

    @Test
    void doesNotCacheProviderErrorResponses() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        TwelveDataMarketQuoteClient client = new TwelveDataMarketQuoteClient(
                builder, "https://api.twelvedata.com", "test-api-key");

        server.expect(requestTo("https://api.twelvedata.com/eod?symbol=INFY&mic_code=XNSE&apikey=test-api-key"))
                .andRespond(withSuccess("""
                        {"code": 401, "message": "Invalid API key"}
                        """, MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.twelvedata.com/eod?symbol=INFY&mic_code=XNSE&apikey=test-api-key"))
                .andRespond(withSuccess("""
                        {
                          "currency": "INR",
                          "datetime": "2026-11-09",
                          "close": "1425.75"
                        }
                        """, MediaType.APPLICATION_JSON));

        assertTrue(client.fetch(List.of("INFY")).isEmpty());
        assertTrue(client.fetch(List.of("INFY")).containsKey("INFY"));
        server.verify();
    }
}
