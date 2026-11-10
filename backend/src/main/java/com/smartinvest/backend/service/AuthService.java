package com.smartinvest.backend.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import com.smartinvest.backend.dto.AuthTokenResponse;
import com.smartinvest.backend.dto.UserProfileResponse;
import com.smartinvest.backend.entity.User;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.UserRepository;
import com.smartinvest.backend.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final int BCRYPT_MAX_BYTES = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public UserProfileResponse register(String name, String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedName = name == null ? "" : name.trim();
        if (normalizedName.isEmpty() || password == null || password.length() < 12
                || password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Name and password do not meet the registration requirements.");
        }
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw duplicateEmail();
        }

        User user = new User(normalizedName, normalizedEmail, passwordEncoder.encode(password));
        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw duplicateEmail();
        }
        return toProfile(user);
    }

    @Transactional(readOnly = true)
    public AuthTokenResponse login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail).orElseThrow(this::invalidCredentials);
        if (password == null || password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES
                || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw invalidCredentials();
        }

        JwtService.IssuedToken token = jwtService.issueToken(user.getId());
        return new AuthTokenResponse(token.value(), "Bearer", token.expiresAt(), toProfile(user));
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Email is required.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ApiException duplicateEmail() {
        return new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED",
                "An account with this email already exists.");
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                "Email or password is incorrect.");
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail());
    }
}
