package com.smartinvest.backend.security;

import java.io.IOException;
import java.util.List;

import com.smartinvest.backend.exception.ApiException;
import com.smartinvest.backend.exception.ProblemResponseWriter;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final ProblemResponseWriter problemResponseWriter;

    public JwtAuthenticationFilter(JwtService jwtService, ProblemResponseWriter problemResponseWriter) {
        this.jwtService = jwtService;
        this.problemResponseWriter = problemResponseWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authorization.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            problemResponseWriter.write(response, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                    "Authentication is missing or invalid.");
            return;
        }

        Claims claims;
        try {
            claims = jwtService.validateToken(token);
        } catch (ApiException exception) {
            SecurityContextHolder.clearContext();
            problemResponseWriter.write(response, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                    "Authentication is missing or invalid.");
            return;
        } catch (DataAccessException exception) {
            SecurityContextHolder.clearContext();
            problemResponseWriter.write(response, HttpStatus.SERVICE_UNAVAILABLE, "PERSISTENCE_UNAVAILABLE",
                    "Authentication storage is temporarily unavailable.");
            return;
        }

        Long userId = Long.valueOf(claims.getSubject());
        var authentication = new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        chain.doFilter(request, response);
    }
}
