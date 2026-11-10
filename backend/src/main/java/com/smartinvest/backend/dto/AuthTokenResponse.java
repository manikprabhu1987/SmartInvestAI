package com.smartinvest.backend.dto;

import java.time.Instant;

public record AuthTokenResponse(String accessToken, String tokenType, Instant expiresAt, UserProfileResponse user) {
}
