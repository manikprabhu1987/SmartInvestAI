package com.smartinvest.backend.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import com.smartinvest.backend.config.JwtProperties;
import com.smartinvest.backend.entity.RevokedToken;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.RevokedTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JwtService {
    private final JwtProperties properties;
    private final RevokedTokenRepository revokedTokenRepository;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties, RevokedTokenRepository revokedTokenRepository) {
        this.properties = properties;
        this.revokedTokenRepository = revokedTokenRepository;
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret()));
        if (properties.expirationMinutes() <= 0) {
            throw new IllegalArgumentException("JWT expiration must be positive.");
        }
    }

    public IssuedToken issueToken(Long userId) {
        Instant issuedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        Instant expiresAt = issuedAt.plusSeconds(properties.expirationMinutes() * 60);
        String value = Jwts.builder()
                .issuer(properties.issuer())
                .subject(userId.toString())
                .audience().add(properties.audience()).and()
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
        return new IssuedToken(value, expiresAt);
    }

    @Transactional(readOnly = true)
    public Claims validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(properties.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            if (claims.getAudience() == null || !claims.getAudience().contains(properties.audience())
                    || claims.getId() == null || claims.getSubject() == null) {
                throw invalidToken();
            }
            Long.parseLong(claims.getSubject());
            if (revokedTokenRepository.existsById(claims.getId())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_REVOKED",
                        "This access token has been revoked.");
            }
            return claims;
        } catch (JwtException | IllegalArgumentException exception) {
            if (exception instanceof ApiException apiException) {
                throw apiException;
            }
            throw invalidToken();
        }
    }

    @Transactional
    public void revokeToken(String token) {
        Claims claims = validateToken(token);
        revokedTokenRepository.saveAndFlush(new RevokedToken(
                claims.getId(), claims.getExpiration().toInstant()));
    }

    private ApiException invalidToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                "Authentication is missing or invalid.");
    }

    public record IssuedToken(String value, Instant expiresAt) {
    }
}
