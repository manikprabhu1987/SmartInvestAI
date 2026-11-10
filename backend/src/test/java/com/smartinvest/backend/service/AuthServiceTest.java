package com.smartinvest.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.smartinvest.backend.dto.AuthTokenResponse;
import com.smartinvest.backend.dto.UserProfileResponse;
import com.smartinvest.backend.entity.User;
import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.repository.UserRepository;
import com.smartinvest.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerNormalizesEmailAndStoresOnlyPasswordHash() {
        when(userRepository.findByEmail("investor@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("long-enough-password")).thenReturn("bcrypt-hash");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response =
                authService.register("Investor", " Investor@Example.com ", "long-enough-password");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        assertEquals("investor@example.com", userCaptor.getValue().getEmail());
        assertEquals("bcrypt-hash", userCaptor.getValue().getPasswordHash());
        assertEquals("investor@example.com", response.email());
    }

    @Test
    void registerRejectsDuplicateNormalizedEmail() {
        when(userRepository.findByEmail("investor@example.com"))
                .thenReturn(Optional.of(new User("Existing", "investor@example.com", "hash")));

        ApiException error = assertThrows(ApiException.class,
                () -> authService.register("Investor", "INVESTOR@example.com", "long-enough-password"));

        assertEquals("EMAIL_ALREADY_REGISTERED", error.code());
    }

    @Test
    void loginUsesGenericErrorForUnknownEmail() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        ApiException error = assertThrows(ApiException.class,
                () -> authService.login("unknown@example.com", "wrong-password"));

        assertEquals("INVALID_CREDENTIALS", error.code());
    }

    @Test
    void loginUsesSameGenericErrorForIncorrectPassword() {
        User user = new User("Investor", "investor@example.com", "bcrypt-hash");
        when(userRepository.findByEmail("investor@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "bcrypt-hash")).thenReturn(false);

        ApiException error = assertThrows(ApiException.class,
                () -> authService.login("investor@example.com", "wrong-password"));

        assertEquals("INVALID_CREDENTIALS", error.code());
    }

    @Test
    void loginIssuesTokenForCorrectCredentials() {
        User user = new User("Investor", "investor@example.com", "bcrypt-hash");
        user.setId(7L);
        when(userRepository.findByEmail("investor@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("long-enough-password", "bcrypt-hash")).thenReturn(true);
        when(jwtService.issueToken(7L)).thenReturn(new JwtService.IssuedToken("signed-token",
                java.time.Instant.parse("2026-11-09T12:15:00Z")));

        AuthTokenResponse response = authService.login("investor@example.com", "long-enough-password");

        assertEquals("signed-token", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(7L, response.user().id());
    }
}
