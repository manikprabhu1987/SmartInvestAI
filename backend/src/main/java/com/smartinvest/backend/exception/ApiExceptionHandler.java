package com.smartinvest.backend.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final MediaType PROBLEM_JSON = MediaType.valueOf("application/problem+json");

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiProblem> handleApiException(ApiException exception) {
        return response(exception.status(), exception.code(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiProblem> handleValidation(MethodArgumentNotValidException exception) {
        String detail = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Request validation failed.");
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", detail);
    }

    @ExceptionHandler({ConstraintViolationException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class, HttpMessageNotReadableException.class})
    ResponseEntity<ApiProblem> handleMalformedRequest(Exception exception) {
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request parameters or body are invalid.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiProblem> handleConflict(DataIntegrityViolationException exception) {
        return response(HttpStatus.CONFLICT, "CONFLICT", "The requested change conflicts with existing data.");
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ApiProblem> handlePersistenceUnavailable(DataAccessException exception) {
        return response(HttpStatus.SERVICE_UNAVAILABLE, "PERSISTENCE_UNAVAILABLE",
                "The data service is temporarily unavailable.");
    }

    private ResponseEntity<ApiProblem> response(HttpStatus status, String code, String detail) {
        ApiProblem problem = ApiProblem.of(status.value(), status.getReasonPhrase(), detail, code);
        return ResponseEntity.status(status).contentType(PROBLEM_JSON).body(problem);
    }
}
