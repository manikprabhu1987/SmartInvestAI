package com.smartinvest.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddWatchlistStockRequest(@NotBlank @Size(max = 32) String symbol) {
}
