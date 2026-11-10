package com.smartinvest.backend.dto;

import java.util.List;

public record WatchlistResponse(List<WatchlistEntryResponse> items) {
}
