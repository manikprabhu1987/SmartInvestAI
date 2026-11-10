package com.smartinvest.backend.support;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;

@ActiveProfiles("h2-test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AbstractMysqlIntegrationTest {
    private static final boolean USE_H2 = Boolean.getBoolean("test.database.h2");

    private static final class MySqlContainer {
        private static final MySQLContainer<?> INSTANCE = createAndStart();

        private static MySQLContainer<?> createAndStart() {
            MySQLContainer<?> container = new MySQLContainer<>("mysql:8.4")
                    .withDatabaseName("smartinvest_test")
                    .withUsername("smartinvest")
                    .withPassword("test-password");
            container.start();
            return container;
        }
    }

    @Autowired
    protected TestRestTemplate rest;

    @Autowired
    protected JdbcTemplate jdbc;

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        if (!USE_H2) {
            registry.add("spring.datasource.url", () -> MySqlContainer.INSTANCE.getJdbcUrl());
            registry.add("spring.datasource.username", () -> MySqlContainer.INSTANCE.getUsername());
            registry.add("spring.datasource.password", () -> MySqlContainer.INSTANCE.getPassword());
            registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        }
        registry.add("jwt.secret", () -> "dGVzdC1zZWNyZXQtdGhhdC1pcy1sb25nLWVub3VnaC1mb3Itand0");
        registry.add("jwt.issuer", () -> "smart-invest-test");
        registry.add("jwt.audience", () -> "smart-invest-test-client");
        registry.add("jwt.expiration-minutes", () -> "15");
        registry.add("twelvedata.api-key", () -> "");
    }

    @BeforeEach
    void clearDatabase() {
        jdbc.update("DELETE FROM watchlist_entry");
        jdbc.update("DELETE FROM revoked_token");
        jdbc.update("DELETE FROM stock");
        jdbc.update("DELETE FROM users");
    }

    protected String registerAndLogin() {
        String email = "test-" + UUID.randomUUID() + "@example.test";
        rest.postForEntity("/api/v1/auth/register",
                new RegisterRequest("Test User", email, "very-secure-password"), String.class);
        return rest.postForEntity("/api/v1/auth/login",
                new LoginRequest(email, "very-secure-password"), AuthTokenResponse.class)
                .getBody().accessToken();
    }

    protected HttpEntity<?> bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    protected void seedStock(String symbol, String companyName, boolean active) {
        jdbc.update("INSERT INTO stock (symbol, company_name, exchange_code, active) VALUES (?, ?, ?, ?)",
                symbol, companyName, "NASDAQ", active);
    }

    protected record RegisterRequest(String name, String email, String password) {
    }

    protected record LoginRequest(String email, String password) {
    }

    protected record AuthTokenResponse(String accessToken, String tokenType, String expiresAt, Object user) {
    }
}
