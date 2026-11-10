package com.smartinvest.backend.dto;

import java.time.Instant;

import com.smartinvest.backend.entity.WatchlistEntry;

public record WatchlistEntryResponse(Long id, StockSummaryResponse stock, Instant addedAt) {
    public static WatchlistEntryResponse from(WatchlistEntry entry) {
        return new WatchlistEntryResponse(entry.getId(), StockSummaryResponse.from(entry.getStock()),
                entry.getCreatedAt());
    }
}
