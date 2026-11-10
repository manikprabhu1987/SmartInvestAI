package com.smartinvest.backend.dto;

import java.util.List;

public record StockSearchPageResponse(List<StockSummaryResponse> items, int page, int size, boolean hasNext) {
}
