package com.smartinvest.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Map;

import com.smartinvest.backend.support.AbstractMysqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class AuthApiIntegrationTest extends AbstractMysqlIntegrationTest {
    @Test
    void registrationLoginProtectedRequestAndLogoutRevocation() {
        String email = "auth-flow@example.test";
        ResponseEntity<Map> registration = rest.postForEntity("/api/v1/auth/register",
                Map.of("name", "Auth Flow", "email", email, "password", "very-secure-password"), Map.class);
        assertEquals(HttpStatus.CREATED, registration.getStatusCode());

        ResponseEntity<AuthTokenResponse> login = rest.postForEntity("/api/v1/auth/login",
                Map.of("email", email, "password", "very-secure-password"), AuthTokenResponse.class);
        assertEquals(HttpStatus.OK, login.getStatusCode());
        assertNotNull(login.getBody().accessToken());

        ResponseEntity<Map> protectedResponse = rest.exchange("/api/v1/watchlist", HttpMethod.GET,
                bearer(login.getBody().accessToken()), Map.class);
        assertEquals(HttpStatus.OK, protectedResponse.getStatusCode());

        ResponseEntity<Void> logout = rest.exchange("/api/v1/auth/logout", HttpMethod.POST,
                bearer(login.getBody().accessToken()), Void.class);
        assertEquals(HttpStatus.NO_CONTENT, logout.getStatusCode());

        ResponseEntity<Map> afterLogout = rest.exchange("/api/v1/watchlist", HttpMethod.GET,
                bearer(login.getBody().accessToken()), Map.class);
        assertEquals(HttpStatus.UNAUTHORIZED, afterLogout.getStatusCode());
        assertEquals("UNAUTHENTICATED", afterLogout.getBody().get("code"));
    }

    @Test
    void malformedAndDuplicateRegistrationReturnProblemDetails() {
        ResponseEntity<Map> invalid = rest.postForEntity("/api/v1/auth/register",
                Map.of("name", "", "email", "not-an-email", "password", "short"), Map.class);
        assertEquals(HttpStatus.BAD_REQUEST, invalid.getStatusCode());
        assertEquals("VALIDATION_ERROR", invalid.getBody().get("code"));

        Map<String, String> request =
                Map.of("name", "Auth Flow", "email", "duplicate@example.test", "password", "very-secure-password");
        assertEquals(HttpStatus.CREATED,
                rest.postForEntity("/api/v1/auth/register", request, Map.class).getStatusCode());
        ResponseEntity<Map> duplicate = rest.postForEntity("/api/v1/auth/register", request, Map.class);
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatusCode());
        assertEquals("EMAIL_ALREADY_REGISTERED", duplicate.getBody().get("code"));
    }

    @Test
    void invalidCredentialsHaveGenericProblemResponse() {
        ResponseEntity<Map> response = rest.postForEntity("/api/v1/auth/login",
                Map.of("email", "missing@example.test", "password", "wrong-password"), Map.class);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("INVALID_CREDENTIALS", response.getBody().get("code"));
    }
}
