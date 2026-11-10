package com.smartinvest.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "watchlist_entry",
        uniqueConstraints = @UniqueConstraint(name = "uk_watchlist_user_stock",
                columnNames = {"user_id", "stock_symbol"}),
        indexes = @Index(name = "idx_watchlist_user_created", columnList = "user_id, created_at"))
public class WatchlistEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_watchlist_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_symbol", nullable = false,
            foreignKey = @ForeignKey(name = "fk_watchlist_stock"))
    private Stock stock;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected WatchlistEntry() {
    }

    public WatchlistEntry(User user, Stock stock) {
        this.user = user;
        this.stock = stock;
    }

    @PrePersist
    void setCreatedAt() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Stock getStock() {
        return stock;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
