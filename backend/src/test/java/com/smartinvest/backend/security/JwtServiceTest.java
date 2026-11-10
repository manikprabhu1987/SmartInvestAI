package com.smartinvest.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import com.smartinvest.backend.config.JwtProperties;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.RevokedTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {
    private static final String SECRET = "dGVzdC1zZWNyZXQtdGhhdC1pcy1sb25nLWVub3VnaC1mb3Itand0";
    private static final String ISSUER = "smart-invest-test";
    private static final String AUDIENCE = "smart-invest-test-client";

    @Mock
    private RevokedTokenRepository revokedTokenRepository;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new JwtProperties(SECRET, ISSUER, AUDIENCE, 15), revokedTokenRepository);
    }

    @Test
    void issuesSignedTokenWithSubjectJtiIssuerAudienceAndExpiry() {
        JwtService.IssuedToken issued = jwtService.issueToken(42L);
        Claims claims = jwtService.validateToken(issued.value());

        assertEquals("42", claims.getSubject());
        assertEquals(ISSUER, claims.getIssuer());
        assertEquals(AUDIENCE, claims.getAudience().iterator().next());
        assertEquals(issued.expiresAt().getEpochSecond(), claims.getExpiration().toInstant().getEpochSecond());
        org.junit.jupiter.api.Assertions.assertNotNull(claims.getId());
    }

    @Test
    void rejectsTokenSignedByDifferentKey() {
        String token = token(Instant.now().plusSeconds(900),
                "b3RoZXItc2VjcmV0LWhhdC1pcy1sb25nLWVub3VnaC1mb3Itand0");

        assertThrows(ApiException.class, () -> jwtService.validateToken(token));
    }

    @Test
    void rejectsExpiredToken() {
        String token = token(Instant.now().minusSeconds(1), SECRET);

        assertThrows(ApiException.class, () -> jwtService.validateToken(token));
    }

    @Test
    void rejectsWrongIssuerAndAudience() {
        String wrongIssuer = Jwts.builder()
                .issuer("untrusted")
                .subject("42")
                .audience().add(AUDIENCE).and()
                .id("token-id")
                .issuedAt(java.util.Date.from(Instant.now().minusSeconds(1)))
                .expiration(java.util.Date.from(Instant.now().plusSeconds(900)))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET)))
                .compact();
        String wrongAudience = Jwts.builder()
                .issuer(ISSUER)
                .subject("42")
                .audience().add("other-client").and()
                .id("token-id")
                .issuedAt(java.util.Date.from(Instant.now().minusSeconds(1)))
                .expiration(java.util.Date.from(Instant.now().plusSeconds(900)))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET)))
                .compact();

        assertThrows(ApiException.class, () -> jwtService.validateToken(wrongIssuer));
        assertThrows(ApiException.class, () -> jwtService.validateToken(wrongAudience));
        verify(revokedTokenRepository, never()).existsById("token-id");
    }

    @Test
    void rejectsRevokedToken() {
        String token = token(Instant.now().plusSeconds(900), SECRET);
        when(revokedTokenRepository.existsById("token-id")).thenReturn(true);

        ApiException error = assertThrows(ApiException.class, () -> jwtService.validateToken(token));

        assertEquals("TOKEN_REVOKED", error.code());
    }

    private String token(Instant expiresAt, String secret) {
        return Jwts.builder()
                .issuer(ISSUER)
                .subject("42")
                .audience().add(AUDIENCE).and()
                .id("token-id")
                .issuedAt(java.util.Date.from(Instant.now().minusSeconds(1)))
                .expiration(java.util.Date.from(expiresAt))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret)))
                .compact();
    }
}
