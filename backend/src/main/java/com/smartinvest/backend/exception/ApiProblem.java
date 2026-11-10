package com.smartinvest.backend.exception;

public record ApiProblem(String type, String title, int status, String detail, String code) {
    public static ApiProblem of(int status, String title, String detail, String code) {
        return new ApiProblem("about:blank", title, status, detail, code);
    }
}
