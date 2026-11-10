package com.smartinvest.backend.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class TwelveDataMarketQuoteClient {
    private static final Logger LOGGER = LoggerFactory.getLogger(TwelveDataMarketQuoteClient.class);
    private static final Duration CACHE_DURATION = Duration.ofMinutes(30);
    private static final String NSE_MIC_CODE = "XNSE";

    private final RestClient restClient;
    private final String baseUrl;
    private final String apiKey;
    private final Map<String, CachedQuote> quoteCache = new ConcurrentHashMap<>();

    public TwelveDataMarketQuoteClient(
            RestClient.Builder builder,
            @Value("${twelvedata.base-url:https://api.twelvedata.com}") String baseUrl,
            @Value("${twelvedata.api-key:}") String apiKey) {
        this.restClient = builder.build();
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.apiKey = apiKey.trim();
    }

    public Map<String, Quote> fetch(List<String> symbols) {
        if (apiKey.isBlank() || symbols.isEmpty()) {
            return Map.of();
        }

        Instant now = Instant.now();
        List<String> distinctSymbols = new ArrayList<>(new LinkedHashSet<>(symbols));
        Map<String, Quote> quotes = new LinkedHashMap<>();
        for (String symbol : distinctSymbols) {
            CachedQuote cached = quoteCache.get(symbol);
            if (cached != null && cached.expiresAt().isAfter(now)) {
                quotes.put(symbol, cached.quote());
                continue;
            }

            Quote quote = fetchOne(symbol);
            if (quote != null) {
                quoteCache.put(symbol, new CachedQuote(quote, now.plus(CACHE_DURATION)));
                quotes.put(symbol, quote);
            }
        }
        return Map.copyOf(quotes);
    }

    private Quote fetchOne(String symbol) {
        var requestUri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/eod")
                .queryParam("symbol", symbol)
                .queryParam("mic_code", NSE_MIC_CODE)
                .queryParam("apikey", apiKey)
                .build()
                .encode()
                .toUri();

        try {
            JsonNode response = restClient.get().uri(requestUri).retrieve().body(JsonNode.class);
            return parseQuote(symbol, response);
        } catch (RestClientException exception) {
            LOGGER.warn("Twelve Data EOD request failed for {}: {}", symbol,
                    exception.getClass().getSimpleName());
            return null;
        }
    }

    private Quote parseQuote(String symbol, JsonNode response) {
        if (response == null || response.has("code") && response.has("message")) {
            String errorCode = response == null ? "empty response" : response.path("code").asText("provider error");
            LOGGER.warn("Twelve Data returned an error for {}: {}", symbol, errorCode);
            return null;
        }

        String priceText = response.path("close").asText();
        String dateText = response.path("datetime").asText();
        String currency = response.path("currency").asText();
        if (priceText.isBlank() || dateText.isBlank() || currency.isBlank()) {
            LOGGER.warn("Twelve Data returned an incomplete EOD quote for {}", symbol);
            return null;
        }

        try {
            BigDecimal price = new BigDecimal(priceText);
            LocalDate marketDate = LocalDate.parse(dateText);
            if (price.signum() <= 0) {
                LOGGER.warn("Twelve Data returned a non-positive EOD price for {}", symbol);
                return null;
            }
            return new Quote(price, currency, marketDate);
        } catch (NumberFormatException | java.time.DateTimeException exception) {
            LOGGER.warn("Twelve Data returned an invalid EOD quote for {}", symbol);
            return null;
        }
    }

    public record Quote(BigDecimal closePrice, String currency, LocalDate marketDate) {
    }

    private record CachedQuote(Quote quote, Instant expiresAt) {
    }
}
