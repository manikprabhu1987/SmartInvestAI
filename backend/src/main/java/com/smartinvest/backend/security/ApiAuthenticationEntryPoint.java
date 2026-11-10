package com.smartinvest.backend.security;

import java.io.IOException;

import com.smartinvest.backend.exception.ProblemResponseWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ProblemResponseWriter problemResponseWriter;

    public ApiAuthenticationEntryPoint(ProblemResponseWriter problemResponseWriter) {
        this.problemResponseWriter = problemResponseWriter;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        problemResponseWriter.write(response, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                "Authentication is missing or invalid.");
    }
}
